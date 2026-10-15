// Public anon key only. Never put a Supabase service-role key in browser code.
const SUPABASE_URL = "https://leggzefvtzqlbntrvckd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mn6as6KU_XFVsa-SeMpAWg_hjQjTOIy";
const WHATSAPP_NUMBER = "971588593844";

const starterProperties = [
  {
    id: "home-1", title: "Skyline Residence, Downtown", location: "Downtown Dubai, Dubai",
    type: "Apartment", price: 2850000, beds: 2, baths: 2, area: 1420,
    image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=82",
    photos: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85"
    ],
    description: "An elegant city residence with floor-to-ceiling windows, considered finishes and sweeping views across Downtown Dubai. Moments from world-class dining, retail and transport.", published: true, badge: "HOT DEAL"
  },
  {
    id: "home-2", title: "The Address Beachfront", location: "Jumeirah Beach Residence, Dubai",
    type: "Apartment", price: 3900000, beds: 2, baths: 3, area: 1680,
    image_url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=82",
    photos: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85"
    ],
    description: "Wake up to the sea in this refined beachfront home. Enjoy resort-style amenities, a generous private balcony and direct access to the best of JBR.", published: true, badge: "LIMITED UNITS"
  },
  {
    id: "home-3", title: "Garden Villa at Saadiyat", location: "Saadiyat Island, Abu Dhabi",
    type: "Villa", price: 6250000, beds: 4, baths: 5, area: 3560,
    image_url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=82",
    photos: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85"
    ],
    description: "A light-filled family villa set close to the shoreline and cultural district. Beautifully proportioned living spaces open onto a private landscaped garden.", published: true, badge: "HOT DEAL"
  },
  {
    id: "home-4", title: "Marina View Penthouse", location: "Dubai Marina, Dubai",
    type: "Penthouse", price: 8900000, beds: 4, baths: 5, area: 4120,
    image_url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=82",
    description: "A rare upper-floor home with a private terrace, generous entertaining spaces and panoramic views over the marina and Arabian Gulf.", published: true, badge: "RARE FIND"
  },
  {
    id: "home-5", title: "The Grove Townhouse", location: "Aljada, Sharjah",
    type: "Townhouse", price: 1850000, beds: 3, baths: 4, area: 2180,
    image_url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=82",
    description: "Contemporary townhouse living with room to grow. A practical open layout, private outdoor space and a lively community close to schools and everyday essentials.", published: true, badge: "NEW RELEASE"
  },
  {
    id: "home-6", title: "Al Marjan Island Escape", location: "Al Marjan Island, Ras Al Khaimah",
    type: "Apartment", price: 1650000, beds: 1, baths: 2, area: 960,
    image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=82",
    description: "A calm coastal retreat on Al Marjan Island, with resort-inspired facilities and the shoreline just beyond your door. Ideal as a holiday home or considered investment.", published: true, badge: "INVESTMENT"
  }
];

const configReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const $ = (selector) => document.querySelector(selector);
const state = {
  properties: [], user: null, accessToken: null, ownerId: null,
  settings: null, companySettingsExists: false
};

const countryCodes = [
  ["United Arab Emirates", "971"], ["Saudi Arabia", "966"], ["Qatar", "974"], ["Kuwait", "965"], ["Bahrain", "973"], ["Oman", "968"],
  ["India", "91"], ["Pakistan", "92"], ["Bangladesh", "880"], ["Sri Lanka", "94"], ["Nepal", "977"], ["Philippines", "63"],
  ["United Kingdom", "44"], ["United States / Canada", "1"], ["Australia", "61"], ["Ireland", "353"], ["France", "33"],
  ["Germany", "49"], ["Italy", "39"], ["Spain", "34"], ["Switzerland", "41"], ["Netherlands", "31"], ["Russia", "7"],
  ["Turkey", "90"], ["Egypt", "20"], ["Jordan", "962"], ["Lebanon", "961"], ["Iraq", "964"], ["Iran", "98"],
  ["Nigeria", "234"], ["South Africa", "27"], ["Kenya", "254"], ["China", "86"], ["Hong Kong", "852"], ["Singapore", "65"],
  ["Malaysia", "60"], ["Indonesia", "62"], ["Japan", "81"], ["South Korea", "82"], ["Brazil", "55"], ["Mexico", "52"]
];

