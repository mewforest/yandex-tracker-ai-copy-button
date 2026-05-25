import {
  isCopyMediaToClipboard,
  isEmbedTextAttachments,
  setCopyMediaToClipboard,
  setEmbedTextAttachments,
} from "../config/settings";

function embedTextLabel(): string {
  return `Встраивать текстовые вложения: ${isEmbedTextAttachments() ? "вкл" : "выкл"}`;
}

function copyMediaLabel(): string {
  return `Копировать нетекстовые вложения: ${isCopyMediaToClipboard() ? "вкл" : "выкл"}`;
}

export function registerSettingsMenu(): void {
  GM_registerMenuCommand(embedTextLabel(), () => {
    setEmbedTextAttachments(!isEmbedTextAttachments());
    GM_notification({ text: embedTextLabel(), timeout: 2000 });
  });

  GM_registerMenuCommand(copyMediaLabel(), () => {
    setCopyMediaToClipboard(!isCopyMediaToClipboard());
    GM_notification({ text: copyMediaLabel(), timeout: 2000 });
  });
}
