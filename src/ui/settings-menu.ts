import {
  isCopyMediaToClipboard,
  isEmbedTextAttachments,
  setCopyMediaToClipboard,
  setEmbedTextAttachments,
} from "../config/settings";
import { showScriptNotification } from "./notify";

const MENU_EMBED_TEXT = "Встраивать текстовые вложения";
const MENU_COPY_MEDIA = "Копировать нетекстовые вложения";

function embedTextStatusLabel(): string {
  return `${MENU_EMBED_TEXT}: ${isEmbedTextAttachments() ? "вкл" : "выкл"}`;
}

function copyMediaStatusLabel(): string {
  return `${MENU_COPY_MEDIA}: ${isCopyMediaToClipboard() ? "вкл" : "выкл"}`;
}

export function registerSettingsMenu(): void {
  GM_registerMenuCommand(MENU_EMBED_TEXT, () => {
    setEmbedTextAttachments(!isEmbedTextAttachments());
    showScriptNotification(embedTextStatusLabel());
  });

  GM_registerMenuCommand(MENU_COPY_MEDIA, () => {
    setCopyMediaToClipboard(!isCopyMediaToClipboard());
    showScriptNotification(copyMediaStatusLabel());
  });
}
