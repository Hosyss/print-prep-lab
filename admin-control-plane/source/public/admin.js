const state = {
  session: null,
  config: null,
  revision: 0,
  checksum: "",
  updatedAt: null,
  catalog: [],
  selectedRoute: "",
  dirty: false,
  busy: false,
};

const viewCopy = {
  overview: ["Control plane overview", "Review protection, draft health and the separation from the public site."],
  content: ["Site settings", "Edit safe brand, SEO, announcement and feature fields."],
  navigation: ["Navigation", "Manage internal, same-origin navigation entries only."],
  pages: ["Page content", "Maintain structured bilingual text without exposing code or formulas."],
  tools: ["Tool visibility", "Control visibility flags without access to calculator logic."],
  release: ["Snapshots & backups", "Create isolated snapshots and restore integrity-checked server backups."],
  audit: ["Audit log", "Review the append-only, hash-chained record of administrative writes."],
};

const byId = (id) => document.getElementById(id);
const deepClone = (value) => JSON.parse(JSON.stringify(value));

class AdminRequestError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = "AdminRequestError";
    this.code = code;
    this.status = status;
  }
}

async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    headers.set("X-CSRF-Token", state.session?.csrfToken || "");
  }
  const response = await fetch(path, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AdminRequestError(
      payload?.message || "The protected admin request failed.",
      payload?.error || "request_failed",
      response.status,
    );
  }
  return payload;
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createInput(value, options = {}) {
  const input = document.createElement(options.multiline ? "textarea" : "input");
  if (!options.multiline) input.type = options.type || "text";
  if (options.multiline) input.rows = options.rows || 3;
  if (options.maxLength) input.maxLength = options.maxLength;
  if (options.dir) input.dir = options.dir;
  input.value = value ?? "";
  if (options.ariaLabel) input.setAttribute("aria-label", options.ariaLabel);
  return input;
}

function field(labelText, control) {
  const label = createElement("label", "editor-field");
  label.append(createElement("span", "", labelText), control);
  return label;
}

function checkboxControl(labelText, checked, onChange, className = "editor-check") {
  const label = createElement("label", className);
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.addEventListener("change", () => onChange(input.checked));
  label.append(input, createElement("span", "", labelText));
  return label;
}

function removeButton(label, onClick) {
  const button = createElement("button", "remove-button", label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function setBusy(busy) {
  state.busy = busy;
  byId("save-draft").disabled = busy || !state.dirty;
  byId("reload-draft").disabled = busy;
  byId("publish-snapshot").disabled = busy;
}

let toastTimer = 0;
function toast(message, error = false) {
  const node = byId("toast");
  window.clearTimeout(toastTimer);
  node.textContent = message;
  node.classList.toggle("error", error);
  node.hidden = false;
  toastTimer = window.setTimeout(() => {
    node.hidden = true;
  }, 5200);
}

function markDirty() {
  if (!state.config) return;
  state.dirty = true;
  const indicator = byId("dirty-indicator");
  indicator.textContent = "Unsaved protected draft changes";
  indicator.classList.add("is-dirty");
  byId("save-draft").disabled = state.busy;
}

function markClean() {
  state.dirty = false;
  const indicator = byId("dirty-indicator");
  indicator.textContent = "No unsaved changes";
  indicator.classList.remove("is-dirty");
  byId("save-draft").disabled = true;
}

function updateRevision(data) {
  state.revision = Number(data.revision || 0);
  state.checksum = String(data.checksum || "");
  state.updatedAt = data.updatedAt || null;
  byId("revision-number").textContent = String(state.revision);
  byId("revision-time").textContent = state.updatedAt ? new Date(state.updatedAt).toLocaleString() : "Initial protected draft";
  byId("metric-checksum").textContent = state.checksum ? state.checksum.slice(0, 16) : "Not stored";
}

function setAccessState(ok, identity = "") {
  const chip = byId("access-status");
  chip.className = `status-chip ${ok ? "status-safe" : "status-error"}`;
  chip.textContent = ok ? "Access verified" : "Protection check failed";
  byId("metric-access").textContent = ok ? "Verified" : "Blocked";
  byId("admin-identity").textContent = identity || "—";
}

function showView(name) {
  const copy = viewCopy[name] || viewCopy.overview;
  document.querySelectorAll("[data-view]").forEach((panel) => {
    panel.hidden = panel.dataset.view !== name;
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.viewTarget === name));
  });
  byId("view-title").textContent = copy[0];
  byId("view-description").textContent = copy[1];
  if (name === "release") refreshBackups();
  if (name === "audit") refreshAudit();
}

