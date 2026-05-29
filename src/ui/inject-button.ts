import { getCopyOptions } from "../config/settings";
import { copyMediaItemsToClipboard } from "../clipboard/copy-media";
import { getIssueContext } from "../extract/issue-context";
import { buildIssueCopy } from "../format/build-issue-copy";
import { copySuccessLabel } from "../utils/plural-ru";
import { showScriptNotification } from "./notify";

const ISSUE_WRAPPER_SEL = ".page-issue__wrapper, .page-issue__wrapper_compact";

const BTN_CLASS =
  "g-button g-button_view_flat-secondary g-button_size_m g-button_pin_round-round page-issue__header-btn-copy page-issue__header-btn-copy-ai";

const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="g-icon" fill="currentColor" stroke="none" aria-hidden="true" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.5H8A1.5 1.5 0 0 0 6.5 4v1H8a3 3 0 0 1 3 3v1.5h1A1.5 1.5 0 0 0 13.5 8V4A1.5 1.5 0 0 0 12 2.5M11 11h1a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1H4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3zM4 6.5h4A1.5 1.5 0 0 1 9.5 8v4A1.5 1.5 0 0 1 8 13.5H4A1.5 1.5 0 0 1 2.5 12V8A1.5 1.5 0 0 1 4 6.5"/></svg>`;

const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="g-icon" fill="currentColor" stroke="none" aria-hidden="true" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 8.28a.75.75 0 1 1 1.06-1.06L6 9.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>`;

const BTN_TEXT = "AI";
const AI_COPY_BTN_STYLE_ID = "spd-ai-copy-btn-style";

function injectAiCopyButtonStyles(): void {
  if (document.getElementById(AI_COPY_BTN_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = AI_COPY_BTN_STYLE_ID;
  style.textContent = `
.page-issue__header-btn-copy-ai {
  min-width: 48px !important;
  background: #edeff00F;
  border-radius: 10px;
}
`.trim();
  document.head.appendChild(style);
}

function setButtonContent(button: HTMLButtonElement, svg: string): void {
  button.innerHTML = `<span class="g-button__icon"><span class="g-button__icon-inner">${svg}</span></span><span class="g-button__text">${BTN_TEXT}</span>`;
}

function setButtonIcon(button: HTMLButtonElement, svg: string): void {
  const inner = button.querySelector(".g-button__icon-inner");
  if (inner) {
    inner.innerHTML = svg;
    return;
  }
  setButtonContent(button, svg);
}

function showSuccess(button: HTMLButtonElement, mediaCount: number): void {
  const prevLabel = button.getAttribute("aria-label");
  const prevIcon = button.querySelector(".g-button__icon-inner")?.innerHTML;
  const label = copySuccessLabel(mediaCount);

  button.classList.add("g-button_selected");
  button.setAttribute("aria-label", label);
  setButtonIcon(button, CHECK_ICON_SVG);
  showScriptNotification(label, { pageToast: true, timeout: 2000 });

  window.setTimeout(() => {
    button.classList.remove("g-button_selected");
    if (prevLabel) button.setAttribute("aria-label", prevLabel);
    setButtonIcon(button, prevIcon ?? COPY_ICON_SVG);
  }, 2000);
}

function showError(button: HTMLButtonElement): void {
  const message = "Ошибка копирования";
  button.classList.add("g-button_view_flat-danger");
  button.setAttribute("aria-label", message);
  showScriptNotification(message, { pageToast: true, timeout: 2000 });
  window.setTimeout(() => {
    button.classList.remove("g-button_view_flat-danger");
    button.setAttribute("aria-label", "Копировать для ИИ");
  }, 2000);
}

function copyText(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      GM_setClipboard(text, "text", () => resolve());
    } catch {
      reject(new Error("GM_setClipboard failed"));
    }
  });
}

async function onCopyClick(button: HTMLButtonElement): Promise<void> {
  if (button.disabled) return;
  button.disabled = true;

  try {
    const ctx = getIssueContext(button);
    if (!ctx) throw new Error("Issue context not found");

    const { markdown, mediaItems } = await buildIssueCopy(ctx);
    const options = getCopyOptions();

    let mediaCopiedCount = 0;
    if (options.copyMediaToClipboard && mediaItems.length) {
      mediaCopiedCount = await copyMediaItemsToClipboard(mediaItems);
    }

    await copyText(markdown);
    showSuccess(button, mediaCopiedCount);
  } catch {
    showError(button);
  } finally {
    button.disabled = false;
  }
}

function createAiCopyButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = BTN_CLASS;
  button.setAttribute("aria-label", "Копировать для ИИ");
  button.setAttribute("data-spd-ai-copy", "1");
  setButtonContent(button, COPY_ICON_SVG);
  button.addEventListener("click", () => void onCopyClick(button));
  return button;
}

function insertAfterCopyKey(
  copyKeyBtn: HTMLButtonElement,
  aiBtn: HTMLButtonElement,
): void {
  const anchor =
    copyKeyBtn.parentElement?.tagName === "SPAN"
      ? copyKeyBtn.parentElement
      : copyKeyBtn;

  const wrapper = document.createElement("span");
  wrapper.appendChild(aiBtn);
  anchor.insertAdjacentElement("afterend", wrapper);
}

export function injectIntoWrapper(wrapper: Element): void {
  if (wrapper.getAttribute("data-spd-ai-copy-injected") === "1") return;

  const copyKeyBtn = wrapper.querySelector<HTMLButtonElement>(
    '.page-issue__header-btn-copy[aria-label="Копировать ключ"]',
  );
  if (!copyKeyBtn) return;

  insertAfterCopyKey(copyKeyBtn, createAiCopyButton());
  wrapper.setAttribute("data-spd-ai-copy-injected", "1");
}

export function scanAndInjectButtons(): void {
  document.querySelectorAll(ISSUE_WRAPPER_SEL).forEach((wrapper) => {
    injectIntoWrapper(wrapper);
  });
}

export function startButtonObserver(): void {
  injectAiCopyButtonStyles();
  scanAndInjectButtons();

  const observer = new MutationObserver(() => {
    scanAndInjectButtons();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
