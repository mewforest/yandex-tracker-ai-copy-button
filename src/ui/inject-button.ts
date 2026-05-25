import { getCopyOptions } from "../config/settings";
import { copyMediaItemsToClipboard } from "../clipboard/copy-media";
import { getIssueContext } from "../extract/issue-context";
import { buildIssueCopy } from "../format/build-issue-copy";
import { copySuccessLabel } from "../utils/plural-ru";
import { showScriptNotification } from "./notify";

const ISSUE_WRAPPER_SEL = ".page-issue__wrapper, .page-issue__wrapper_compact";

const BTN_CLASS =
  "g-button g-button_view_flat-secondary g-button_size_m g-button_pin_round-round page-issue__header-btn-copy page-issue__header-btn-copy-ai";

const AI_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="g-icon" fill="currentColor" stroke="none" aria-hidden="true" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.5a.75.75 0 0 1 .67.41l1.37 2.74 2.74 1.37a.75.75 0 0 1 0 1.34l-2.74 1.37-1.37 2.74a.75.75 0 0 1-1.34 0L6.59 8.32 3.85 6.95a.75.75 0 0 1 0-1.34l2.74-1.37L7.33 1.91A.75.75 0 0 1 8 1.5Zm0 2.57L7.18 6.1 5.57 6.9 7.18 7.7 8 9.43l.82-1.73 1.61-.8-1.61-.8L8 4.07ZM3 10.5a.75.75 0 0 1 .53.22l1.06 1.06.22 1.06a.75.75 0 0 1-1.34.67l-.22-1.06-1.06-.22a.75.75 0 0 1-.67-1.34l1.06-.22 1.06-1.06A.75.75 0 0 1 3 10.5Zm10 0c.2 0 .39.08.53.22l1.06 1.06.22 1.06a.75.75 0 0 1-1.34.67l-.22-1.06-1.06-.22a.75.75 0 0 1-.67-1.34l1.06-.22 1.06-1.06c.14-.14.33-.22.53-.22Z"/></svg>`;

const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="g-icon" fill="currentColor" stroke="none" aria-hidden="true" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 8.28a.75.75 0 1 1 1.06-1.06L6 9.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>`;

function setButtonIcon(button: HTMLButtonElement, svg: string): void {
  const inner = button.querySelector(".g-button__icon-inner");
  if (inner) {
    inner.innerHTML = svg;
    return;
  }
  button.innerHTML = `<span class="g-button__icon"><span class="g-button__icon-inner">${svg}</span></span>`;
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
    setButtonIcon(button, prevIcon ?? AI_ICON_SVG);
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
  setButtonIcon(button, AI_ICON_SVG);
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
  scanAndInjectButtons();

  const observer = new MutationObserver(() => {
    scanAndInjectButtons();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