function fillWhatsAppField(number) {
  const select = $("#quick-whatsapp-code");
  if (!select.options.length) {
    select.innerHTML = countryCodes.map(([name, code]) => `<option value="${code}">${escapeHTML(name)} (+${code})</option>`).join("");
  }
  const digits = String(number || "").replace(/\D/g, "");
  const match = countryCodes.map(([, code]) => code).filter((code) => digits.startsWith(code)).sort((a, b) => b.length - a.length)[0];
  select.value = match || "971";
  $("#quick-whatsapp").value = match ? digits.slice(match.length) : digits;
}

const defaultSiteContent = {
  hero_eyebrow: "LUXURY LIVING IN THE UAE",
  hero_caption: "A city built for what comes next",
  hero_image_url: "",
  listings_eyebrow: "A PLACE TO CALL YOURS",
  listings_heading: "Featured Homes",
  deals_eyebrow: "LIMITED OPPORTUNITIES",
  deals_heading: "Today’s Hot Deals",
  launch_eyebrow: "THE NEXT CHAPTER STARTS HERE",
  launch_heading: "Find your place in what’s next.",
  launch_text: "Explore handpicked residences, standout new launches, and considered investment opportunities throughout the UAE.",
  launch_button: "Explore our collection",
  launch_image_url: "",
  contact_eyebrow: "LET’S FIND YOUR NEXT MOVE",
  value_1_title: "Know the market",
  value_1_text: "Clear, considered advice shaped by a deep understanding of the UAE property landscape.",
  value_2_title: "Find your fit",
  value_2_text: "A carefully selected range of homes and investments, tailored around what matters to you.",
  value_3_title: "Move with confidence",
  value_3_text: "Personal support from your first conversation through to the keys in your hand."
};
const siteTextTargets = {
  hero_eyebrow: "#hero-eyebrow", hero_caption: "#hero-caption", listings_eyebrow: "#listings-eyebrow",
  listings_heading: "#listings-heading", deals_eyebrow: "#deals-eyebrow", deals_heading: "#deals-heading",
  launch_eyebrow: "#launch-eyebrow", launch_heading: "#launch-heading", launch_text: "#launch-text",
  launch_button: "#launch-button", contact_eyebrow: "#contact-eyebrow",
  value_1_title: "#value-1-title", value_1_text: "#value-1-text", value_2_title: "#value-2-title",
  value_2_text: "#value-2-text", value_3_title: "#value-3-title", value_3_text: "#value-3-text"
};
const siteImageTargets = { hero_image_url: "#hero-image", launch_image_url: "#launch-image" };
const siteImageDefaults = {};

const defaultCompanySettings = {
  company_name: "MR Realty",
  tagline: "THE MR REALTY DIFFERENCE",
  logo_url: "",
  about_text: "A carefully selected range of homes and investments, tailored around what matters to you.",
  business_phone: "",
  whatsapp_number: WHATSAPP_NUMBER,
  contact_email: "",
  office_address: "",
  website_headline: "Discover Exceptional Properties Across the UAE.",
  homepage_introduction: "From waterfront residences in Dubai to family villas in Abu Dhabi and lifestyle homes across the Emirates, MR Realty curates exceptional opportunities for buyers, investors, and families.",
  about_heading: "Property, with a personal perspective.",
  about_summary: "Local insight. Thoughtful guidance. A real person at every step.",
  contact_heading: "Good things start with a conversation.",
  contact_text: "Tell us what you’re looking for. We’ll help you find the right place, at the right pace.",
  instagram_url: "",
  facebook_url: "",
  linkedin_url: "",
  footer_text: "Thoughtful property guidance across the UAE."
};

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(Number(price) || 0);
}

function propertyPhotos(property) {
  const photos = Array.isArray(property.photos) ? property.photos : [];
  return [...new Set([property.image_url, ...photos].filter((photo) => typeof photo === "string" && photo.trim()))];
}

