(() => {
  const chip = document.getElementById("access-status");
  const metric = document.getElementById("metric-access");
  const topbar = document.querySelector(".topbar-status");
  let csrfToken = "";
  let expiryTimer = 0;

  const normalize = () => {
    if (chip) {
      if (chip.textContent === "Access verified") chip.textContent = "Session verified";
      if (chip.textContent === "Protection check failed") chip.textContent = "Session check failed";
    }
    if (metric && metric.textContent === "Verified") metric.textContent = "Authenticated";
  };

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
    const button = document.createElement("button");
    button.id = "admin-sign-out";
    button.type = "button";
    button.className = "button ghost";
    button.textContent = "Sign out";
    button.setAttribute("aria-label", "Sign out of Print Prep Lab Admin");
    button.addEventListener("click", () => signOut(button));
    topbar.append(button);
  }

  normalize();
  installSignOut();

  const observer = new MutationObserver(normalize);
  if (chip) observer.observe(chip, { childList: true, characterData: true, subtree: true });
  if (metric) observer.observe(metric, { childList: true, characterData: true, subtree: true });

  refreshSessionBoundary().catch(() => {
    if (chip) {
      chip.className = "status-chip status-error";
      chip.textContent = "Session check failed";
    }
  });
})();
