import { MAX_IMAGE_BYTES, MAX_TOTAL_IMAGE_BYTES } from "../config/defaults";
import { httpGetBlob } from "../net/http";
import { resolveAbsoluteUrl } from "./resolve-url";

let totalEmbeddedBytes = 0;

export function resetImageEmbedBudget(): void {
  totalEmbeddedBytes = 0;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

export type EmbedResult =
  | { kind: "data"; dataUrl: string }
  | { kind: "url"; url: string; reason: string };

export async function embedImageFromUrl(
  url: string,
  label?: string,
): Promise<EmbedResult> {
  const absolute = resolveAbsoluteUrl(url);

  try {
    const blob = await httpGetBlob(absolute);
    if (blob.size > MAX_IMAGE_BYTES) {
      return {
        kind: "url",
        url: absolute,
        reason: `${label ?? "image"} exceeds ${MAX_IMAGE_BYTES} bytes`,
      };
    }
    if (totalEmbeddedBytes + blob.size > MAX_TOTAL_IMAGE_BYTES) {
      return {
        kind: "url",
        url: absolute,
        reason: "total embedded image budget exceeded",
      };
    }

    const dataUrl = await blobToDataUrl(blob);
    totalEmbeddedBytes += blob.size;
    return { kind: "data", dataUrl };
  } catch {
    return {
      kind: "url",
      url: absolute,
      reason: "failed to fetch image",
    };
  }
}

export function markdownImage(alt: string, embed: EmbedResult): string {
  if (embed.kind === "data") {
    return `![${alt}](${embed.dataUrl})`;
  }
  return `![${alt}](${embed.url})\n\n> Image not embedded (${embed.reason}). URL: ${embed.url}`;
}

export function markdownImageLink(alt: string, url: string): string {
  return `![${alt}](${resolveAbsoluteUrl(url)})`;
}
