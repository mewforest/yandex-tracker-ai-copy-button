import type { CopyOptions } from "../config/types";
import { httpGetBlob, httpGetText } from "../net/http";
import {
  embedImageFromUrl,
  markdownImage,
  markdownImageLink,
} from "../utils/image-embed";
import { resolveAbsoluteUrl } from "../utils/resolve-url";

const TEXT_EXTENSIONS = new Set([
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

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

export interface AttachmentLink {
  id: string;
  name: string;
  url: string;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function parseAttachmentLinks(root: ParentNode): AttachmentLink[] {
  const links = root.querySelectorAll<HTMLAnchorElement>(
    '.entity-description-attachments a[href*="/ajax/v2/attachments/"]',
  );
  const seen = new Set<string>();
  const result: AttachmentLink[] = [];

  for (const link of links) {
    const match = link.href.match(/\/attachments\/(\d+)/);
    if (!match) continue;
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const rawName = link.textContent?.trim() ?? "";
    const name =
      rawName
        .replace(
          /\s+\d{1,2}\s+(?:янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек)\S*$/i,
          "",
        )
        .replace(/\s+\d{1,2}\s+\S+$/i, "")
        .trim() || `attachment-${id}`;
    const url = link.href.includes("inline=")
      ? link.href
      : `${link.href.split("?")[0]}?inline=true`;

    result.push({ id, name: name.trim(), url });
  }

  return result;
}

function fenceLang(ext: string): string {
  if (ext === "yml") return "yaml";
  return ext || "";
}

function formatTextAttachmentLink(name: string, url: string): string {
  return `### ${name}\n\nURL: ${resolveAbsoluteUrl(url)}`;
}

async function formatTextAttachment(
  name: string,
  url: string,
): Promise<string> {
  const ext = extensionOf(name);
  try {
    const text = await httpGetText(url);
    const lang = fenceLang(ext);
    return `### ${name}\n\n\`\`\`${lang}\n${text.trim()}\n\`\`\``;
  } catch {
    return `### ${name}\n\n> Failed to load attachment.\n\nURL: ${resolveAbsoluteUrl(url)}`;
  }
}

async function formatImageAttachment(
  name: string,
  url: string,
  options: CopyOptions,
): Promise<string> {
  if (!options.formatted) {
    return `### ${name}\n\n${markdownImageLink(name, url)}`;
  }
  const embed = await embedImageFromUrl(url, name);
  return `### ${name}\n\n${markdownImage(name, embed)}`;
}

export async function extractAttachments(
  root: ParentNode,
  options: CopyOptions,
): Promise<string | null> {
  const items = parseAttachmentLinks(root);
  if (!items.length) return null;

  const sections = await Promise.all(
    items.map(async (item) => {
      const ext = extensionOf(item.name);

      if (TEXT_EXTENSIONS.has(ext)) {
        return options.formatted
          ? formatTextAttachment(item.name, item.url)
          : formatTextAttachmentLink(item.name, item.url);
      }

      if (IMAGE_EXTENSIONS.has(ext)) {
        return formatImageAttachment(item.name, item.url, options);
      }

      if (!options.formatted) {
        return formatTextAttachmentLink(item.name, item.url);
      }

      try {
        const blob = await httpGetBlob(item.url);
        if (blob.type.startsWith("image/")) {
          return formatImageAttachment(item.name, item.url, options);
        }
        if (
          blob.type.startsWith("text/") ||
          blob.type.includes("json") ||
          blob.type.includes("yaml")
        ) {
          const text = await blob.text();
          return `### ${item.name}\n\n\`\`\`\n${text.trim()}\n\`\`\``;
        }
      } catch {
        /* fall through */
      }

      return `### ${item.name}\n\nURL: ${resolveAbsoluteUrl(item.url)}`;
    }),
  );

  return sections.join("\n\n");
}
