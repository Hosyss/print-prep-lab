(() => {
  const chip = document.getElementById("access-status");
  const metric = document.getElementById("metric-access");

  const normalize = () => {
    if (chip) {
      if (chip.textContent === "Access verified") chip.textContent = "Session verified";
      if (chip.textContent === "Protection check failed") chip.textContent = "Session check failed";
    }
    if (metric && metric.textContent === "Verified") metric.textContent = "Authenticated";
  };

  normalize();

  const observer = new MutationObserver(normalize);
  if (chip) observer.observe(chip, { childList: true, characterData: true, subtree: true });
  if (metric) observer.observe(metric, { childList: true, characterData: true, subtree: true });
})();
