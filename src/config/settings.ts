import {
  ADD_AI_PROMPT_DEFAULT,
  ADD_AI_PROMPT_KEY,
  COPY_MEDIA_TO_CLIPBOARD_DEFAULT,
  COPY_MEDIA_TO_CLIPBOARD_KEY,
  EMBED_TEXT_ATTACHMENTS_DEFAULT,
  EMBED_TEXT_ATTACHMENTS_KEY,
} from "./defaults";
import type { CopyOptions } from "./types";

export function isEmbedTextAttachments(): boolean {
  return GM_getValue(
    EMBED_TEXT_ATTACHMENTS_KEY,
    EMBED_TEXT_ATTACHMENTS_DEFAULT,
  );
}

export function setEmbedTextAttachments(value: boolean): void {
  GM_setValue(EMBED_TEXT_ATTACHMENTS_KEY, value);
}

export function isCopyMediaToClipboard(): boolean {
  return GM_getValue(
    COPY_MEDIA_TO_CLIPBOARD_KEY,
    COPY_MEDIA_TO_CLIPBOARD_DEFAULT,
  );
}

export function setCopyMediaToClipboard(value: boolean): void {
  GM_setValue(COPY_MEDIA_TO_CLIPBOARD_KEY, value);
}

export function isAddAiPrompt(): boolean {
  return GM_getValue(ADD_AI_PROMPT_KEY, ADD_AI_PROMPT_DEFAULT);
}

export function setAddAiPrompt(value: boolean): void {
  GM_setValue(ADD_AI_PROMPT_KEY, value);
}

export function getCopyOptions(): CopyOptions {
  return {
    embedTextAttachments: isEmbedTextAttachments(),
    copyMediaToClipboard: isCopyMediaToClipboard(),
    addAiPrompt: isAddAiPrompt(),
  };
}
