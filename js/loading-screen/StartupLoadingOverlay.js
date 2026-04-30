export function createStartupLoadingOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "startup-loading-overlay";

  const card = document.createElement("div");
  card.className = "startup-loading-card";

  const title = document.createElement("div");
  title.className = "startup-loading-title";
  title.textContent = "Loading...";

  const status = document.createElement("div");
  status.className = "startup-loading-status";
  status.textContent = "Preparing assets";

  const track = document.createElement("div");
  track.className = "startup-loading-track";

  const fill = document.createElement("div");
  fill.className = "startup-loading-fill";

  const percent = document.createElement("div");
  percent.className = "startup-loading-percent";
  percent.textContent = "0%";

  track.appendChild(fill);
  card.appendChild(title);
  card.appendChild(status);
  card.appendChild(track);
  card.appendChild(percent);
  overlay.appendChild(card);

  document.body.appendChild(overlay);

  const setProgress = (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    const progressText = Math.round(clamped * 100) + "%";
    fill.style.width = progressText;
    percent.textContent = progressText;
  };

  const setStatus = (message) => {
    status.textContent = message || "Preparing assets";
  };

  const complete = () => {
    setProgress(1);
    setStatus("Done");
    overlay.classList.add("startup-loading-overlay-hidden");
    window.setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 260);
  };

  return {
    setProgress,
    setStatus,
    complete,
  };
}
