const query = new URLSearchParams(window.location.search);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const TIME_ZONE_MAP = {
  EST: "America/New_York",
  EDT: "America/New_York",
  IST: "Asia/Kolkata",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  MST: "America/Denver",
  MDT: "America/Denver",
  UTC: "UTC",
  GMT: "Etc/GMT",
  CET: "Europe/Paris",
};

const state = {
  events: [],
  featuredEvent: null,
  settings: {
    appName: "Invitely",
    logoMark: "I",
  },
  activeZone: "EST",
  adminAuthenticated: false,
};

const elements = {
  brandHome: document.getElementById("brand-home"),
  menuToggle: document.getElementById("menu-toggle"),
  mainNav: document.getElementById("main-nav"),
  homeNavButton: document.getElementById("home-nav-button"),
  navButtons: Array.from(document.querySelectorAll("[data-nav]")),
  views: {
    home: document.getElementById("home-view"),
    host: document.getElementById("host-view"),
  },
  appName: document.getElementById("app-name"),
  footerAppName: document.getElementById("footer-app-name"),
  footerLogoMark: document.getElementById("footer-logo-mark"),
  logoMark: document.getElementById("logo-mark"),
  eventBadge: document.getElementById("event-badge"),
  eventImage: document.getElementById("event-image"),
  eventTitle: document.getElementById("event-title"),
  eventDescription: document.getElementById("event-description"),
  heroTimezoneCard: document.getElementById("hero-timezone-card"),
  timezoneToggle: document.getElementById("timezone-toggle"),
  timezoneNote: document.getElementById("timezone-note"),
  rsvpNowButton: document.getElementById("rsvp-now-button"),
  eventDate: document.getElementById("event-date"),
  eventTimeRange: document.getElementById("event-time-range"),
  eventLocation: document.getElementById("event-location"),
  eventAddress: document.getElementById("event-address"),
  eventTown: document.getElementById("event-town"),
  hostImage: document.getElementById("host-image"),
  hostImageFallback: document.getElementById("host-image-fallback"),
  hostCardName: document.getElementById("host-card-name"),
  hostRoleCopy: document.getElementById("host-role-copy"),
  rsvpModal: document.getElementById("rsvp-modal"),
  closeRsvpModal: document.getElementById("close-rsvp-modal"),
  rsvpFormView: document.getElementById("rsvp-form-view"),
  rsvpSuccessView: document.getElementById("rsvp-success-view"),
  rsvpForm: document.getElementById("rsvp-form"),
  responseSelect: document.getElementById("rsvp-response-select"),
  selectedEventId: document.getElementById("selected-event-id"),
  rsvpStatus: document.getElementById("rsvp-status"),
  adminUnlockForm: document.getElementById("admin-unlock-form"),
  adminStatus: document.getElementById("admin-status"),
  hostSummaryCard: document.getElementById("host-summary-card"),
  hostDashboard: document.getElementById("host-dashboard"),
  googleStatusText: document.getElementById("google-status-text"),
  connectGoogleButton: document.getElementById("connect-google-button"),
  googleSheetLink: document.getElementById("google-sheet-link"),
  settingsForm: document.getElementById("settings-form"),
  settingsStatus: document.getElementById("settings-status"),
  eventEditorForm: document.getElementById("event-editor-form"),
  resetEditor: document.getElementById("reset-editor"),
  editorStatus: document.getElementById("editor-status"),
  adminEventList: document.getElementById("admin-event-list"),
  adminRsvpList: document.getElementById("admin-rsvp-list"),
  uploadButtons: Array.from(document.querySelectorAll("[data-upload-kind]")),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initialsFromName(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.length ? parts.map((part) => part[0].toUpperCase()).join("") : "I";
}

function formatDateLabel(value) {
  if (!value) {
    return "Date TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

function renderBrand() {
  const appName = state.settings.appName || "Invitely";
  const logoMark = state.settings.logoMark || "I";
  elements.appName.textContent = appName;
  elements.footerAppName.textContent = appName;
  elements.logoMark.textContent = logoMark;
  elements.footerLogoMark.textContent = logoMark;
  document.title = `${appName} | ${state.featuredEvent?.title || "Invitation"}`;
}

function setMenuOpen(isOpen) {
  elements.mainNav.classList.toggle("open", isOpen);
  elements.menuToggle.classList.toggle("open", isOpen);
  elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function showView(target) {
  elements.views.home.classList.toggle("active", target === "home");
  elements.views.host.classList.toggle("active", target === "host");
  elements.homeNavButton.classList.toggle("active", target === "home");
  setMenuOpen(false);
}

function availableTimezones(event) {
  const zones = String(event?.timezones || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item && TIME_ZONE_MAP[item]);
  return zones.length ? zones : ["EST"];
}

function parseEventDateTime(event, value) {
  if (!event?.startDate || !value) {
    return null;
  }

  const [year, month, day] = event.startDate.split("-").map(Number);
  const [hours, minutes] = value.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(utcGuess)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const displayedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  const targetAsUtc = Date.UTC(year, month - 1, day, hours, minutes);
  return new Date(utcGuess.getTime() + (targetAsUtc - displayedAsUtc));
}

function formatClock(date, zoneCode) {
  if (!date) {
    return "Time TBD";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE_MAP[zoneCode] || TIME_ZONE_MAP.EST,
    hour: "numeric",
    minute: "2-digit",
  }).format(date)} ${zoneCode}`;
}

function renderImage(url, imageElement, placeholderElement, fallbackText = "") {
  if (url) {
    imageElement.src = url;
    imageElement.hidden = false;
    if (placeholderElement) {
      placeholderElement.hidden = true;
    }
    return;
  }

  imageElement.hidden = true;
  imageElement.removeAttribute("src");
  if (placeholderElement) {
    placeholderElement.hidden = false;
    if (fallbackText) {
      placeholderElement.textContent = fallbackText;
    }
  }
}

function renderHostIdentity(hostName, hostImageUrl) {
  const initials = initialsFromName(hostName || "Host");
  renderImage(hostImageUrl, elements.hostImage, elements.hostImageFallback, initials);
}

function setZone(zone) {
  state.activeZone = zone;
  elements.timezoneToggle.querySelectorAll("[data-zone]").forEach((button) => {
    button.classList.toggle("active", button.dataset.zone === zone);
  });

  if (!state.featuredEvent) {
    return;
  }

  const event = state.featuredEvent;
  const startDate = parseEventDateTime(event, event.startTime);
  const endDate = parseEventDateTime(event, event.endTime);
  const startLabel = formatClock(startDate, zone);
  const endLabel = endDate ? formatClock(endDate, zone) : "End time TBD";
  elements.eventTimeRange.textContent = endDate ? `${startLabel} - ${endLabel}` : startLabel;
  elements.timezoneNote.textContent = availableTimezones(event).join(" • ");
}

function emptyHome() {
  elements.eventBadge.textContent = "Family Event";
  elements.eventTitle.textContent = "No event available yet";
  elements.eventDescription.textContent = "The host has not published an invitation yet.";
  elements.eventDate.textContent = "Date TBD";
  elements.eventTimeRange.textContent = "Time TBD";
  elements.timezoneNote.textContent = "EST";
  elements.eventLocation.textContent = "RSVP to see location";
  elements.eventAddress.textContent = "Location details appear here.";
  elements.eventTown.textContent = "Town TBD";
  elements.hostCardName.textContent = "Host TBD";
  elements.hostRoleCopy.textContent = "Host details show up here.";
  elements.selectedEventId.value = "";
  renderImage("", elements.eventImage, null, "");
  renderHostIdentity("Host", "");
  elements.heroTimezoneCard.classList.add("hidden");
}

function renderHome() {
  const featured = state.events.find((event) => event.featured) || state.events[0] || null;
  state.featuredEvent = featured;
  renderBrand();

  if (!featured) {
    emptyHome();
    return;
  }

  elements.selectedEventId.value = featured.id || "";
  elements.eventBadge.textContent = featured.category || "Family Event";
  elements.eventTitle.textContent = featured.title || "Untitled Event";
  elements.eventDescription.textContent = featured.description || featured.subtitle || "Add an event description from host mode.";
  elements.eventDate.textContent = featured.startDate ? formatDateLabel(featured.startDate) : "Date TBD";
  elements.eventLocation.textContent = featured.venue || "RSVP to see location";
  elements.eventAddress.textContent = featured.address || "Location details appear here.";
  elements.eventTown.textContent = featured.town || "Town TBD";
  elements.hostCardName.textContent = featured.host || "Host TBD";
  elements.hostRoleCopy.textContent = featured.town ? `Hosting in ${featured.town}` : "Host details show up here.";

  renderImage(featured.eventImageUrl, elements.eventImage, null, "");
  renderHostIdentity(featured.host || "Host", featured.hostImageUrl);

  const zones = availableTimezones(featured);
  if (!zones.includes(state.activeZone)) {
    state.activeZone = zones[0];
  }

  elements.heroTimezoneCard.classList.toggle("hidden", zones.length <= 1);
  elements.timezoneToggle.innerHTML = zones
    .map(
      (zone) => `
        <button class="toggle-button ${zone === state.activeZone ? "active" : ""}" data-zone="${zone}" type="button">
          ${zone}
        </button>
      `,
    )
    .join("");
  elements.timezoneToggle.classList.toggle("hidden", zones.length <= 1);
  elements.timezoneToggle.querySelectorAll("[data-zone]").forEach((button) => {
    button.addEventListener("click", () => setZone(button.dataset.zone));
  });
  setZone(state.activeZone);
}

function badgeClass(response) {
  if (response === "Going") return "going";
  if (response === "Unsure") return "unsure";
  return "declined";
}

function renderHostEvents() {
  if (!state.events.length) {
    elements.adminEventList.innerHTML = '<p class="host-copy">No events saved yet.</p>';
    return;
  }

  elements.adminEventList.innerHTML = state.events
    .map(
      (event) => `
        <article class="host-item">
          <p class="mini-label">${event.featured ? "Featured event" : "Saved event"}</p>
          <h4>${escapeHtml(event.title || "Untitled Event")}</h4>
          <p>${escapeHtml(event.startDate ? formatDateLabel(event.startDate) : "Date TBD")}</p>
          <p>${escapeHtml(event.host || "Host TBD")} | ${escapeHtml(event.venue || "Location TBD")}</p>
          <div class="host-item-actions">
            <button class="host-item-button" data-edit-id="${escapeHtml(event.id)}" type="button">Edit</button>
            <button class="host-item-button" data-delete-id="${escapeHtml(event.id)}" type="button">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");

  elements.adminEventList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => fillEditor(button.dataset.editId));
  });
  elements.adminEventList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteEvent(button.dataset.deleteId));
  });
}

