import { httpGetJson } from "../net/http";
import {
  htmlToMarkdown,
  embedRemoteImagesInMarkdown,
} from "../utils/html-to-md";

interface TrackerIssueApi {
  description?: string;
  markupType?: string;
}

export async function extractDescription(
  root: ParentNode,
  issueKey: string,
): Promise<string> {
  try {
    const issue = await httpGetJson<TrackerIssueApi>(
      `/ajax/v2/issues/${issueKey}`,
    );
    if (issue.description?.trim()) {
      if (issue.markupType === "md") {
        return embedRemoteImagesInMarkdown(issue.description.trim());
      }
      return embedRemoteImagesInMarkdown(
        await htmlFragmentToMarkdownSafe(issue.description),
      );
    }
  } catch {
    /* DOM fallback */
  }

  const yfm = root.querySelector<HTMLElement>(
    ".entity-description-desktop .yfm, .page-issue__issue-description .yfm",
  );
  if (!yfm) return "—";

  let md = await htmlToMarkdown(yfm);
  md = await embedRemoteImagesInMarkdown(md);
  return md || "—";
}

async function htmlFragmentToMarkdownSafe(html: string): Promise<string> {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const yfm = wrapper.querySelector(".yfm") ?? wrapper;
  return htmlToMarkdown(yfm as HTMLElement);
}