function populateSiteSettings() {
  const config = state.config;
  byId("brand-name").value = config.brand.name;
  byId("default-locale").value = config.brand.defaultLocale;
  byId("secondary-locale").value = config.brand.secondaryLocale;
  byId("seo-title").value = config.seo.defaultTitle;
  byId("seo-description").value = config.seo.defaultDescription;
  byId("announcement-enabled").checked = config.site.announcement.enabled;
  byId("announcement-text").value = config.site.announcement.text;
  byId("maintenance-mode").checked = config.site.maintenanceMode;
  renderFeatureSwitches();
}

function syncSiteSettings() {
  state.config.brand.name = byId("brand-name").value;
  state.config.brand.defaultLocale = byId("default-locale").value;
  state.config.brand.secondaryLocale = byId("secondary-locale").value;
  state.config.seo.defaultTitle = byId("seo-title").value;
  state.config.seo.defaultDescription = byId("seo-description").value;
  state.config.site.announcement.enabled = byId("announcement-enabled").checked;
  state.config.site.announcement.text = byId("announcement-text").value;
  state.config.site.maintenanceMode = byId("maintenance-mode").checked;
  markDirty();
}

function renderFeatureSwitches() {
  const container = byId("feature-switches");
  container.replaceChildren();
  const keys = Object.keys(state.config.features).sort();
  if (!keys.length) {
    container.append(createElement("p", "empty-state", "No feature switches are defined."));
    return;
  }
  for (const key of keys) {
    container.append(checkboxControl(key.replaceAll("_", " "), state.config.features[key], (checked) => {
      state.config.features[key] = checked;
      markDirty();
    }, "switch-item"));
  }
}

function renderNavigation() {
  const container = byId("navigation-list");
  container.replaceChildren();
  if (!state.config.navigation.length) {
    container.append(createElement("p", "empty-state", "No navigation entries in this draft."));
    return;
  }
  state.config.navigation.forEach((entry, index) => {
    const row = createElement("article", "editor-row");
    const id = createInput(entry.id, { maxLength: 64, ariaLabel: "Navigation ID" });
    const label = createInput(entry.label, { maxLength: 100, ariaLabel: "English navigation label" });
    const labelAr = createInput(entry.labelAr, { maxLength: 100, dir: "rtl", ariaLabel: "Arabic navigation label" });
    const href = createInput(entry.href, { maxLength: 240, ariaLabel: "Internal navigation route" });
    id.addEventListener("input", () => { entry.id = id.value; markDirty(); });
    label.addEventListener("input", () => { entry.label = label.value; markDirty(); });
    labelAr.addEventListener("input", () => { entry.labelAr = labelAr.value; markDirty(); });
    href.addEventListener("input", () => { entry.href = href.value; markDirty(); });
    row.append(
      field("ID", id),
      field("English label", label),
      field("Arabic label", labelAr),
      field("Internal route", href),
      checkboxControl("Enabled", entry.enabled, (checked) => { entry.enabled = checked; markDirty(); }),
      removeButton("Remove", () => {
        state.config.navigation.splice(index, 1);
        markDirty();
        renderNavigation();
      }),
    );
    container.append(row);
  });
}

function addNavigation() {
  const suffix = crypto.randomUUID().slice(0, 8);
  state.config.navigation.push({ id: `nav_${suffix}`, label: "New link", labelAr: "", href: "/", enabled: true });
  markDirty();
  renderNavigation();
}

