const byId = (id) => document.getElementById(id);
const loginForm = byId("login-form");
const setupPanel = byId("setup-panel");
const setupForm = byId("setup-form");
const totpRow = byId("totp-row");
const statusNode = byId("auth-status");

function setStatus(message, ok = false) {
  statusNode.textContent = message || "";
  statusNode.classList.toggle("is-ok", ok);
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body === undefined
      ? { Accept: "application/json" }
      : { Accept: "application/json", "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function showSetup() {
  const { response, payload } = await requestJson("/api/auth/totp/setup");
  if (!response.ok) return false;
  loginForm.hidden = true;
  setupPanel.hidden = false;
  byId("setup-secret").value = payload.secret || "";
  byId("setup-totp").focus();
  setStatus("Authenticator setup is ready. Enter the current 6-digit code.", true);
  return true;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = byId("login-button");
  setBusy(button, true);
  setStatus("");
  const email = byId("email").value.trim();
  const password = byId("password").value;
  const totp = byId("totp").value.trim();
  try {
    const { response, payload } = await requestJson("/api/auth/login", {
      method: "POST",
      body: { email, password, totp: totp || undefined },
    });
    if (response.ok && response.status === 200) {
      setStatus("Authentication complete. Opening the control plane…", true);
      window.location.replace("/");
      return;
    }
    if (response.status === 202 && payload?.setupRequired) {
      byId("password").value = "";
      if (!await showSetup()) setStatus("Authenticator setup could not start. Sign in again.");
      return;
    }
    if (payload?.error === "totp_required") {
      totpRow.hidden = false;
      byId("totp").required = true;
      byId("totp").focus();
      setStatus("Enter the 6-digit code from your authenticator app.");
      return;
    }
    byId("password").value = "";
    setStatus(payload?.message || "Sign-in was rejected.");
  } catch {
    setStatus("The protected sign-in request could not be completed.");
  } finally {
    setBusy(button, false);
  }
});

setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = byId("setup-button");
  setBusy(button, true);
  setStatus("");
  try {
    const { response, payload } = await requestJson("/api/auth/totp/confirm", {
      method: "POST",
      body: { totp: byId("setup-totp").value.trim() },
    });
    if (response.ok) {
      setStatus("Authenticator verified. Opening the control plane…", true);
      window.location.replace("/");
      return;
    }
    setStatus(payload?.message || "Authenticator verification failed.");
  } catch {
    setStatus("Authenticator verification could not be completed.");
  } finally {
    setBusy(button, false);
  }
});

(async function resumeSetup() {
  try {
    await showSetup();
  } catch {
    // No active setup session. The normal sign-in form remains visible.
  }
})();