function renderHostRsvps(rows) {
  if (!rows.length) {
    elements.adminRsvpList.innerHTML = '<p class="host-copy">No RSVP responses yet.</p>';
    return;
  }

  elements.adminRsvpList.innerHTML = rows
    .map(
      (row) => `
        <article class="host-item">
          <div class="section-header">
            <div>
              <p class="mini-label">${escapeHtml(row.eventTitle)}</p>
              <h4>${escapeHtml(row.name)}</h4>
            </div>
            <span class="rsvp-badge ${badgeClass(row.response)}">${escapeHtml(row.response || "Declined")}</span>
          </div>
          <p>${escapeHtml([row.email, row.phone].filter(Boolean).join(" | ") || "No email or phone provided")}</p>
          <p>Guests: ${escapeHtml(row.guestCount)}${row.notes ? ` | ${escapeHtml(row.notes)}` : ""}</p>
          <p>${escapeHtml(row.createdAt)}</p>
        </article>
      `,
    )
    .join("");
}

function openRsvpModal() {
  elements.rsvpStatus.textContent = "";
  elements.rsvpFormView.classList.remove("hidden");
  elements.rsvpSuccessView.classList.add("hidden");
  elements.rsvpModal.classList.remove("hidden");
  elements.rsvpModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeRsvpModal() {
  elements.rsvpModal.classList.add("hidden");
  elements.rsvpModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function showSuccessAnimation() {
  elements.rsvpFormView.classList.add("hidden");
  elements.rsvpSuccessView.classList.remove("hidden");
  window.setTimeout(() => {
    closeRsvpModal();
    elements.rsvpFormView.classList.remove("hidden");
    elements.rsvpSuccessView.classList.add("hidden");
  }, 1800);
}

function setUploadPreview(kind, url, fallbackName = "") {
  const isEvent = kind === "event";
  const imageElement = document.getElementById(isEvent ? "event-upload-preview-image" : "host-upload-preview-image");
  const placeholderElement = document.getElementById(isEvent ? "event-upload-preview-placeholder" : "host-upload-preview-placeholder");
  renderImage(url, imageElement, placeholderElement, isEvent ? "Event image" : initialsFromName(fallbackName || "Host"));
}

function fillEditor(eventId) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) return;

  document.getElementById("event-id").value = event.id || "";
  document.getElementById("event-title-input").value = event.title || "";
  document.getElementById("event-category").value = event.category || "";
  document.getElementById("event-description-input").value = event.description || event.subtitle || "";
  document.getElementById("event-date-input").value = event.startDate || "";
  document.getElementById("event-start-time").value = event.startTime || "";
  document.getElementById("event-end-time").value = event.endTime || "";
  document.getElementById("event-host-input").value = event.host || "";
  document.getElementById("event-town-input").value = event.town || "";
  document.getElementById("event-venue").value = event.venue || "";
  document.getElementById("event-address").value = event.address || "";
  document.getElementById("event-timezones").value = event.timezones || "";
  document.getElementById("event-image-url").value = event.eventImageUrl || "";
  document.getElementById("host-image-url").value = event.hostImageUrl || "";
  document.getElementById("event-featured").checked = Boolean(event.featured);
  setUploadPreview("event", event.eventImageUrl || "", event.title || "Event");
  setUploadPreview("host", event.hostImageUrl || "", event.host || "Host");
}