function populatePageSelector() {
  const select = byId("page-select");
  const previous = state.selectedRoute;
  select.replaceChildren();
  for (const page of state.catalog) {
    const option = document.createElement("option");
    option.value = page.route;
    option.textContent = `${page.title} — ${page.route}`;
    select.append(option);
  }
  state.selectedRoute = state.catalog.some((page) => page.route === previous)
    ? previous
    : (state.catalog[0]?.route || "");
  select.value = state.selectedRoute;
  renderSelectedPage();
}

function emptyPageOverride() {
  return {
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    h1: "",
    h1Ar: "",
    intro: "",
    introAr: "",
    enabled: true,
    sections: [],
  };
}

function currentPageOverride(create = false) {
  if (!state.selectedRoute) return null;
  let override = state.config.pageOverrides[state.selectedRoute];
  if (!override && create) {
    override = emptyPageOverride();
    state.config.pageOverrides[state.selectedRoute] = override;
  }
  return override || emptyPageOverride();
}

const pageFields = {
  "page-title": "title",
  "page-title-ar": "titleAr",
  "page-description": "description",
  "page-description-ar": "descriptionAr",
  "page-h1": "h1",
  "page-h1-ar": "h1Ar",
  "page-intro": "intro",
  "page-intro-ar": "introAr",
};

function renderSelectedPage() {
  const override = currentPageOverride(false);
  const catalogPage = state.catalog.find((page) => page.route === state.selectedRoute);
  byId("page-source-note").textContent = catalogPage
    ? `Baseline: ${catalogPage.title}. Empty override fields leave the baseline content unchanged in a future integration.`
    : "No managed page is selected.";
  for (const [id, key] of Object.entries(pageFields)) byId(id).value = override?.[key] || "";
  byId("page-enabled").checked = override?.enabled ?? true;
  renderSections();
}

function renderSections() {
  const container = byId("section-list");
  container.replaceChildren();
  const override = currentPageOverride(false);
  const sections = override?.sections || [];
  if (!sections.length) {
    container.append(createElement("p", "empty-state", "No structured section overrides for this page."));
    return;
  }
  sections.forEach((section, index) => {
    const row = createElement("article", "editor-row section-row");
    const id = createInput(section.id, { maxLength: 64, ariaLabel: "Section ID" });
    const heading = createInput(section.heading || "", { maxLength: 180, ariaLabel: "English section heading" });
    const headingAr = createInput(section.headingAr || "", { maxLength: 180, dir: "rtl", ariaLabel: "Arabic section heading" });
    id.addEventListener("input", () => { section.id = id.value; markDirty(); });
    heading.addEventListener("input", () => { section.heading = heading.value; markDirty(); });
    headingAr.addEventListener("input", () => { section.headingAr = headingAr.value; markDirty(); });
    row.append(
      field("Section ID", id),
      field("English heading", heading),
      field("Arabic heading", headingAr),
      checkboxControl("Enabled", section.enabled, (checked) => { section.enabled = checked; markDirty(); }),
    );

    const copy = createElement("div", "section-copy");
    const body = createInput(section.body || "", { multiline: true, rows: 4, maxLength: 4000, ariaLabel: "English section body" });
    const bodyAr = createInput(section.bodyAr || "", { multiline: true, rows: 4, maxLength: 4000, dir: "rtl", ariaLabel: "Arabic section body" });
    body.addEventListener("input", () => { section.body = body.value; markDirty(); });
    bodyAr.addEventListener("input", () => { section.bodyAr = bodyAr.value; markDirty(); });
    copy.append(field("English body", body), field("Arabic body", bodyAr));
    row.append(copy, removeButton("Remove section", () => {
      const live = currentPageOverride(true);
      live.sections.splice(index, 1);
      markDirty();
      renderSections();
    }));
    container.append(row);
  });
}

function addSection() {
  if (!state.selectedRoute) return;
  const override = currentPageOverride(true);
  override.sections.push({
    id: `section_${crypto.randomUUID().slice(0, 8)}`,
    heading: "",
    headingAr: "",
    body: "",
    bodyAr: "",
    enabled: true,
  });
  markDirty();
  renderSections();
}

function toolPages() {
  const marked = state.catalog.filter((page) => page.kind === "tool");
  return marked.length ? marked : state.catalog;
}

