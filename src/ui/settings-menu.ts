import {
  isAddAiPrompt,
  isCopyMediaToClipboard,
  isEmbedTextAttachments,
  setAddAiPrompt,
  setCopyMediaToClipboard,
  setEmbedTextAttachments,
} from "../config/settings";
import { showScriptNotification } from "./notify";

const MENU_EMBED_TEXT = "Встраивать текстовые вложения";
const MENU_COPY_MEDIA = "Копировать медиа (медленно)";
const MENU_ADD_AI_PROMPT = "Добавлять промпт";

function embedTextStatusLabel(): string {
  return `${MENU_EMBED_TEXT}: ${isEmbedTextAttachments() ? "вкл" : "выкл"}`;
}

function copyMediaStatusLabel(): string {
  return `${MENU_COPY_MEDIA}: ${isCopyMediaToClipboard() ? "вкл" : "выкл"}`;
}

function addAiPromptStatusLabel(): string {
  return `${MENU_ADD_AI_PROMPT}: ${isAddAiPrompt() ? "вкл" : "выкл"}`;
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

  GM_registerMenuCommand(MENU_ADD_AI_PROMPT, () => {
    setAddAiPrompt(!isAddAiPrompt());
    showScriptNotification(addAiPromptStatusLabel());
  });
}