function resetEditor() {
  elements.eventEditorForm.reset();
  document.getElementById("event-id").value = "";
  elements.editorStatus.textContent = "";
  setUploadPreview("event", "", "Event");
  setUploadPreview("host", "", "Host");
}

function populateSettingsForm() {
  document.getElementById("settings-app-name").value = state.settings.appName || "Invitely";
  document.getElementById("settings-logo-mark").value = state.settings.logoMark || "I";
}

function applyAdminState(status) {
  state.adminAuthenticated = Boolean(status.authenticated);
  elements.hostSummaryCard.classList.toggle("hidden", !state.adminAuthenticated);
  elements.hostDashboard.classList.toggle("hidden", !state.adminAuthenticated);

  if (!state.adminAuthenticated) {
    elements.googleStatusText.textContent = "Sign in as host to connect Google Sheets.";
    elements.googleSheetLink.classList.add("hidden");
    return;
  }

  if (!status.googleConfigured) {
    elements.googleStatusText.textContent = "Google Sheets is not configured on the server yet. Add the Google OAuth environment variables first.";
    elements.connectGoogleButton.disabled = true;
    elements.googleSheetLink.classList.add("hidden");
    return;
  }

  elements.connectGoogleButton.disabled = false;
  if (status.googleConnected) {
    const email = status.googleEmail ? ` as ${status.googleEmail}` : "";
    elements.googleStatusText.textContent = `Google Sheets is connected${email}. New RSVP and event changes now sync there.`;
    if (status.spreadsheetUrl) {
      elements.googleSheetLink.href = status.spreadsheetUrl;
      elements.googleSheetLink.classList.remove("hidden");
    }
  } else {
    elements.googleStatusText.textContent = "Google Sheets is not connected yet. When you connect, Invitely will migrate the current local data into your Google account.";
    elements.googleSheetLink.classList.add("hidden");
  }
}

