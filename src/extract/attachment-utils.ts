import { resolveAbsoluteUrl } from "../utils/resolve-url";

export const TEXT_EXTENSIONS = new Set([
  "json",
  "yaml",
  "yml",
  "md",
  "txt",
  "csv",
  "xml",
  "toml",
  "log",
]);

export const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
]);

export const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mov",
  "avi",
  "mkv",
  "m4v",
]);

export interface AttachmentLink {
  id: string;
  name: string;
  url: string;
}

export function isTextAttachment(name: string): boolean {
  return TEXT_EXTENSIONS.has(extensionOf(name));
}

export function isMediaAttachment(name: string): boolean {
  const ext = extensionOf(name);
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
}

const TRAILING_DATE_RE =
  /\s+\d{1,2}\s+(?:янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек)\S*$/i;

const TRAILING_DATE_PAREN_RE =
  /\s*\(\d{1,2}\s+(?:янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек)[^)]*\)\s*$/i;

/** Strip Tracker upload date suffixes from attachment display names. */
export function normalizeAttachmentName(name: string): string {
  return name
    .replace(TRAILING_DATE_PAREN_RE, "")
    .replace(TRAILING_DATE_RE, "")
    .trim();
}

function extractAttachmentName(link: HTMLAnchorElement, id: string): string {
  const badgeText = link.querySelector(".ep-file-badge__text");
  if (badgeText) {
    const fromLabel = badgeText.getAttribute("aria-label")?.trim();
    if (fromLabel) return fromLabel;
    const fromText = badgeText.textContent?.trim();
    if (fromText) return fromText;
  }

  const rawName = link.textContent?.trim() ?? "";
  const withoutDate = normalizeAttachmentName(rawName);
  return withoutDate || `attachment-${id}`;
}

export function extensionOf(name: string): string {
  const base = normalizeAttachmentName(name);
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}

function collectAttachmentLinks(
  links: NodeListOf<HTMLAnchorElement> | HTMLAnchorElement[],
): AttachmentLink[] {
  const seen = new Set<string>();
  const result: AttachmentLink[] = [];

  for (const link of links) {
    const match = link.href.match(/\/attachments\/(\d+)/);
    if (!match) continue;
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const name = extractAttachmentName(link, id);
    const url = link.href.includes("inline=")
      ? link.href
      : `${link.href.split("?")[0]}?inline=true`;

    result.push({ id, name: name.trim(), url });
  }

  return result;
}

export function parseAttachmentLinks(root: ParentNode): AttachmentLink[] {
  return collectAttachmentLinks(
    root.querySelectorAll<HTMLAnchorElement>(
      '.entity-description-attachments a[href*="/ajax/v2/attachments/"]',
    ),
  );
}

/** Attachment links inside a comment or other nested block. */
export function parseAttachmentLinksIn(root: ParentNode): AttachmentLink[] {
  return collectAttachmentLinks(
    root.querySelectorAll<HTMLAnchorElement>(
      'a[href*="/ajax/v2/attachments/"]',
    ),
  );
}

export function formatAttachmentUrlLine(name: string, url: string): string {
  return `### ${name}\n\nURL: ${resolveAbsoluteUrl(url)}`;
}
