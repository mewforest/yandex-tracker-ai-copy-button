import {
  SPD_COPY_FORMATTED_KEY,
  SPD_EMBED_TEXT_ATTACHMENTS_DEFAULT,
  SPD_EMBED_TEXT_ATTACHMENTS_KEY,
  SPD_COPY_MEDIA_TO_CLIPBOARD_DEFAULT,
  SPD_COPY_MEDIA_TO_CLIPBOARD_KEY,
  SPD_ADD_AI_PROMPT_DEFAULT,
  SPD_ADD_AI_PROMPT_KEY,
} from "./defaults";
import type { CopyOptions } from "./types";

function readEmbedTextAttachments(): boolean {
  const current = GM_getValue(
    SPD_EMBED_TEXT_ATTACHMENTS_KEY,
    undefined as boolean | undefined,
  );
  if (current !== undefined) return Boolean(current);

  const legacy = GM_getValue(
    SPD_COPY_FORMATTED_KEY,
    SPD_EMBED_TEXT_ATTACHMENTS_DEFAULT,
  );
  GM_setValue(SPD_EMBED_TEXT_ATTACHMENTS_KEY, legacy);
  return Boolean(legacy);
}

export function isEmbedTextAttachments(): boolean {
  return readEmbedTextAttachments();
}

export function setEmbedTextAttachments(value: boolean): void {
  GM_setValue(SPD_EMBED_TEXT_ATTACHMENTS_KEY, value);
}

export function isCopyMediaToClipboard(): boolean {
  return GM_getValue(
    SPD_COPY_MEDIA_TO_CLIPBOARD_KEY,
    SPD_COPY_MEDIA_TO_CLIPBOARD_DEFAULT,
  );
}

export function setCopyMediaToClipboard(value: boolean): void {
  GM_setValue(SPD_COPY_MEDIA_TO_CLIPBOARD_KEY, value);
}

export function isAddAiPrompt(): boolean {
  return GM_getValue(SPD_ADD_AI_PROMPT_KEY, SPD_ADD_AI_PROMPT_DEFAULT);
}

export function setAddAiPrompt(value: boolean): void {
  GM_setValue(SPD_ADD_AI_PROMPT_KEY, value);
}

export function getCopyOptions(): CopyOptions {
  return {
    embedTextAttachments: isEmbedTextAttachments(),
    copyMediaToClipboard: isCopyMediaToClipboard(),
    addAiPrompt: isAddAiPrompt(),
  };
}