async function loadSettings() {
  const payload = await requestJson("/api/settings");
  state.settings = payload.settings;
  populateSettingsForm();
  renderBrand();
}

async function loadEvents() {
  const payload = await requestJson("/api/events");
  state.events = payload.events;
  renderHome();
  renderHostEvents();
}

async function loadAdminStatus() {
  const payload = await requestJson("/api/admin/status");
  applyAdminState(payload);
  if (payload.authenticated) {
    const rsvpPayload = await requestJson("/api/admin/rsvps");
    renderHostRsvps(rsvpPayload.rsvps);
  }
}

async function submitRsvp(event) {
  event.preventDefault();
  const response = elements.responseSelect.value;
  if (!response) {
    elements.rsvpStatus.textContent = "Pick Yes, Maybe, or No first.";
    return;
  }

  const contactValue = document.getElementById("guest-email").value.trim();
  const looksLikeEmail = contactValue.includes("@");
  const payload = {
    eventId: elements.selectedEventId.value,
    name: document.getElementById("guest-name").value.trim(),
    email: looksLikeEmail ? contactValue : "",
    phone: looksLikeEmail ? "" : contactValue,
    guestCount: document.getElementById("guest-count").value.trim(),
    notes: document.getElementById("guest-notes").value.trim(),
    response,
  };

  try {
    await requestJson("/api/rsvp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    elements.rsvpStatus.textContent = "";
    elements.rsvpForm.reset();
    document.getElementById("guest-count").value = 1;
    await loadEvents();
    if (state.adminAuthenticated) {
      await loadAdminStatus();
    }
    showSuccessAnimation();
  } catch (error) {
    elements.rsvpStatus.textContent = error.message;
  }
}

async function saveSettings(event) {
  event.preventDefault();
  const payload = {
    appName: document.getElementById("settings-app-name").value.trim(),
    logoMark: document.getElementById("settings-logo-mark").value.trim(),
  };

  try {
    await requestJson("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    elements.settingsStatus.textContent = "Branding saved.";
    await loadSettings();
  } catch (error) {
    elements.settingsStatus.textContent = error.message;
  }
}

async function unlockHost(event) {
  event.preventDefault();
  const password = document.getElementById("admin-key").value.trim();
  if (!password) {
    elements.adminStatus.textContent = "Enter the host password first.";
    return;
  }

  try {
    await requestJson("/api/admin/session", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    elements.adminStatus.textContent = "Host profile unlocked.";
    await loadAdminStatus();
  } catch (error) {
    elements.adminStatus.textContent = error.message;
  }
}

async function saveEvent(event) {
  event.preventDefault();
  const payload = {
    id: document.getElementById("event-id").value.trim(),
    title: document.getElementById("event-title-input").value.trim(),
    category: document.getElementById("event-category").value.trim(),
    subtitle: document.getElementById("event-description-input").value.trim(),
    description: document.getElementById("event-description-input").value.trim(),
    startDate: document.getElementById("event-date-input").value,
    startTime: document.getElementById("event-start-time").value,
    endTime: document.getElementById("event-end-time").value,
    host: document.getElementById("event-host-input").value.trim(),
    town: document.getElementById("event-town-input").value.trim(),
    venue: document.getElementById("event-venue").value.trim(),
    address: document.getElementById("event-address").value.trim(),
    timezones: document.getElementById("event-timezones").value.trim(),
    eventImageUrl: document.getElementById("event-image-url").value.trim(),
    hostImageUrl: document.getElementById("host-image-url").value.trim(),
    featured: document.getElementById("event-featured").checked,
    aboutTitle: "",
    menuTitle: "",
    menuItems: "",
    specialTitle: "",
    specialInstructions: "",
    rsvpDeadline: "",
  };

  try {
    await requestJson("/api/admin/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    elements.editorStatus.textContent = "Event saved.";
    resetEditor();
    await loadEvents();
    await loadAdminStatus();
  } catch (error) {
    elements.editorStatus.textContent = error.message;
  }
}

async function deleteEvent(eventId) {
  try {
    await requestJson("/api/admin/events/delete", {
      method: "POST",
      body: JSON.stringify({ id: eventId }),
    });
    elements.editorStatus.textContent = "Event deleted.";
    await loadEvents();
    await loadAdminStatus();
  } catch (error) {
    elements.editorStatus.textContent = error.message;
  }
}

async function uploadImage(kind) {
  const fileInput = document.getElementById(kind === "event" ? "event-image-file" : "host-image-file");
  const urlInput = document.getElementById(kind === "event" ? "event-image-url" : "host-image-url");
  const fallbackName = kind === "event"
    ? document.getElementById("event-title-input").value.trim() || "Event"
    : document.getElementById("event-host-input").value.trim() || "Host";

  if (!fileInput.files || !fileInput.files[0]) {
    elements.editorStatus.textContent = "Choose an image before uploading.";
    return;
  }

  const file = fileInput.files[0];
  if (file.size > MAX_UPLOAD_BYTES) {
    elements.editorStatus.textContent = "Images must be 10 MB or smaller.";
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("kind", kind);

  try {
    const payload = await requestJson("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    urlInput.value = payload.url;
    setUploadPreview(kind, payload.url, fallbackName);
    elements.editorStatus.textContent = `${kind === "event" ? "Event" : "Host"} image uploaded.`;
  } catch (error) {
    elements.editorStatus.textContent = error.message;
  }
}

function handleGoogleConnect() {
  window.location.href = "/auth/google/start";
}

function handleQueryMessages() {
  const google = query.get("google");
  const error = query.get("error");

  if (google === "connected") {
    showView("host");
    elements.adminStatus.textContent = "Google Sheets connected and local data migrated.";
  } else if (google === "failed") {
    showView("host");
    elements.adminStatus.textContent = error || "Google connection failed.";
  }

  if (google || error) {
    const url = new URL(window.location.href);
    url.searchParams.delete("google");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url);
  }
}

elements.brandHome.addEventListener("click", () => showView("home"));
elements.menuToggle.addEventListener("click", () => {
  setMenuOpen(!elements.mainNav.classList.contains("open"));
});
elements.homeNavButton.addEventListener("click", () => showView("home"));
elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.nav));
});

elements.rsvpNowButton.addEventListener("click", openRsvpModal);
elements.closeRsvpModal.addEventListener("click", closeRsvpModal);
elements.rsvpModal.addEventListener("click", (event) => {
  if (event.target === elements.rsvpModal) {
    closeRsvpModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!elements.rsvpModal.classList.contains("hidden")) {
      closeRsvpModal();
    }
    if (elements.mainNav.classList.contains("open")) {
      setMenuOpen(false);
    }
  }
});

document.getElementById("event-image-url").addEventListener("input", (event) => {
  setUploadPreview("event", event.target.value.trim(), document.getElementById("event-title-input").value.trim());
});

document.getElementById("host-image-url").addEventListener("input", (event) => {
  setUploadPreview("host", event.target.value.trim(), document.getElementById("event-host-input").value.trim());
});

elements.uploadButtons.forEach((button) => {
  button.addEventListener("click", () => uploadImage(button.dataset.uploadKind));
});

elements.rsvpForm.addEventListener("submit", submitRsvp);
elements.adminUnlockForm.addEventListener("submit", unlockHost);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.eventEditorForm.addEventListener("submit", saveEvent);
elements.resetEditor.addEventListener("click", resetEditor);
elements.connectGoogleButton.addEventListener("click", handleGoogleConnect);

Promise.all([loadSettings(), loadEvents(), loadAdminStatus()])
  .then(handleQueryMessages)
  .catch(() => {
    elements.eventTitle.textContent = "Server unavailable";
    elements.eventDescription.textContent = "Start the server to load Invitely.";
  });