function whatsappURL(message = "Hello MR Realty, I'm interested in learning more about your properties.") {
  const number = (state.settings?.whatsapp_number || WHATSAPP_NUMBER).replace(/\D/g, "");
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function setWhatsAppLinks() {
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.href = whatsappURL();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

function loadPreviewProperties() {
  try {
    const saved = localStorage.getItem("mr-realty-preview-properties");
    return saved ? JSON.parse(saved) : starterProperties;
  } catch (error) {
    console.error("Unable to load saved preview listings:", error);
    return starterProperties;
  }
}

function savePreviewProperties() {
  localStorage.setItem("mr-realty-preview-properties", JSON.stringify(state.properties));
}

async function supabaseRequest(path, options = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${state.accessToken || SUPABASE_ANON_KEY}`,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers
  };
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${details}`);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

async function loadPublicProperties() {
  if (!configReady) {
    state.properties = loadPreviewProperties();
    return;
  }
  try {
    const rows = await supabaseRequest("/rest/v1/properties?select=*&published=eq.true&order=created_at.desc");
    state.properties = rows;
  } catch (error) {
    console.error(error);
    showNotice("Listings could not be loaded from Supabase. Check the connection and try again.", true);
  }
}

function applyCompanySettings(settings) {
  const values = { ...defaultCompanySettings, ...settings };
  state.settings = values;
  applySiteContent(values.site_content);
  $("#website-headline").textContent = values.website_headline;
  $("#website-introduction").textContent = values.homepage_introduction;
  $("#about-tagline").textContent = values.tagline || "THE MR REALTY DIFFERENCE";
  $("#about-heading").textContent = values.about_heading;
  $("#about-summary").textContent = values.about_summary;
  $("#about-copy").textContent = values.about_text;
  $("#contact-heading").textContent = values.contact_heading;
  $("#contact-copy").textContent = values.contact_text;
  $("#footer-copy").textContent = values.footer_text;
  $("#footer-company-name").textContent = values.company_name;

  [$("#header-logo"), $("#footer-logo")].forEach((image) => {
    if (values.logo_url) image.src = values.logo_url;
    image.alt = `${values.company_name}${values.tagline ? ` — ${values.tagline}` : ""}`;
  });

  const details = [];
  if (values.business_phone) {
    details.push(`<a href="tel:${escapeHTML(values.business_phone.replace(/[^\d+]/g, ""))}">${escapeHTML(values.business_phone)}</a>`);
  }
  if (values.contact_email) {
    details.push(`<a href="mailto:${escapeHTML(values.contact_email)}">${escapeHTML(values.contact_email)}</a>`);
  }
  if (values.office_address) details.push(`<span>${escapeHTML(values.office_address)}</span>`);
  $("#contact-details").innerHTML = details.join("");
  $("#footer-contact").innerHTML = details.join("");

  const socialNetworks = [
    ["Instagram", values.instagram_url],
    ["Facebook", values.facebook_url],
    ["LinkedIn", values.linkedin_url]
  ];
  $("#footer-socials").innerHTML = socialNetworks.filter(([, url]) => url).map(([name, url]) => {
    let parsed;
    try { parsed = new URL(url); } catch { return ""; }
    if (!["https:", "http:"].includes(parsed.protocol)) return "";
    return `<a href="${escapeHTML(parsed.href)}" target="_blank" rel="noopener noreferrer">${name}</a>`;
  }).join("");

  setWhatsAppLinks();
}

function applySiteContent(content) {
  const values = { ...defaultSiteContent, ...(content || {}) };
  Object.entries(siteTextTargets).forEach(([key, selector]) => {
    const element = $(selector);
    if (element) element.textContent = values[key] || defaultSiteContent[key];
  });
  Object.entries(siteImageTargets).forEach(([key, selector]) => {
    const image = $(selector);
    if (!image) return;
    if (!(selector in siteImageDefaults)) siteImageDefaults[selector] = image.getAttribute("src");
    image.src = values[key] || siteImageDefaults[selector];
  });
}

function fillSiteContentForm() {
  const values = { ...defaultSiteContent, ...(state.settings?.site_content || {}) };
  Object.keys(siteTextTargets).forEach((key) => {
    $(`#content-${key.replace(/_/g, "-")}`).value = values[key] || "";
  });
}

async function persistSettings(patch) {
  const current = state.settings || defaultCompanySettings;
  const { site_content: currentContent, ...rest } = current;
  const body = { ...rest, id: true, ...patch };
  delete body.updated_at;
  await supabaseRequest(state.companySettingsExists ? "/rest/v1/company_settings?id=eq.true" : "/rest/v1/company_settings", {
    method: state.companySettingsExists ? "PATCH" : "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(body)
  });
  await loadCompanySettings();
}

async function saveWhatsAppNumber(event) {
  event.preventDefault();
  const button = $("#save-whatsapp");
  const digits = $("#quick-whatsapp-code").value + $("#quick-whatsapp").value.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < 8 || digits.length > 15) {
    showNotice("Enter a valid WhatsApp number (without the country code or leading 0).", true);
    return;
  }
  button.disabled = true;
  try {
    await persistSettings({ whatsapp_number: digits });
    fillWhatsAppField(digits);
    $("#settings-whatsapp").value = digits;
    showNotice("WhatsApp number saved. All homepage WhatsApp buttons now open your chat.");
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function saveSiteContent(event, restoreDefaults = false) {
  if (event) event.preventDefault();
  const saveButton = $("#save-site-content");
  saveButton.disabled = true;
  showNotice("Saving photos and headlines…");
  try {
    const existing = state.settings?.site_content || {};
    let content = {};
    if (!restoreDefaults) {
      content = { ...existing };
      Object.keys(siteTextTargets).forEach((key) => {
        const value = $(`#content-${key.replace(/_/g, "-")}`).value.trim();
        if (value && value !== defaultSiteContent[key]) content[key] = value; else delete content[key];
      });
      for (const key of Object.keys(siteImageTargets)) {
        const input = $(`#content-${key.replace(/_url$/, "").replace(/_/g, "-")}`);
        const file = input?.files[0];
        if (!file) continue;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
          throw new Error("Photos must be JPG, PNG or WebP files no larger than 10 MB.");
        }
        content[key] = await uploadImage(file);
      }
    }
    await persistSettings({ site_content: content });
    ["#content-hero-image", "#content-launch-image"].forEach((selector) => { $(selector).value = ""; });
    fillSiteContentForm();
    showNotice(restoreDefaults ? "Website photos and headlines restored to defaults." : "Photos and headlines saved and published.");
  } catch (error) {
    showNotice(error.message.includes("site_content") ? "Run the latest supabase-setup.sql in Supabase (it adds the site_content column), then try again." : error.message, true);
  } finally {
    saveButton.disabled = false;
  }
}

async function loadCompanySettings() {
  if (!configReady) {
    applyCompanySettings(defaultCompanySettings);
    return;
  }
  const rows = await supabaseRequest("/rest/v1/company_settings?select=*&id=eq.true&limit=1");
  state.companySettingsExists = rows.length > 0;
  applyCompanySettings(rows[0] || defaultCompanySettings);
}

function fillCompanySettingsForm() {
  const settings = state.settings || defaultCompanySettings;
  const fields = {
    "settings-company-name": "company_name",
    "settings-tagline": "tagline",
    "settings-phone": "business_phone",
    "settings-whatsapp": "whatsapp_number",
    "settings-email": "contact_email",
    "settings-address": "office_address",
    "settings-headline": "website_headline",
    "settings-introduction": "homepage_introduction",
    "settings-about": "about_text",
    "settings-about-heading": "about_heading",
    "settings-about-summary": "about_summary",
    "settings-contact-heading": "contact_heading",
    "settings-contact-copy": "contact_text",
    "settings-instagram": "instagram_url",
    "settings-facebook": "facebook_url",
    "settings-linkedin": "linkedin_url",
    "settings-footer": "footer_text"
  };
  Object.entries(fields).forEach(([selector, property]) => {
    $(`#${selector}`).value = settings[property] || "";
  });
  $("#current-logo-label").textContent = settings.logo_url
    ? "A company logo is currently saved. Upload a new image to replace it."
    : "No uploaded logo yet; the bundled MR Realty logo is currently shown.";
}

async function saveCompanySettings(event) {
  event.preventDefault();
  const saveButton = $("#save-company-settings");
  saveButton.disabled = true;
  showNotice("Saving company settings…");
  try {
    const logoFile = $("#settings-logo").files[0];
    if (logoFile && (!["image/jpeg", "image/png", "image/webp"].includes(logoFile.type) || logoFile.size > 10 * 1024 * 1024)) {
      throw new Error("The logo must be a JPG, PNG or WebP image no larger than 10 MB.");
    }

    const read = (selector) => $(selector).value.trim();
    const nextSettings = {
      id: true,
      company_name: read("#settings-company-name"),
      tagline: read("#settings-tagline"),
      logo_url: state.settings?.logo_url || "",
      about_text: read("#settings-about"),
      business_phone: read("#settings-phone"),
      whatsapp_number: read("#settings-whatsapp").replace(/\D/g, ""),
      contact_email: read("#settings-email"),
      office_address: read("#settings-address"),
      website_headline: read("#settings-headline"),
      homepage_introduction: read("#settings-introduction"),
      about_heading: read("#settings-about-heading"),
      about_summary: read("#settings-about-summary"),
      contact_heading: read("#settings-contact-heading"),
      contact_text: read("#settings-contact-copy"),
      instagram_url: read("#settings-instagram"),
      facebook_url: read("#settings-facebook"),
      linkedin_url: read("#settings-linkedin"),
      footer_text: read("#settings-footer")
    };
    if (state.settings && "site_content" in state.settings) nextSettings.site_content = state.settings.site_content;

    for (const field of ["instagram_url", "facebook_url", "linkedin_url"]) {
      if (!nextSettings[field]) continue;
      let url;
      try { url = new URL(nextSettings[field]); } catch {
        throw new Error("Social media links must be valid HTTP or HTTPS URLs.");
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Social media links must use HTTP or HTTPS.");
      }
      nextSettings[field] = url.href;
    }

    if (logoFile) nextSettings.logo_url = await uploadImage(logoFile);
    const path = state.companySettingsExists
      ? "/rest/v1/company_settings?id=eq.true"
      : "/rest/v1/company_settings";
    await supabaseRequest(path, {
      method: state.companySettingsExists ? "PATCH" : "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(nextSettings)
    });
    $("#settings-logo").value = "";
    await loadCompanySettings();
    applyCompanySettings(state.settings);
    fillCompanySettingsForm();
    showNotice("Company settings saved and published.");
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    saveButton.disabled = false;
  }
}

function listingCard(property) {
  const id = escapeHTML(property.id);
  const title = escapeHTML(property.title);
  const location = escapeHTML(property.location);
  const image = escapeHTML(property.image_url || "");
  const type = escapeHTML(property.type || "Property");
  const badge = escapeHTML(property.badge || "FOR SALE");
  return `<article class="property-card">
    <div class="property-image" role="button" tabindex="0" data-property="${id}" aria-label="View ${title}">
      <img src="${image}" alt="${title}" loading="lazy">
      <span class="property-badge">${badge}</span>
    </div>
    <div class="property-info">
      <p class="property-location">${location}</p>
      <h3 class="property-title" role="button" tabindex="0" data-property="${id}">${title}</h3>
      <div class="property-meta"><span>${type}</span><span>${Number(property.beds) || 0} Beds</span><span>${Number(property.baths) || 0} Baths</span></div>
      <div class="property-price-row"><span class="property-price">AED ${formatPrice(property.price)}</span><a class="details-link" href="#" data-property="${id}">View details ↗</a></div>
    </div>
  </article>`;
}

function renderProperties() {
  const location = $("#filter-location").value.toLowerCase();
  const type = $("#filter-type").value.toLowerCase();
  const maxPrice = Number($("#filter-price").value) || Infinity;
  const matches = state.properties.filter((property) =>
    (!location || property.location.toLowerCase().includes(location)) &&
    (!type || property.type.toLowerCase() === type) &&
    Number(property.price) <= maxPrice
  );
  const selectedFeatured = matches.filter((property) => property.is_featured);
  const featured = selectedFeatured.length ? selectedFeatured : matches;
  $("#featured-grid").innerHTML = featured.length ? featured.map(listingCard).join("") : "";
  $("#empty-state").hidden = matches.length > 0;
  const deals = matches.filter((property) => property.is_hot_deal || property.badge?.toLowerCase() === "hot deal");
  $("#deals-grid").innerHTML = deals.map(listingCard).join("");
  $("#deals-empty-state").hidden = deals.length > 0;
}

function openProperty(id) {
  const property = state.properties.find((item) => String(item.id) === String(id));
  if (!property) return;
  $("#property-dialog").dataset.propertyId = String(property.id);
  const photos = propertyPhotos(property);
  $("#property-detail").innerHTML = `<div class="detail-gallery">
      <div class="detail-image"><img id="detail-main-image" src="${escapeHTML(photos[0] || "")}" alt="${escapeHTML(property.title)} photo 1 of ${photos.length}"></div>
      ${photos.length > 1 ? `<div class="detail-thumbnails" aria-label="Property photos">${photos.map((photo, index) => `<button class="detail-thumbnail${index === 0 ? " active" : ""}" type="button" data-gallery-index="${index}" aria-label="Show photo ${index + 1}" aria-pressed="${index === 0}"><img src="${escapeHTML(photo)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
    </div>
    <div class="detail-copy"><p class="eyebrow">${escapeHTML(property.location)} · ${escapeHTML(property.type)}</p>
      <h2 id="dialog-title">${escapeHTML(property.title)}</h2><p class="detail-price">AED ${formatPrice(property.price)}</p>
      <div class="property-meta"><span>${Number(property.beds) || 0} Bedrooms</span><span>${Number(property.baths) || 0} Bathrooms</span>${property.area ? `<span>${formatPrice(property.area)} sq ft</span>` : ""}</div>
      ${property.launch_date ? `<p>Launch date: ${escapeHTML(property.launch_date)}</p>` : ""}
      ${property.reservation_amount ? `<p>Reservation amount: AED ${formatPrice(property.reservation_amount)}</p>` : ""}
      <p>${escapeHTML(property.description || "Contact our team for further information.")}</p>
      <a class="button button-gold" href="${whatsappURL(`Hello MR Realty, I'm interested in ${property.title} in ${property.location}.`)}" target="_blank" rel="noopener noreferrer">Enquire on WhatsApp ↗</a>
    </div>`;
  $("#property-dialog").showModal();
}

function showGalleryPhoto(index) {
  const propertyId = $("#property-dialog").dataset.propertyId;
  const property = state.properties.find((item) => String(item.id) === propertyId);
  if (!property) return;
  const photos = propertyPhotos(property);
  if (!photos[index]) return;
  const image = $("#detail-main-image");
  image.src = photos[index];
  image.alt = `${property.title} photo ${index + 1} of ${photos.length}`;
  $("#property-detail").querySelectorAll("[data-gallery-index]").forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function showNotice(message, isError = false) {
  const notice = $("#dashboard-status");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = !message;
}

function showDashboardState() {
  $("#dashboard-dialog").showModal();
  if (!configReady) {
    $("#login-form").hidden = true;
    $("#dashboard-manager").hidden = true;
    showNotice("Connect your Supabase project in app.js and run supabase-setup.sql to enable owner sign-in and listing management. This preview has no shared database; its example listings are for display only.");
    return;
  }
  if (state.accessToken && state.user) {
    $("#login-form").hidden = true;
    $("#dashboard-manager").hidden = false;
    showNotice(`Signed in as ${state.user.email}. Listing changes are protected by Supabase Row Level Security.`);
    fillCompanySettingsForm();
    fillSiteContentForm();
    fillWhatsAppField(state.settings?.whatsapp_number || WHATSAPP_NUMBER);
    renderManagedListings();
  } else {
    $("#login-form").hidden = false;
    $("#dashboard-manager").hidden = true;
    showNotice("Sign in with an owner account created in your Supabase project.");
  }
}

async function signIn(event) {
  event.preventDefault();
  const submitButton = $("#login-form button[type=submit]");
  submitButton.disabled = true;
  showNotice("Signing in…");
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: $("#login-email").value.trim(), password: $("#login-password").value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.msg || result.message || "Check your email and password.");
    state.accessToken = result.access_token;
    state.user = result.user;
    state.ownerId = result.user.id;
    $("#login-password").value = "";
    await loadManagedListings();
    showDashboardState();
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
}

async function loadManagedListings() {
  const rows = await supabaseRequest("/rest/v1/properties?select=*&order=created_at.desc");
  state.managedProperties = rows;
  renderManagedListings();
}

function renderManagedListings() {
  const properties = state.managedProperties || [];
  $("#managed-listings").innerHTML = properties.length ? properties.map((property) => `
    <div class="managed-row"><div><strong>${escapeHTML(property.title)}</strong><p>${escapeHTML(property.location)} · AED ${formatPrice(property.price)} · ${property.published ? "Published" : "Draft"}${property.is_featured ? " · Featured" : ""}${property.is_hot_deal ? " · Hot Deal" : ""}${property.launch_date ? ` · Launch ${escapeHTML(property.launch_date)}` : ""}</p></div>
      <div class="managed-row-actions"><button class="small-action" type="button" data-edit="${escapeHTML(property.id)}">Edit</button>
      <button class="small-action" type="button" data-publish="${escapeHTML(property.id)}" data-state="${property.published ? "true" : "false"}">${property.published ? "Unpublish" : "Publish"}</button>
      <button class="small-action" type="button" data-delete="${escapeHTML(property.id)}">Remove</button></div></div>`).join("") : `<p class="empty-state">No listings yet. Add your first property above.</p>`;
}

function resetListingForm() {
  $("#listing-form").reset();
  $("#listing-id").value = "";
  $("#listing-form-heading").textContent = "Add a property";
  $("#save-listing").textContent = "Save listing";
  $("#cancel-edit").hidden = true;
  state.editingPhotos = [];
  renderExistingPhotos();
  $("#listing-published").checked = false;
  $("#listing-beds").value = "2";
  $("#listing-baths").value = "2";
  $("#listing-launch-date").value = "";
  $("#listing-reservation-amount").value = "";
  $("#listing-badge").value = "FOR SALE";
  $("#listing-hot-deal").checked = false;
  $("#listing-featured").checked = false;
}

function renderExistingPhotos() {
  const box = $("#existing-photos");
  const photos = state.editingPhotos || [];
  box.hidden = !photos.length;
  box.innerHTML = photos.length ? `<span class="field-hint">Current photos — the first is the cover. Use “Make cover” or “Remove” to arrange them.</span><div class="photo-strip">${photos.map((photo, index) => `<figure><img src="${escapeHTML(photo)}" alt="Photo ${index + 1}"><figcaption>${index === 0 ? "Cover" : `<button type="button" class="small-action" data-cover="${index}">Make cover</button>`}<button type="button" class="small-action" data-remove-photo="${index}">Remove</button></figcaption></figure>`).join("")}</div>` : "";
}

function fillListingForm(property) {
  $("#listing-id").value = property.id;
  $("#listing-title").value = property.title || "";
  $("#listing-location").value = property.location || "";
  $("#listing-type").value = property.type || "Apartment";
  $("#listing-price").value = property.price || "";
  $("#listing-beds").value = property.beds || 0;
  $("#listing-baths").value = property.baths || 0;
  $("#listing-launch-date").value = property.launch_date || "";
  $("#listing-reservation-amount").value = property.reservation_amount ?? "";
  $("#listing-badge").value = property.badge || "FOR SALE";
  $("#listing-description").value = property.description || "";
  $("#listing-published").checked = Boolean(property.published);
  $("#listing-hot-deal").checked = Boolean(property.is_hot_deal || property.badge?.toLowerCase() === "hot deal");
  $("#listing-featured").checked = Boolean(property.is_featured);
  state.editingPhotos = propertyPhotos(property);
  renderExistingPhotos();
  $("#listing-form-heading").textContent = "Edit property";
  $("#save-listing").textContent = "Update listing";
  $("#cancel-edit").hidden = false;
  $("#listing-title").focus();
}

async function uploadImage(file) {
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const objectPath = `${state.ownerId}/${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/property-images/${objectPath}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${state.accessToken}`, "Content-Type": file.type },
    body: file
  });
  if (!response.ok) throw new Error(`Image upload failed: ${await response.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/property-images/${objectPath}`;
}

async function saveListing(event) {
  event.preventDefault();
  const saveButton = $("#save-listing");
  saveButton.disabled = true;
  try {
    const id = $("#listing-id").value;
    const imageFiles = Array.from($("#listing-images").files);
    const currentPhotos = id ? (state.editingPhotos || []) : [];
    if (imageFiles.length + currentPhotos.length > 10) {
      throw new Error("A property can have up to 10 photos. Remove some existing photos or choose fewer new ones.");
    }
    if (imageFiles.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      throw new Error("Photos must be JPG, PNG or WebP files no larger than 10 MB each.");
    }
    const uploadedPhotos = await Promise.all(imageFiles.map(uploadImage));
    const photos = [...currentPhotos, ...uploadedPhotos];
    const isHotDeal = $("#listing-hot-deal").checked;
    const listingBadge = $("#listing-badge").value.trim() || "FOR SALE";
    const listing = {
      owner_id: state.ownerId,
      title: $("#listing-title").value.trim(),
      location: $("#listing-location").value.trim(),
      type: $("#listing-type").value,
      price: Number($("#listing-price").value),
      beds: Number($("#listing-beds").value),
      baths: Number($("#listing-baths").value),
      launch_date: $("#listing-launch-date").value || null,
      reservation_amount: $("#listing-reservation-amount").value ? Number($("#listing-reservation-amount").value) : null,
      description: $("#listing-description").value.trim(),
      published: $("#listing-published").checked,
      is_hot_deal: isHotDeal,
      is_featured: $("#listing-featured").checked,
      image_url: photos[0] || "",
      photos,
      badge: isHotDeal ? "HOT DEAL" : (listingBadge.toLowerCase() === "hot deal" ? "FOR SALE" : listingBadge)
    };
    if (!photos.length) throw new Error("Please select at least one property photo before saving.");
    if (id) {
      await supabaseRequest(`/rest/v1/properties?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(listing) });
    } else {
      await supabaseRequest("/rest/v1/properties", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(listing) });
    }
    resetListingForm();
    await loadManagedListings();
    await loadPublicProperties();
    renderProperties();
    showNotice("Listing saved.");
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    saveButton.disabled = false;
  }
}

async function updateListingState(id, published) {
  await supabaseRequest(`/rest/v1/properties?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ published }) });
  await loadManagedListings();
  await loadPublicProperties();
  renderProperties();
}

async function deleteListing(id) {
  if (!window.confirm("Remove this listing? This cannot be undone.")) return;
  await supabaseRequest(`/rest/v1/properties?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  await loadManagedListings();
  await loadPublicProperties();
  renderProperties();
}

async function signOut() {
  try {
    if (state.accessToken) await supabaseRequest("/auth/v1/logout", { method: "POST" });
  } catch (error) {
    console.error("Supabase sign-out request failed:", error);
  } finally {
    state.accessToken = null;
    state.user = null;
    state.ownerId = null;
    state.managedProperties = [];
    showDashboardState();
  }
}

function bindEvents() {
  $("#search-form").addEventListener("submit", (event) => { event.preventDefault(); renderProperties(); $("#properties").scrollIntoView({ behavior: "smooth" }); });
  ["#filter-location", "#filter-type", "#filter-price"].forEach((selector) => $(selector).addEventListener("change", renderProperties));
  $("#featured-grid").addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-property]");
    if (trigger) { event.preventDefault(); openProperty(trigger.dataset.property); }
  });
  $("#featured-grid").addEventListener("keydown", (event) => {
    const trigger = event.target.closest("[data-property]");
    if (trigger && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openProperty(trigger.dataset.property); }
  });
  $("#property-detail").addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-index]");
    if (button) showGalleryPhoto(Number(button.dataset.galleryIndex));
  });
  $("#menu-toggle").addEventListener("click", () => {
    const nav = $("#main-nav");
    const open = nav.classList.toggle("open");
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
  });
  $("#main-nav").addEventListener("click", (event) => {
    if (event.target.closest("a")) { $("#main-nav").classList.remove("open"); $("#menu-toggle").setAttribute("aria-expanded", "false"); }
  });
  $("#owner-login-button").addEventListener("click", showDashboardState);
  $("#login-form").addEventListener("submit", signIn);
  $("#listing-form").addEventListener("submit", saveListing);
  $("#company-settings-form").addEventListener("submit", saveCompanySettings);
  $("#cancel-edit").addEventListener("click", resetListingForm);
  $("#whatsapp-form").addEventListener("submit", saveWhatsAppNumber);
  $("#site-content-form").addEventListener("submit", saveSiteContent);
  $("#reset-site-content").addEventListener("click", () => { if (window.confirm("Restore all website photos and headlines to their defaults?")) saveSiteContent(null, true); });
  $("#existing-photos").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const photos = state.editingPhotos || [];
    if (button.dataset.removePhoto) photos.splice(Number(button.dataset.removePhoto), 1);
    if (button.dataset.cover) photos.unshift(...photos.splice(Number(button.dataset.cover), 1));
    renderExistingPhotos();
  });
  $("#logout-button").addEventListener("click", signOut);
  $("#managed-listings").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    try {
      if (button.dataset.edit) fillListingForm(state.managedProperties.find((property) => String(property.id) === button.dataset.edit));
      if (button.dataset.publish) await updateListingState(button.dataset.publish, button.dataset.state !== "true");
      if (button.dataset.delete) await deleteListing(button.dataset.delete);
    } catch (error) {
      showNotice(error.message, true);
    }
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => $("#property-dialog").close()));
  document.querySelectorAll("[data-close-dashboard]").forEach((button) => button.addEventListener("click", () => $("#dashboard-dialog").close()));
  ["property-dialog", "dashboard-dialog"].forEach((id) => $(`#${id}`).addEventListener("click", (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }));
}

async function init() {
  $("#year").textContent = new Date().getFullYear();
  applyCompanySettings(defaultCompanySettings);
  setWhatsAppLinks();
  bindEvents();
  const results = await Promise.allSettled([loadPublicProperties(), loadCompanySettings()]);
  const settingsResult = results[1];
  if (settingsResult.status === "rejected") {
    console.error("Unable to load company settings:", settingsResult.reason);
  }
  renderProperties();
}

init();
