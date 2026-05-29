import type { CopyOptions } from "../config/types";
import { httpGetJson } from "../net/http";
import {
  htmlFragmentToMarkdown,
  normalizeImagesInMarkdown,
} from "../utils/html-to-md";
import { markdownImageLink } from "../utils/image-markdown";
import { resolveAbsoluteUrl } from "../utils/resolve-url";
import { formatTextAttachment } from "./attachments";
import {
  type AttachmentLink,
  formatAttachmentUrlLine,
  isMediaAttachment,
  isTextAttachment,
  normalizeAttachmentName,
  parseAttachmentLinksIn,
} from "./attachment-utils";

export interface CommentBlock {
  author: string;
  date: string;
  body: string;
}

interface TrackerComment {
  text?: string;
  textHtml?: string;
  createdBy?: { display?: string };
  createdAt?: string;
  attachments?: Array<{ display?: string; self?: string; id?: string }>;
}

const COMMENT_SELECTOR =
  'article[aria-label*="Комментарий"], .comments .comment, [class*="comment-list"] .comment-view:not(.comment-editor)';

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function attachmentUrl(att: {
  display?: string;
  self?: string;
  id?: string;
}): string {
  return (
    att.self ??
    (att.id
      ? `${location.origin}/ajax/v2/attachments/${att.id}?inline=true`
      : "")
  );
}

function trackerAttachmentToLink(att: {
  display?: string;
  self?: string;
  id?: string;
}): AttachmentLink | null {
  const url = attachmentUrl(att);
  if (!url) return null;
  const id = url.match(/\/attachments\/(\d+)/)?.[1] ?? att.id ?? "";
  const name = normalizeAttachmentName(att.display ?? `attachment-${id}`);
  return { id, name, url };
}

function bodyReferencesAttachment(body: string, item: AttachmentLink): boolean {
  const absolute = resolveAbsoluteUrl(item.url);
  return (
    body.includes(item.url) ||
    body.includes(absolute) ||
    body.includes(item.id) ||
    body.includes(item.name)
  );
}

async function formatCommentAttachment(
  name: string,
  url: string,
  options: CopyOptions,
): Promise<string> {
  const displayName = normalizeAttachmentName(name);
  if (isTextAttachment(displayName)) {
    return options.embedTextAttachments
      ? formatTextAttachment(displayName, url)
      : formatAttachmentUrlLine(displayName, url);
  }
  if (isMediaAttachment(displayName)) {
    return markdownImageLink(displayName, url);
  }
  return formatAttachmentUrlLine(displayName, url);
}

async function appendCommentAttachments(
  body: string,
  items: AttachmentLink[],
  options: CopyOptions,
): Promise<string> {
  const attParts: string[] = [];
  for (const item of items) {
    if (bodyReferencesAttachment(body, item)) continue;
    attParts.push(await formatCommentAttachment(item.name, item.url, options));
  }
  if (!attParts.length) return body;
  return `${body}\n\n${attParts.join("\n\n")}`.trim();
}

async function embedTextAttachmentLinksInMarkdown(
  body: string,
  options: CopyOptions,
): Promise<string> {
  if (!options.embedTextAttachments) return body;

  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let result = body;
  for (const match of body.matchAll(linkRe)) {
    const [full, label, url] = match;
    if (!url.includes("/attachments/") || !isTextAttachment(label)) continue;
    const embedded = await formatTextAttachment(
      normalizeAttachmentName(label),
      url,
    );
    result = result.replace(full, embedded);
  }
  return result;
}

async function commentBody(
  comment: TrackerComment,
  options: CopyOptions,
): Promise<string> {
  let body = "";
  if (comment.textHtml) {
    body = await htmlFragmentToMarkdown(comment.textHtml);
  } else if (comment.text) {
    body = comment.text;
  }

  body = await normalizeImagesInMarkdown(body);
  body = await embedTextAttachmentLinksInMarkdown(body, options);

  const apiLinks = (comment.attachments ?? [])
    .map(trackerAttachmentToLink)
    .filter((item): item is AttachmentLink => item !== null);

  return appendCommentAttachments(body, apiLinks, options);
}

async function fetchCommentsFromApi(
  issueKey: string,
  options: CopyOptions,
): Promise<CommentBlock[] | null> {
  try {
    const data = await httpGetJson<
      TrackerComment[] | { comments?: TrackerComment[] }
    >(`/ajax/v2/issues/${issueKey}/comments?expand=all`);
    const list = Array.isArray(data) ? data : (data.comments ?? []);
    if (!list.length) return null;

    const blocks: CommentBlock[] = [];
    for (const c of list) {
      const body = await commentBody(c, options);
      if (!body) continue;
      blocks.push({
        author: c.createdBy?.display ?? "Unknown",
        date: formatDate(c.createdAt),
        body,
      });
    }
    return blocks;
  } catch {
    return null;
  }
}

async function commentBlockFromNode(
  node: HTMLElement,
  options: CopyOptions,
): Promise<CommentBlock | null> {
  const textEl = node.querySelector<HTMLElement>(
    ".comment-view__text, .comment__body, .comment-body",
  );
  let body = "";
  if (textEl) {
    body = await htmlFragmentToMarkdown(textEl.innerHTML);
    body = await normalizeImagesInMarkdown(body);
    body = await embedTextAttachmentLinksInMarkdown(body, options);
  }

  const attRoot = node.querySelector<HTMLElement>(
    ".comment-view__attachments, .ep-files-feed_has-attachments",
  );
  if (attRoot) {
    body = await appendCommentAttachments(
      body,
      parseAttachmentLinksIn(attRoot),
      options,
    );
  }

  if (!body.trim()) return null;

  const author =
    node
      .querySelector<HTMLElement>(
        '.comment-header__author .user-name, .comment__author, [class*="author"]',
      )
      ?.textContent?.trim() ?? "Unknown";

  const timeEl = node.querySelector<HTMLTimeElement>("time[datetime]");
  const date = timeEl
    ? formatDate(timeEl.getAttribute("datetime") ?? undefined)
    : (node
        .querySelector<HTMLElement>('.comment__date, time, [class*="date"]')
        ?.textContent?.trim() ?? "");

  return { author, date, body: body.trim() };
}

async function fetchCommentsFromDom(
  root: ParentNode,
  options: CopyOptions,
): Promise<CommentBlock[]> {
  const blocks: CommentBlock[] = [];
  const nodes = root.querySelectorAll<HTMLElement>(COMMENT_SELECTOR);

  for (const node of nodes) {
    if (
      node.closest(".comment-editor, .issue-activity-section__comment-editor")
    ) {
      continue;
    }

    const block = await commentBlockFromNode(node, options);
    if (block) blocks.push(block);
  }

  return blocks;
}

export async function extractComments(
  root: ParentNode,
  issueKey: string,
  options: CopyOptions,
): Promise<CommentBlock[]> {
  const fromApi = await fetchCommentsFromApi(issueKey, options);
  if (fromApi !== null) return fromApi;
  return fetchCommentsFromDom(root, options);
}
