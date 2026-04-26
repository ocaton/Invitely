const query = new URLSearchParams(window.location.search);

const state = {
  events: [],
  featuredEvent: null,
  settings: {
    appName: "Invitely",
    logoMark: "I",
  },
  selectedResponse: "",
  activeZone: "EST",
  adminAuthenticated: false,
};

const elements = {
  navLinks: Array.from(document.querySelectorAll("[data-nav]")),
  views: {
    home: document.getElementById("home-view"),
    other: document.getElementById("other-view"),
    host: document.getElementById("host-view"),
  },
  appName: document.getElementById("app-name"),
  logoMark: document.getElementById("logo-mark"),
  eventTitle: document.getElementById("event-title"),
  eventDate: document.getElementById("event-date"),
  eventHost: document.getElementById("event-host"),
  eventTime: document.getElementById("event-time"),
  eventDescription: document.getElementById("event-description"),
  eventLongDescription: document.getElementById("event-long-description"),
  eventAccess: document.getElementById("event-access"),
  timezoneNote: document.getElementById("timezone-note"),
  zoneButtons: Array.from(document.querySelectorAll("[data-zone]")),
  responseButtons: Array.from(document.querySelectorAll("[data-response]")),
  selectedResponseCopy: document.getElementById("selected-response-copy"),
  statusChip: document.getElementById("status-chip"),
  otherEventsList: document.getElementById("other-events-list"),
  rsvpForm: document.getElementById("rsvp-form"),
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
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseEasternEventDate(event) {
  if (!event?.startDate || !event?.startTime) {
    return null;
  }

  const [year, month, day] = event.startDate.split("-").map(Number);
  const [hours, minutes] = event.startTime.split(":").map(Number);
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

function formatDateLabel(value) {
  if (!value) {
    return "Date TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatEventTime(event, zone) {
  const baseDate = parseEasternEventDate(event);
  if (!baseDate) {
    return "Time TBD";
  }

  const timeZone = zone === "IST" ? "Asia/Kolkata" : "America/New_York";
  const label = zone === "IST" ? "IST" : "EST";
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(baseDate);

  return `${formatted} ${label}`;
}

async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
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
  elements.logoMark.textContent = logoMark;
  document.title = `${appName} | Mother's Day Lunch`;
}

function setActiveNav(target) {
  elements.navLinks.forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === target);
  });
}

function showView(target) {
  elements.views.home.classList.toggle("active", target === "home");
  elements.views.other.classList.toggle("active", target === "other");
  elements.views.host.classList.toggle("active", target === "host");
  setActiveNav(target);
}

function setZone(zone) {
  state.activeZone = zone;
  elements.zoneButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.zone === zone);
  });

  if (state.featuredEvent) {
    elements.eventTime.textContent = formatEventTime(state.featuredEvent, zone);
  }
}

function setResponse(response) {
  state.selectedResponse = response;
  elements.responseButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.response === response);
  });

  if (!response) {
    elements.statusChip.textContent = "No response selected";
    elements.selectedResponseCopy.textContent = "Pick a response, then add your details below.";
    return;
  }

  elements.statusChip.textContent = response;
  elements.selectedResponseCopy.textContent = `You selected ${response}. Add your details to save it.`;
}

function renderHome() {
  const featured = state.events.find((event) => event.featured) || state.events[0] || null;
  state.featuredEvent = featured;

  if (!featured) {
    elements.eventTitle.textContent = "No event available";
    elements.eventDescription.textContent = "The host has not published an event yet.";
    elements.eventLongDescription.textContent = "Use the host sign-in to add the first event.";
    elements.eventDate.textContent = "-";
    elements.eventHost.textContent = "-";
    elements.eventTime.textContent = "-";
    elements.selectedEventId.value = "";
    return;
  }

  elements.selectedEventId.value = featured.id;
  elements.eventTitle.textContent = featured.title;
  elements.eventDescription.textContent = featured.subtitle || featured.description;
  elements.eventLongDescription.textContent = featured.description;
  elements.eventDate.textContent = formatDateLabel(featured.startDate);
  elements.eventHost.textContent = featured.host || "Host TBD";
  elements.eventAccess.textContent = featured.venue || "RSVP to see location";
  elements.timezoneNote.textContent = `Switch between Eastern and India time for ${formatDateLabel(
    featured.startDate,
  )}.`;
  setZone(state.activeZone);
}

function renderOtherEvents() {
  const otherEvents = state.events.filter((event) => !event.featured && event.id !== state.featuredEvent?.id);

  if (!otherEvents.length) {
    elements.otherEventsList.innerHTML = `
      <article class="other-event-item">
        <p class="label">Coming soon</p>
        <h3>More events coming soon.</h3>
        <p class="supporting">Once the host adds more upcoming invites, they will show up here.</p>
      </article>
    `;
    return;
  }

  elements.otherEventsList.innerHTML = otherEvents
    .map(
      (event) => `
        <article class="other-event-item">
          <p class="label">${escapeHtml(event.category || "Event")}</p>
          <h3>${escapeHtml(event.title)}</h3>
          <p class="supporting">${escapeHtml(formatDateLabel(event.startDate))}</p>
          <p class="supporting">${escapeHtml(event.host || "Host TBD")}</p>
        </article>
      `,
    )
    .join("");
}

