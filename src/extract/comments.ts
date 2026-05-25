import type { CopyOptions } from "../config/types";
import { httpGetJson } from "../net/http";
import {
  htmlFragmentToMarkdown,
  normalizeImagesInMarkdown,
} from "../utils/html-to-md";
import { markdownImageLink } from "../utils/image-markdown";
import { isMediaAttachment } from "./attachment-utils";

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

async function commentBody(comment: TrackerComment): Promise<string> {
  let body = "";
  if (comment.textHtml) {
    body = await htmlFragmentToMarkdown(comment.textHtml);
  } else if (comment.text) {
    body = comment.text;
  }

  body = await normalizeImagesInMarkdown(body);

  if (comment.attachments?.length) {
    const attParts: string[] = [];
    for (const att of comment.attachments) {
      const name = att.display ?? `attachment-${att.id}`;
      const url = attachmentUrl(att);
      if (!url) continue;
      if (isMediaAttachment(name)) {
        attParts.push(markdownImageLink(name, url));
      }
    }
    if (attParts.length) {
      body = `${body}\n\n${attParts.join("\n\n")}`.trim();
    }
  }

  return body.trim();
}

async function fetchCommentsFromApi(
  issueKey: string,
): Promise<CommentBlock[] | null> {
  try {
    const data = await httpGetJson<
      TrackerComment[] | { comments?: TrackerComment[] }
    >(`/ajax/v2/issues/${issueKey}/comments?expand=all`);
    const list = Array.isArray(data) ? data : (data.comments ?? []);
    if (!list.length) return [];

    const blocks: CommentBlock[] = [];
    for (const c of list) {
      const body = await commentBody(c);
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

function fetchCommentsFromDom(root: ParentNode): CommentBlock[] {
  const blocks: CommentBlock[] = [];
  const nodes = root.querySelectorAll<HTMLElement>(
    '.comments .comment, [class*="comment-list"] [class*="comment"]:not(.comment-editor)',
  );

  for (const node of nodes) {
    if (
      node.closest(".comment-editor, .issue-activity-section__comment-editor")
    ) {
      continue;
    }

    const bodyEl =
      node.querySelector<HTMLElement>(
        ".comment__body .yfm, .comment-body .yfm, .yfm",
      ) ?? node.querySelector<HTMLElement>(".comment__body, .comment-body");

    const text = bodyEl?.innerText?.trim();
    if (!text) continue;

    const author =
      node
        .querySelector<HTMLElement>('.comment__author, [class*="author"]')
        ?.textContent?.trim() ?? "Unknown";

    const date =
      node
        .querySelector<HTMLElement>('.comment__date, time, [class*="date"]')
        ?.textContent?.trim() ?? "";

    blocks.push({ author, date, body: text });
  }

  return blocks;
}

export async function extractComments(
  root: ParentNode,
  issueKey: string,
  _options: CopyOptions,
): Promise<CommentBlock[]> {
  const fromApi = await fetchCommentsFromApi(issueKey);
  if (fromApi !== null) return fromApi;
  return fetchCommentsFromDom(root);
}