function ensureToolVisibility(route) {
  if (!state.config.toolVisibility[route]) {
    state.config.toolVisibility[route] = { enabled: true, navVisible: true, searchVisible: true };
  }
  return state.config.toolVisibility[route];
}

function renderTools() {
  const container = byId("tool-list");
  container.replaceChildren();
  for (const page of toolPages()) {
    const settings = state.config.toolVisibility[page.route] || { enabled: true, navVisible: true, searchVisible: true };
    const row = createElement("article", "tool-row");
    const summary = createElement("div");
    summary.append(createElement("strong", "", page.title), createElement("small", "", page.route));
    row.append(summary);
    for (const [key, label] of [["enabled", "Enabled"], ["navVisible", "Navigation"], ["searchVisible", "Search"]]) {
      row.append(checkboxControl(label, settings[key], (checked) => {
        ensureToolVisibility(page.route)[key] = checked;
        markDirty();
      }, "tool-toggle"));
    }
    container.append(row);
  }
}

function renderAll() {
  populateSiteSettings();
  renderNavigation();
  populatePageSelector();
  renderTools();
  byId("metric-pages").textContent = String(state.catalog.length);
  markClean();
}

async function saveDraft() {
  if (!state.dirty || state.busy) return;
  syncSiteSettings();
  setBusy(true);
  try {
    const result = await api("/api/config", {
      method: "PUT",
      body: { expectedRevision: state.revision, config: state.config },
    });
    state.config = deepClone(result.config);
    updateRevision(result);
    renderAll();
    toast(`Protected draft revision ${result.revision} saved.`);
  } catch (error) {
    if (error?.code === "revision_conflict") toast("The draft changed elsewhere. Reload it before saving again.", true);
    else toast(error instanceof Error ? error.message : "The draft could not be saved.", true);
  } finally {
    setBusy(false);
  }
}

async function loadDraft({ confirmDirty = false } = {}) {
  if (confirmDirty && state.dirty && !window.confirm("Discard the unsaved local draft changes and reload the protected copy?")) return;
  setBusy(true);
  try {
    const result = await api("/api/config");
    state.config = deepClone(result.config);
    updateRevision(result);
    renderAll();
    toast("Protected draft reloaded.");
  } catch (error) {
    toast(error instanceof Error ? error.message : "The draft could not be loaded.", true);
  } finally {
    setBusy(false);
  }
}

async function refreshBackups() {
  if (!state.session) return;
  const container = byId("backup-list");
  container.replaceChildren(createElement("p", "empty-state", "Loading protected backups…"));
  try {
    const result = await api("/api/backups");
    container.replaceChildren();
    if (!result.backups.length) {
      container.append(createElement("p", "empty-state", "No server-side backups yet."));
      return;
    }
    for (const backup of result.backups) {
      const row = createElement("article", "record-row");
      const copy = createElement("div");
      copy.append(
        createElement("strong", "", `Revision ${backup.revision} · ${backup.kind}`),
        createElement("span", "mono", backup.checksum.slice(0, 20)),
        createElement("small", "", `${new Date(backup.createdAt).toLocaleString()} · ${backup.createdBy}`),
      );
      const button = createElement("button", "button ghost", "Restore");
      button.type = "button";
      button.addEventListener("click", () => restoreBackup(backup));
      row.append(copy, button);
      container.append(row);
    }
  } catch (error) {
    container.replaceChildren(createElement("p", "empty-state", error instanceof Error ? error.message : "Backups could not be loaded."));
  }
}

async function restoreBackup(backup) {
  if (state.dirty) {
    toast("Save or reload the current draft before restoring a backup.", true);
    return;
  }
  if (!window.confirm(`Restore backup revision ${backup.revision}? A safety backup of revision ${state.revision} will be created first.`)) return;
  setBusy(true);
  try {
    const result = await api(`/api/backups/${backup.id}/restore`, {
      method: "POST",
      body: { expectedRevision: state.revision },
    });
    state.config = deepClone(result.config);
    updateRevision(result);
    renderAll();
    await refreshBackups();
    toast(`Backup restored as protected draft revision ${result.revision}.`);
  } catch (error) {
    toast(error instanceof Error ? error.message : "The backup could not be restored.", true);
  } finally {
    setBusy(false);
  }
}

