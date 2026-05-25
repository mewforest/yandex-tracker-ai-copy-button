import {
  MAX_MEDIA_CLIPBOARD_ITEMS,
  MEDIA_CLIPBOARD_DELAY_MS,
} from "../config/defaults";
import type { MediaItem } from "../config/types";
import { httpGetBlob } from "../net/http";

const CLIPBOARD_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clipboardMime(blob: Blob): string | null {
  if (blob.type && CLIPBOARD_IMAGE_TYPES.has(blob.type)) {
    return blob.type;
  }
  if (blob.type.startsWith("image/")) {
    return blob.type;
  }
  if (blob.type.startsWith("video/")) {
    return blob.type;
  }
  return null;
}

async function writeBlobToClipboard(blob: Blob): Promise<boolean> {
  const mime = clipboardMime(blob);
  if (!mime || !navigator.clipboard?.write) {
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [mime]: blob,
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function copyMediaItemsToClipboard(
  items: MediaItem[],
): Promise<number> {
  const limited = items.slice(0, MAX_MEDIA_CLIPBOARD_ITEMS);
  let copied = 0;

  for (let i = 0; i < limited.length; i++) {
    const item = limited[i];
    try {
      const blob = await httpGetBlob(item.url);
      const ok = await writeBlobToClipboard(blob);
      if (ok) copied += 1;
    } catch {
      /* skip failed item */
    }
    if (i < limited.length - 1) {
      await sleep(MEDIA_CLIPBOARD_DELAY_MS);
    }
  }

  return copied;
}
