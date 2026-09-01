(() => {
  const chip = document.getElementById("access-status");
  const metric = document.getElementById("metric-access");
  const identity = document.getElementById("admin-identity");
  const toast = document.getElementById("toast");
  const topbar = document.querySelector(".topbar-status");
  const pageSelect = document.getElementById("page-select");
  const pageSourceNote = document.getElementById("page-source-note");
  const metricPages = document.getElementById("metric-pages");
  const toolList = document.getElementById("tool-list");
  let csrfToken = "";
  let expiryTimer = 0;
  let catalogPages = [];
  let pageFilterInput = null;
  let pageFilterCount = null;
  let toolFilterInput = null;
  let toolFilterCount = null;
  let lastSelectedRoute = pageSelect?.value || "";

  const normalizeText = (value) => String(value || "").trim().toLocaleLowerCase("en-US");

  const normalize = () => {
    if (chip) {
      if (chip.textContent === "Access verified") chip.textContent = "Session verified";
      if (chip.textContent === "Protection check failed") chip.textContent = "Session check failed";
    }
    if (metric && metric.textContent === "Verified") metric.textContent = "Authenticated";
    if (toast && toast.textContent.startsWith("Admin startup was blocked.")) {
      toast.textContent = "Admin startup was blocked. Verify the protected session and the dedicated Admin database.";
    }
  };

  function showLocalNotice(message, error = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("error", error);
    toast.hidden = false;
  }

  async function refreshSessionBoundary() {
    const response = await fetch("/api/session", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) {
      if (response.status === 401) window.location.replace("/");
      throw new Error("The protected admin session could not be verified.");
    }
    const payload = await response.json();
    csrfToken = String(payload.csrfToken || "");
    if (!/^[0-9a-f]{64}$/i.test(csrfToken)) throw new Error("The protected session token is invalid.");

    const expiresAt = Date.parse(String(payload.expiresAt || ""));
    if (!Number.isFinite(expiresAt)) throw new Error("The protected session expiry is invalid.");
    if (chip) chip.title = `Session expires ${new Date(expiresAt).toLocaleString()}`;

    window.clearTimeout(expiryTimer);
    const remaining = Math.max(0, expiresAt - Date.now() + 250);
    expiryTimer = window.setTimeout(() => window.location.replace("/"), remaining);
    return payload;
  }

  async function signOut(button) {
    button.disabled = true;
    try {
      if (!csrfToken) await refreshSessionBoundary();
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: "{}",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
      });
      if (!response.ok && response.status !== 401) throw new Error("Sign out was rejected.");
    } catch {
      // Navigating to the protected root still forces a fresh server-side session check.
    } finally {
      csrfToken = "";
      window.location.replace("/");
    }
  }

  function installSignOut() {
    if (!topbar || document.getElementById("admin-sign-out")) return;
    if (identity && window.matchMedia("(max-width: 620px)").matches) identity.hidden = true;
    const button = document.createElement("button");
    button.id = "admin-sign-out";
    button.type = "button";
    button.className = "button ghost";
    button.textContent = "Sign out";
    button.setAttribute("aria-label", "Sign out of Print Prep Lab Admin");
    button.addEventListener("click", () => signOut(button));
    topbar.append(button);
  }

  function filterControl(id, labelText, placeholder) {
    const label = document.createElement("label");
    label.className = "page-picker";
    const caption = document.createElement("span");
    caption.textContent = labelText;
    const input = document.createElement("input");
    input.id = id;
    input.type = "search";
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", labelText);
    const count = document.createElement("small");
    count.className = "field-note";
    label.append(caption, input, count);
    return { label, input, count };
  }

  function setPageEditorEnabled(enabled) {
    for (const id of [
      "page-title",
      "page-title-ar",
      "page-description",
      "page-description-ar",
      "page-h1",
      "page-h1-ar",
      "page-intro",
      "page-intro-ar",
      "page-enabled",
      "add-section",
    ]) {
      const control = document.getElementById(id);
      if (control) control.disabled = !enabled;
    }
  }

  function pageSourceLabel(page) {
    if (page?.sourceType === "recovery-html") return `pinned recovery ${page.sourceRelease || "v118.6"}`;
    if (page?.sourceType === "production-sitemap") return "current Production sitemap";
    return "managed catalog";
  }

  function updatePageContext() {
    if (!pageSelect || !catalogPages.length) return;
    const page = catalogPages.find((entry) => entry.route === pageSelect.value);
    if (!page) return;
    lastSelectedRoute = page.route;
    if (pageSourceNote) {
      const indexed = page.indexedInProduction === true ? "indexed in the current sitemap" : "live but not in the current sitemap";
      pageSourceNote.textContent = `Baseline: ${page.title}. Source: ${pageSourceLabel(page)}; ${indexed}. Empty override fields leave the baseline unchanged in a future integration.`;
    }
    const title = document.getElementById("page-title");
    const description = document.getElementById("page-description");
    const h1 = document.getElementById("page-h1");
    if (title) title.placeholder = page.title || "";
    if (description) description.placeholder = page.baselineDescription || "";
    if (h1) h1.placeholder = page.baselineH1 || "";
  }

  function applyPageFilter() {
    if (!pageSelect || !pageFilterInput || !catalogPages.length) return;
    const query = normalizeText(pageFilterInput.value);
    const matches = catalogPages.filter((page) => {
      const haystack = normalizeText(`${page.title} ${page.route} ${page.kind || ""} ${page.sourceRelease || ""}`);
      return !query || haystack.includes(query);
    });
    const preferred = matches.some((page) => page.route === lastSelectedRoute)
      ? lastSelectedRoute
      : (matches[0]?.route || "");

    pageSelect.replaceChildren();
    for (const page of matches) {
      const option = document.createElement("option");
      option.value = page.route;
      option.textContent = `${page.title} — ${page.route}`;
      pageSelect.append(option);
    }

    if (!matches.length) {
      const option = document.createElement("option");
      option.textContent = "No matching managed pages";
      option.disabled = true;
      option.selected = true;
      pageSelect.append(option);
      pageSelect.disabled = true;
      setPageEditorEnabled(false);
      if (pageSourceNote) pageSourceNote.textContent = "No managed pages match this filter. Clear or change the search to continue editing.";
    } else {
      pageSelect.disabled = false;
      setPageEditorEnabled(true);
      const changed = pageSelect.value !== preferred || lastSelectedRoute !== preferred;
      pageSelect.value = preferred;
      if (changed) pageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      else updatePageContext();
    }
    if (pageFilterCount) pageFilterCount.textContent = `${matches.length} of ${catalogPages.length} pages`;
  }

  function installPageFilter() {
    if (!pageSelect || document.getElementById("page-filter")) return;
    const heading = document.querySelector(".page-picker-heading");
    if (!heading) return;
    const control = filterControl("page-filter", "Find page", "Search title, route or type");
    pageFilterInput = control.input;
    pageFilterCount = control.count;
    const picker = pageSelect.closest("label");
    if (picker) heading.insertBefore(control.label, picker);
    else heading.append(control.label);
    pageFilterInput.addEventListener("input", applyPageFilter);
    pageSelect.addEventListener("change", updatePageContext);
    if (metricPages) {
      new MutationObserver(() => applyPageFilter()).observe(metricPages, { childList: true, characterData: true, subtree: true });
    }
    applyPageFilter();
  }

  function applyToolFilter() {
    if (!toolList || !toolFilterInput) return;
    const query = normalizeText(toolFilterInput.value);
    const rows = [...toolList.querySelectorAll(".tool-row")];
    let visible = 0;
    for (const row of rows) {
      const match = !query || normalizeText(row.textContent).includes(query);
      row.hidden = !match;
      if (match) visible += 1;
    }
    if (toolFilterCount) toolFilterCount.textContent = `${visible} of ${rows.length} tools`;
  }

  function installToolFilter() {
    if (!toolList || document.getElementById("tool-filter")) return;
    const view = document.getElementById("view-tools");
    const intro = view?.querySelector(".panel-intro");
    const control = filterControl("tool-filter", "Find tool", "Search tool name or route");
    toolFilterInput = control.input;
    toolFilterCount = control.count;
    if (intro) intro.insertAdjacentElement("afterend", control.label);
    else toolList.parentElement?.insertBefore(control.label, toolList);
    toolFilterInput.addEventListener("input", applyToolFilter);
    new MutationObserver(applyToolFilter).observe(toolList, { childList: true, subtree: true });
    applyToolFilter();
  }

  async function loadCatalogUx() {
    const response = await fetch("/site-catalog.json", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error("The protected Admin catalog could not be loaded.");
    const payload = await response.json();
    if (!Array.isArray(payload.pages) || payload.pages.length !== 113) throw new Error("The protected Admin catalog is incomplete.");
    if (new Set(payload.pages.map((page) => page.route)).size !== payload.pages.length) throw new Error("The protected Admin catalog contains duplicate routes.");
    catalogPages = payload.pages.map((page) => ({ ...page }));
    if (pageSelect?.value) lastSelectedRoute = pageSelect.value;
    installPageFilter();
    installToolFilter();
    updatePageContext();
  }

  normalize();
  installSignOut();

  const observer = new MutationObserver(normalize);
  if (chip) observer.observe(chip, { childList: true, characterData: true, subtree: true });
  if (metric) observer.observe(metric, { childList: true, characterData: true, subtree: true });
  if (toast) observer.observe(toast, { childList: true, characterData: true, subtree: true });

  refreshSessionBoundary()
    .then(() => loadCatalogUx().catch(() => {
      showLocalNotice("The Admin catalog search could not start. Editing remains protected; reload the Admin before using page or tool filters.", true);
    }))
    .catch(() => {
      if (chip) {
        chip.className = "status-chip status-error";
        chip.textContent = "Session check failed";
      }
    });
})();
