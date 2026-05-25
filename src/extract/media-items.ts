import type { CopyOptions, MediaItem } from "../config/types";
import { httpGetJson } from "../net/http";
import { resolveAbsoluteUrl } from "../utils/resolve-url";
import { isTextAttachment, parseAttachmentLinks } from "./attachment-utils";

interface TrackerComment {
  attachments?: Array<{ display?: string; self?: string; id?: string }>;
}

function addMedia(
  map: Map<string, MediaItem>,
  url: string,
  name: string,
): void {
  const absolute = resolveAbsoluteUrl(url);
  if (!absolute || map.has(absolute)) return;
  map.set(absolute, { url: absolute, name });
}

function collectFromDescription(
  root: ParentNode,
  map: Map<string, MediaItem>,
): void {
  const yfm = root.querySelector<HTMLElement>(
    ".entity-description-desktop .yfm, .page-issue__issue-description .yfm",
  );
  if (!yfm) return;

  for (const img of yfm.querySelectorAll("img[src]")) {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("data:")) continue;
    const name = img.getAttribute("alt")?.trim() || "image";
    addMedia(map, src, name);
  }
}

function collectFromAttachments(
  root: ParentNode,
  map: Map<string, MediaItem>,
): void {
  for (const item of parseAttachmentLinks(root)) {
    if (isTextAttachment(item.name)) continue;
    addMedia(map, item.url, item.name);
  }
}

async function collectFromComments(
  root: ParentNode,
  issueKey: string,
  map: Map<string, MediaItem>,
): Promise<void> {
  try {
    const data = await httpGetJson<
      TrackerComment[] | { comments?: TrackerComment[] }
    >(`/ajax/v2/issues/${issueKey}/comments?expand=all`);
    const list = Array.isArray(data) ? data : (data.comments ?? []);
    for (const c of list) {
      for (const att of c.attachments ?? []) {
        const name = att.display ?? `attachment-${att.id}`;
        const url =
          att.self ??
          (att.id
            ? `${location.origin}/ajax/v2/attachments/${att.id}?inline=true`
            : "");
        if (!url || isTextAttachment(name)) continue;
        addMedia(map, url, name);
      }
    }
  } catch {
    /* DOM fallback: no structured comment attachments */
  }

  const commentImgs = root.querySelectorAll<HTMLElement>(
    ".comments img[src], .issue-activity-section img[src]",
  );
  for (const img of commentImgs) {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("data:")) continue;
    addMedia(map, src, img.getAttribute("alt")?.trim() || "image");
  }
}

export async function collectMediaItems(
  root: ParentNode,
  issueKey: string,
  options: CopyOptions,
): Promise<MediaItem[]> {
  if (!options.copyMediaToClipboard) return [];

  const map = new Map<string, MediaItem>();
  collectFromDescription(root, map);
  collectFromAttachments(root, map);
  await collectFromComments(root, issueKey, map);

  return [...map.values()];
}
