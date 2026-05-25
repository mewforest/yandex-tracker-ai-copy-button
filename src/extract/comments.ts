import type { CopyOptions } from "../config/types";
import { httpGetJson } from "../net/http";
import {
  htmlFragmentToMarkdown,
  embedRemoteImagesInMarkdown,
} from "../utils/html-to-md";
import {
  embedImageFromUrl,
  markdownImage,
  markdownImageLink,
} from "../utils/image-embed";
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

async function commentBody(
  comment: TrackerComment,
  options: CopyOptions,
): Promise<string> {
  let body = "";
  if (comment.textHtml) {
    body = await htmlFragmentToMarkdown(comment.textHtml, options);
  } else if (comment.text) {
    body = comment.text;
  }

  body = await embedRemoteImagesInMarkdown(body, options);

  if (comment.attachments?.length) {
    const attParts: string[] = [];
    for (const att of comment.attachments) {
      const name = att.display ?? `attachment-${att.id}`;
      const url =
        att.self ??
        (att.id
          ? `${location.origin}/ajax/v2/attachments/${att.id}?inline=true`
          : "");
      if (!url) continue;

      if (options.formatted) {
        const embed = await embedImageFromUrl(url, name);
        attParts.push(markdownImage(name, embed));
      } else {
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
  options: CopyOptions,
): Promise<CommentBlock[] | null> {
  try {
    const data = await httpGetJson<
      TrackerComment[] | { comments?: TrackerComment[] }
    >(`/ajax/v2/issues/${issueKey}/comments?expand=all`);
    const list = Array.isArray(data) ? data : (data.comments ?? []);
    if (!list.length) return [];

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
  options: CopyOptions,
): Promise<CommentBlock[]> {
  const fromApi = await fetchCommentsFromApi(issueKey, options);
  if (fromApi !== null) return fromApi;
  return fetchCommentsFromDom(root);
}
