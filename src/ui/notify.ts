const NOTIFY_TITLE = "Yandex Tracker - AI Copy Button";
const TOAST_ATTR = "data-spd-copy-toast";

function showPageToast(text: string, durationMs: number): void {
  document.querySelector(`[${TOAST_ATTR}]`)?.remove();

  const el = document.createElement("div");
  el.setAttribute(TOAST_ATTR, "1");
  el.textContent = text;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483647",
    padding: "12px 16px",
    background: "var(--g-color-base-generic, #2d2d30)",
    color: "var(--g-color-text-primary, #fff)",
    borderRadius: "8px",
    fontSize: "14px",
    lineHeight: "1.4",
    boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
    maxWidth: "min(360px, calc(100vw - 32px))",
    pointerEvents: "none",
  });

  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), durationMs);
}

export function showScriptNotification(
  text: string,
  options?: { timeout?: number; pageToast?: boolean },
): void {
  const timeout = options?.timeout ?? 2500;

  try {
    GM_notification({
      title: NOTIFY_TITLE,
      text,
      timeout,
    });
  } catch {
    /* GM_notification unavailable */
  }

  if (options?.pageToast) {
    showPageToast(text, timeout);
  }
}