async function publishSnapshot() {
  if (state.dirty) {
    toast("Save the protected draft before creating a snapshot.", true);
    return;
  }
  const confirmation = byId("publish-confirmation").value;
  setBusy(true);
  try {
    const result = await api("/api/publish", {
      method: "POST",
      body: { expectedRevision: state.revision, confirmation },
    });
    byId("publish-confirmation").value = "";
    byId("publish-result").textContent = `Snapshot ${result.id.slice(0, 8)} created for revision ${result.revision}. Public integration remains disabled.`;
    toast("Protected snapshot created. The public site was not changed.");
  } catch (error) {
    byId("publish-result").textContent = "";
    toast(error instanceof Error ? error.message : "The snapshot could not be created.", true);
  } finally {
    setBusy(false);
  }
}

async function refreshAudit() {
  if (!state.session) return;
  const container = byId("audit-list");
  container.replaceChildren(createElement("p", "empty-state", "Loading append-only audit entries…"));
  try {
    const result = await api("/api/audit");
    container.replaceChildren();
    if (!result.entries.length) {
      container.append(createElement("p", "empty-state", "No administrative writes have been recorded."));
      return;
    }
    for (const entry of result.entries) {
      const row = createElement("article", "record-row");
      const time = createElement("div");
      time.append(createElement("strong", "", new Date(entry.occurredAt).toLocaleString()), createElement("small", "", entry.actor));
      const details = createElement("div");
      details.append(
        createElement("strong", "", `${entry.action} · ${entry.resource}`),
        createElement("span", "", JSON.stringify(entry.metadata)),
        createElement("small", "audit-hash", `chain ${entry.entryHash.slice(0, 24)} · request ${entry.requestId}`),
      );
      row.append(time, details);
      container.append(row);
    }
  } catch (error) {
    container.replaceChildren(createElement("p", "empty-state", error instanceof Error ? error.message : "Audit entries could not be loaded."));
  }
}

function bindStaticControls() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTarget));
  });
  byId("site-settings-form").addEventListener("input", syncSiteSettings);
  byId("site-settings-form").addEventListener("change", syncSiteSettings);
  byId("add-navigation").addEventListener("click", addNavigation);
  byId("page-select").addEventListener("change", (event) => {
    state.selectedRoute = event.target.value;
    renderSelectedPage();
  });
  for (const [id, key] of Object.entries(pageFields)) {
    byId(id).addEventListener("input", (event) => {
      currentPageOverride(true)[key] = event.target.value;
      markDirty();
    });
  }
  byId("page-enabled").addEventListener("change", (event) => {
    currentPageOverride(true).enabled = event.target.checked;
    markDirty();
  });
  byId("add-section").addEventListener("click", addSection);
  byId("save-draft").addEventListener("click", saveDraft);
  byId("reload-draft").addEventListener("click", () => loadDraft({ confirmDirty: true }));
  byId("refresh-backups").addEventListener("click", refreshBackups);
  byId("publish-snapshot").addEventListener("click", publishSnapshot);
  byId("refresh-audit").addEventListener("click", refreshAudit);
}

async function initialize() {
  bindStaticControls();
  setBusy(true);
  try {
    const session = await api("/api/session");
    state.session = session;
    setAccessState(true, session.email);
    const [draft, catalog] = await Promise.all([api("/api/config"), api("/site-catalog.json")]);
    state.config = deepClone(draft.config);
    state.catalog = Array.isArray(catalog.pages) ? catalog.pages : [];
    updateRevision(draft);
    renderAll();
  } catch (error) {
    setAccessState(false);
    byId("view-overview").replaceChildren(
      createElement("p", "empty-state", error instanceof Error ? error.message : "The protected admin could not start."),
    );
    toast("Admin startup was blocked. Verify Cloudflare Access and the dedicated database.", true);
  } finally {
    setBusy(false);
  }
}

initialize();
