/* MR Realty — front-end + Supabase data layer (no build step).
 *
 * Security model: this is a static site, so there is no server "middleware".
 * The browser talks to Supabase directly with the public anon key, and every
 * write is enforced server-side by the Row Level Security + storage policies in
 * supabase-setup.sql (owner_id = auth.uid(), uploads only into "<uid>/...").
 * Never put a service-role key in this file.
 */
(() => {
  'use strict';

  // ---- Configuration -------------------------------------------------------
  const SUPABASE_URL = 'https://leggzefvtzqlbntrvckd.supabase.co';          // e.g. https://abcd1234.supabase.co
  const SUPABASE_ANON_KEY = 'sb_publishable_mn6as6KU_XFVsa-SeMpAWg_hjQjTOIy';     // publishable / anon key only
  const WHATSAPP_NUMBER = '971500000000'; // digits only, international format
  const BUCKET = 'property-images';
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const HOT_DEAL_BADGE = 'HOT DEAL';

  const SAMPLE_PROPERTIES = [
    { id: 's1', title: 'Marina View Residence', location: 'Dubai Marina, Dubai', type: 'Apartment', price: 3250000, beds: 2, baths: 3, badge: 'FOR SALE', description: 'A bright two-bedroom residence with uninterrupted marina views, a private balcony and resort-style amenities.', photos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1100&q=80'] },
    { id: 's2', title: 'Palm Garden Villa', location: 'Saadiyat Island, Abu Dhabi', type: 'Villa', price: 9800000, beds: 5, baths: 6, badge: 'NEW LAUNCH', description: 'A contemporary family villa with a landscaped garden, private pool and easy access to the beach.', photos: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1100&q=80'] },
    { id: 's3', title: 'Skyline Penthouse', location: 'Downtown, Dubai', type: 'Penthouse', price: 14500000, beds: 4, baths: 5, badge: 'FOR SALE', description: 'A full-floor penthouse with double-height living spaces and sweeping views of the city skyline.', photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=80'] },
    { id: 's4', title: 'Al Majaz Townhouse', location: 'Al Majaz, Sharjah', type: 'Townhouse', price: 1850000, beds: 3, baths: 3, badge: HOT_DEAL_BADGE, description: 'A well-proportioned townhouse close to the corniche, schools and everyday amenities.', photos: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1100&q=80'] },
    { id: 's5', title: 'Mina Al Arab Apartment', location: 'Mina Al Arab, Ras Al Khaimah', type: 'Apartment', price: 1150000, beds: 1, baths: 2, badge: HOT_DEAL_BADGE, description: 'A relaxed waterfront apartment with lagoon views and access to a private beach.', photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1100&q=80'] },
  ];

  // ---- Helpers -------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const aed = (n) => 'AED ' + Number(n || 0).toLocaleString('en-AE', { maximumFractionDigits: 0 });
  const photosOf = (p) => (Array.isArray(p.photos) && p.photos.length ? p.photos : p.image_url ? [p.image_url] : []);
  const safeUrl = (u) => (/^https:\/\//i.test(u || '') ? u : '');
  const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  // Accept only the project origin (e.g. https://abcd1234.supabase.co), even if
  // a path like /rest/v1/ was pasted in by mistake.
  const SUPABASE_ORIGIN = (() => { try { return new URL(SUPABASE_URL).origin; } catch { return ''; } })();
  const isConfigured = Boolean(SUPABASE_ORIGIN && SUPABASE_ANON_KEY);
  const sb = isConfigured && window.supabase
    ? window.supabase.createClient(SUPABASE_ORIGIN, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;

  // ---- Data access layer (all Supabase calls live here) ---------------------
  const db = {
    async publicListings() {
      if (!sb) return SAMPLE_PROPERTIES;
      const { data, error } = await sb.from('properties')
        .select('id,title,location,type,price,beds,baths,description,image_url,photos,badge,created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async ownerListings(uid) {
      const { data, error } = await sb.from('properties').select('*').eq('owner_id', uid).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async save(uid, id, fields) {
      const payload = { ...fields, owner_id: uid, updated_at: new Date().toISOString() };
      const q = id ? sb.from('properties').update(payload).eq('id', id).eq('owner_id', uid) : sb.from('properties').insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    async setPublished(uid, id, published) {
      const { error } = await sb.from('properties').update({ published, updated_at: new Date().toISOString() }).eq('id', id).eq('owner_id', uid);
      if (error) throw error;
    },
    async remove(uid, listing) {
      const { error } = await sb.from('properties').delete().eq('id', listing.id).eq('owner_id', uid);
      if (error) throw error;
      const paths = photosOf(listing).map(storagePath).filter((p) => p && p.startsWith(uid + '/'));
      if (paths.length) await sb.storage.from(BUCKET).remove(paths); // best effort
    },
    async upload(uid, files) {
      const urls = [];
      for (const file of files) {
        const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
      return urls;
    },
  };

  function storagePath(url) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = (url || '').indexOf(marker);
    return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
  }

  // ---- Public site ---------------------------------------------------------
  let listings = [];

  function cardHtml(p) {
    const img = safeUrl(photosOf(p)[0]);
    return `<article class="property-card">
      <div class="property-image" data-open="${esc(p.id)}">
        ${img ? `<img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy">` : ''}
        <span class="property-badge">${esc(p.badge || 'FOR SALE')}</span>
      </div>
      <div class="property-info">
        <p class="property-location">${esc(p.location)}</p>
        <h3 class="property-title" data-open="${esc(p.id)}">${esc(p.title)}</h3>
        <div class="property-meta"><span>${esc(p.type)}</span><span>${Number(p.beds)} Beds</span><span>${Number(p.baths)} Baths</span></div>
        <div class="property-price-row"><span class="property-price">${aed(p.price)}</span><a class="details-link" href="#" data-open="${esc(p.id)}">View details ↗</a></div>
      </div>
    </article>`;
  }

  function render() {
    const loc = $('filter-location').value.toLowerCase();
    const type = $('filter-type').value;
    const max = Number($('filter-price').value) || Infinity;
    const match = (p) => (!loc || p.location.toLowerCase().includes(loc)) && (!type || p.type === type) && Number(p.price) <= max;
    const featured = listings.filter((p) => p.badge !== HOT_DEAL_BADGE && match(p));
    const deals = listings.filter((p) => p.badge === HOT_DEAL_BADGE && match(p));
    $('featured-grid').innerHTML = featured.map(cardHtml).join('');
    $('deals-grid').innerHTML = deals.map(cardHtml).join('');
    $('empty-state').hidden = featured.length > 0;
    $('deals-empty-state').hidden = deals.length > 0;
  }

  function openProperty(id) {
    const p = listings.find((x) => String(x.id) === String(id));
    if (!p) return;
    const photos = photosOf(p).map(safeUrl).filter(Boolean);
    $('property-detail').innerHTML = `
      <div class="detail-image">${photos[0] ? `<img id="detail-main" src="${esc(photos[0])}" alt="${esc(p.title)}">` : ''}</div>
      ${photos.length > 1 ? `<div class="detail-thumbnails">${photos.map((u, i) => `<button type="button" class="detail-thumbnail${i ? '' : ' active'}" data-photo="${esc(u)}" aria-label="Photo ${i + 1}"><img src="${esc(u)}" alt=""></button>`).join('')}</div>` : ''}
      <div class="detail-copy">
        <p class="eyebrow">${esc(p.location)}</p>
        <h2 id="dialog-title">${esc(p.title)}</h2>
        <p class="detail-price">${aed(p.price)}</p>
        <p>${esc(p.type)} · ${Number(p.beds)} Beds · ${Number(p.baths)} Baths</p>
        <p>${esc(p.description)}</p>
        <a class="button button-gold" target="_blank" rel="noopener" href="${esc(waLink(`Hi MR Realty, I'm interested in "${p.title}" (${p.location}, ${aed(p.price)}).`))}">Enquire on WhatsApp ↗</a>
      </div>`;
    $('property-dialog').showModal();
  }

  async function loadListings() {
    try {
      listings = await db.publicListings();
    } catch (err) {
      console.error('Could not load listings', err);
      listings = SAMPLE_PROPERTIES;
    }
    render();
  }

  // ---- Owner dashboard -----------------------------------------------------
  let session = null;
  let ownerRows = [];

  function status(msg, isError = false) {
    const el = $('dashboard-status');
    el.textContent = msg || '';
    el.hidden = !msg;
    el.classList.toggle('error', isError);
  }

  function showDashboardState() {
    if (!sb) {
      status('Supabase is not connected yet. Add SUPABASE_URL and SUPABASE_ANON_KEY in app.js to enable the owner dashboard.', true);
      $('login-form').hidden = true;
      $('dashboard-manager').hidden = true;
      return;
    }
    $('login-form').hidden = Boolean(session);
    $('dashboard-manager').hidden = !session;
    if (session) { status(`Signed in as ${session.user.email}`); loadOwnerListings(); }
    else status('Sign in with your owner account to manage listings.');
  }

  async function loadOwnerListings() {
    try {
      ownerRows = await db.ownerListings(session.user.id);
      $('managed-listings').innerHTML = ownerRows.length ? ownerRows.map((p) => `
        <div class="managed-row">
          <div><strong>${esc(p.title)}</strong><p>${esc(p.location)} · ${aed(p.price)} · ${esc(p.badge)} · ${p.published ? 'Published' : 'Draft'}</p></div>
          <div class="managed-row-actions">
            <button class="small-action" type="button" data-edit="${esc(p.id)}">Edit</button>
            <button class="small-action" type="button" data-toggle="${esc(p.id)}">${p.published ? 'Unpublish' : 'Publish'}</button>
            <button class="small-action" type="button" data-delete="${esc(p.id)}">Delete</button>
          </div>
        </div>`).join('') : '<p class="empty-state">No listings yet. Add your first property above.</p>';
    } catch (err) {
      status('Could not load your listings: ' + err.message, true);
    }
  }

  function resetForm() {
    $('listing-form').reset();
    $('listing-id').value = '';
    $('listing-form-heading').textContent = 'Add a property';
    $('cancel-edit').hidden = true;
  }

  function fillForm(p) {
    $('listing-id').value = p.id;
    $('listing-title').value = p.title;
    $('listing-location').value = p.location;
    $('listing-type').value = p.type;
    $('listing-price').value = p.price;
    $('listing-beds').value = p.beds;
    $('listing-baths').value = p.baths;
    $('listing-description').value = p.description;
    $('listing-badge').value = p.badge || 'FOR SALE';
    $('listing-published').checked = p.published;
    $('listing-form-heading').textContent = 'Edit property';
    $('cancel-edit').hidden = false;
    $('listing-form').scrollIntoView({ behavior: 'smooth' });
  }

  async function saveListing(e) {
    e.preventDefault();
    if (!session) return;
    const uid = session.user.id;
    const id = $('listing-id').value || null;
    const existing = id ? ownerRows.find((r) => r.id === id) : null;
    const files = [...$('listing-images').files];

    const bad = files.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_BYTES);
    if (bad) return status(`"${bad.name}" must be a JPG, PNG or WebP under 10 MB.`, true);
    if (!existing && !files.length) return status('Add at least one photo for a new listing.', true);

    const btn = $('save-listing');
    btn.disabled = true;
    status(files.length ? `Uploading ${files.length} photo(s)…` : 'Saving…');
    try {
      const uploaded = files.length ? await db.upload(uid, files) : [];
      const photos = [...(existing ? photosOf(existing) : []), ...uploaded];
      await db.save(uid, id, {
        title: $('listing-title').value.trim(),
        location: $('listing-location').value.trim(),
        type: $('listing-type').value,
        price: Number($('listing-price').value),
        beds: Number($('listing-beds').value),
        baths: Number($('listing-baths').value),
        description: $('listing-description').value.trim(),
        badge: $('listing-badge').value,
        published: $('listing-published').checked,
        photos,
        image_url: photos[0],
      });
      resetForm();
      status('Listing saved.');
      await Promise.all([loadOwnerListings(), loadListings()]);
    } catch (err) {
      status('Could not save listing: ' + err.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  async function onManagedClick(e) {
    const t = e.target.closest('button');
    if (!t || !session) return;
    const uid = session.user.id;
    const row = ownerRows.find((r) => r.id === (t.dataset.edit || t.dataset.toggle || t.dataset.delete));
    if (!row) return;
    try {
      if (t.dataset.edit) return fillForm(row);
      if (t.dataset.toggle) await db.setPublished(uid, row.id, !row.published);
      if (t.dataset.delete) {
        if (t.dataset.confirm !== 'yes') { t.dataset.confirm = 'yes'; t.textContent = 'Confirm delete'; return; }
        await db.remove(uid, row);
        if ($('listing-id').value === row.id) resetForm();
      }
      await Promise.all([loadOwnerListings(), loadListings()]);
    } catch (err) {
      status('Action failed: ' + err.message, true);
    }
  }

  // ---- Wiring --------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    $('year').textContent = new Date().getFullYear();

    document.querySelectorAll('[data-whatsapp]').forEach((a) => {
      a.href = waLink("Hi MR Realty, I'd like to know more about your properties.");
      a.target = '_blank';
      a.rel = 'noopener';
    });

    $('menu-toggle').addEventListener('click', () => {
      const open = $('main-nav').classList.toggle('open');
      $('menu-toggle').setAttribute('aria-expanded', String(open));
    });
    $('main-nav').addEventListener('click', (e) => { if (e.target.tagName === 'A') $('main-nav').classList.remove('open'); });

    $('search-form').addEventListener('submit', (e) => { e.preventDefault(); render(); $('properties').scrollIntoView({ behavior: 'smooth' }); });

    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-open]');
      if (opener) { e.preventDefault(); openProperty(opener.dataset.open); }
      const thumb = e.target.closest('[data-photo]');
      if (thumb) {
        $('detail-main').src = thumb.dataset.photo;
        document.querySelectorAll('.detail-thumbnail').forEach((b) => b.classList.toggle('active', b === thumb));
      }
    });
    document.querySelector('[data-close-dialog]').addEventListener('click', () => $('property-dialog').close());
    document.querySelector('[data-close-dashboard]').addEventListener('click', () => $('dashboard-dialog').close());

    $('owner-login-button').addEventListener('click', () => { showDashboardState(); $('dashboard-dialog').showModal(); });

    $('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      status('Signing in…');
      const { error } = await sb.auth.signInWithPassword({ email: $('login-email').value.trim(), password: $('login-password').value });
      if (error) status(error.message, true);
      $('login-password').value = '';
    });
    $('logout-button').addEventListener('click', () => sb.auth.signOut());
    $('listing-form').addEventListener('submit', saveListing);
    $('cancel-edit').addEventListener('click', resetForm);
    $('managed-listings').addEventListener('click', onManagedClick);

    if (sb) {
      const { data } = await sb.auth.getSession();
      session = data.session;
      sb.auth.onAuthStateChange((_event, s) => {
        session = s;
        if ($('dashboard-dialog').open) showDashboardState();
        if (!s) resetForm();
      });
    }

    loadListings();
  });
})();