function renderHostEvents() {
  if (!state.events.length) {
    elements.adminEventList.innerHTML = '<p class="supporting">No events saved yet.</p>';
    return;
  }

  elements.adminEventList.innerHTML = state.events
    .map(
      (event) => `
        <article class="host-item">
          <p class="label">${event.featured ? "Featured event" : "Saved event"}</p>
          <h4>${escapeHtml(event.title)}</h4>
          <p>${escapeHtml(formatDateLabel(event.startDate))}</p>
          <p>${escapeHtml(event.host || "Host TBD")} | ${escapeHtml(event.venue || "Venue TBD")}</p>
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

function badgeClass(response) {
  if (response === "Going") {
    return "going";
  }
  if (response === "Unsure") {
    return "unsure";
  }
  return "declined";
}

function renderHostRsvps(rows) {
  if (!rows.length) {
    elements.adminRsvpList.innerHTML = '<p class="supporting">No RSVP responses yet.</p>';
    return;
  }

  elements.adminRsvpList.innerHTML = rows
    .map(
      (row) => `
        <article class="host-item">
          <div class="card-top">
            <div>
              <p class="label">${escapeHtml(row.eventTitle)}</p>
              <h4>${escapeHtml(row.name)}</h4>
            </div>
            <span class="rsvp-badge ${badgeClass(row.response)}">${escapeHtml(row.response || "Declined")}</span>
          </div>
          <p>${escapeHtml(row.email)} | ${escapeHtml(row.phone)}</p>
          <p>Guests: ${escapeHtml(row.guestCount)}${row.notes ? ` | ${escapeHtml(row.notes)}` : ""}</p>
          <p>${escapeHtml(row.createdAt)}</p>
        </article>
      `,
    )
    .join("");
}

function fillEditor(eventId) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) {
    return;
  }

  document.getElementById("event-id").value = event.id;
  document.getElementById("event-title-input").value = event.title || "";
  document.getElementById("event-category").value = event.category || "";
  document.getElementById("event-subtitle").value = event.subtitle || "";
  document.getElementById("event-date-input").value = event.startDate || "";
  document.getElementById("event-start-time").value = event.startTime || "";
  document.getElementById("event-end-time").value = event.endTime || "";
  document.getElementById("event-host-input").value = event.host || "";
  document.getElementById("event-venue").value = event.venue || "";
  document.getElementById("event-description-input").value = event.description || "";
  document.getElementById("event-emoji").value = event.emoji || "";
  document.getElementById("event-featured").checked = Boolean(event.featured);
}

function resetEditor() {
  elements.eventEditorForm.reset();
  document.getElementById("event-id").value = "";
  elements.editorStatus.textContent = "";
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
    elements.googleStatusText.textContent =
      "Google Sheets is not configured on the server yet. Add the Google OAuth environment variables first.";
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
    elements.googleStatusText.textContent =
      "Google Sheets is not connected yet. When you connect, the app will migrate the current local data into your Google account.";
    elements.googleSheetLink.classList.add("hidden");
  }
}

async function loadSettings() {
  const payload = await requestJson("/api/settings");
  state.settings = payload.settings;
  renderBrand();
  populateSettingsForm();
}

async function loadEvents() {
  const payload = await requestJson("/api/events");
  state.events = payload.events;
  renderHome();
  renderOtherEvents();
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

  if (!state.selectedResponse) {
    elements.rsvpStatus.textContent = "Choose Going, Unsure, or Decline first.";
    return;
  }

  const payload = {
    eventId: elements.selectedEventId.value,
    name: document.getElementById("guest-name").value.trim(),
    email: document.getElementById("guest-email").value.trim(),
    phone: document.getElementById("guest-phone").value.trim(),
    guestCount: document.getElementById("guest-count").value.trim(),
    notes: document.getElementById("guest-notes").value.trim(),
    response: state.selectedResponse,
  };

  try {
    await requestJson("/api/rsvp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    elements.rsvpStatus.textContent = "Your response was saved.";
    elements.rsvpForm.reset();
    document.getElementById("guest-count").value = 1;
    setResponse("");
    if (state.adminAuthenticated) {
      await loadAdminStatus();
    }
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
    subtitle: document.getElementById("event-subtitle").value.trim(),
    startDate: document.getElementById("event-date-input").value,
    startTime: document.getElementById("event-start-time").value,
    endTime: document.getElementById("event-end-time").value,
    host: document.getElementById("event-host-input").value.trim(),
    venue: document.getElementById("event-venue").value.trim(),
    description: document.getElementById("event-description-input").value.trim(),
    emoji: document.getElementById("event-emoji").value.trim(),
    featured: document.getElementById("event-featured").checked,
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

elements.navLinks.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.nav));
});

elements.zoneButtons.forEach((button) => {
  button.addEventListener("click", () => setZone(button.dataset.zone));
});

elements.responseButtons.forEach((button) => {
  button.addEventListener("click", () => setResponse(button.dataset.response));
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
    elements.eventDescription.textContent = "Start the local server to load Invitely.";
  });
