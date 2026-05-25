import type { CopyOptions } from "../config/types";
import { httpGetBlob, httpGetText } from "../net/http";
import { markdownImageLink } from "../utils/image-markdown";
import { resolveAbsoluteUrl } from "../utils/resolve-url";
import {
  formatAttachmentUrlLine,
  isMediaAttachment,
  isTextAttachment,
  parseAttachmentLinks,
  extensionOf,
} from "./attachment-utils";

function fenceLang(ext: string): string {
  if (ext === "yml") return "yaml";
  return ext || "";
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

export async function extractAttachments(
  root: ParentNode,
  options: CopyOptions,
): Promise<string | null> {
  const items = parseAttachmentLinks(root);
  if (!items.length) return null;

  const sections = await Promise.all(
    items.map(async (item) => {
      if (isTextAttachment(item.name)) {
        return options.embedTextAttachments
          ? formatTextAttachment(item.name, item.url)
          : formatAttachmentUrlLine(item.name, item.url);
      }

      if (isMediaAttachment(item.name)) {
        return `### ${item.name}\n\n${markdownImageLink(item.name, item.url)}`;
      }

      if (!options.embedTextAttachments) {
        return formatAttachmentUrlLine(item.name, item.url);
      }

      try {
        const blob = await httpGetBlob(item.url);
        if (blob.type.startsWith("image/")) {
          return `### ${item.name}\n\n${markdownImageLink(item.name, item.url)}`;
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

      return formatAttachmentUrlLine(item.name, item.url);
    }),
  );

  return sections.join("\n\n");
}
