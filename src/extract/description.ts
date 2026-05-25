import { httpGetJson } from "../net/http";
import {
  htmlToMarkdown,
  htmlFragmentToMarkdown,
  normalizeImagesInMarkdown,
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
        return normalizeImagesInMarkdown(issue.description.trim());
      }
      return normalizeImagesInMarkdown(
        await htmlFragmentToMarkdown(issue.description),
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
  md = await normalizeImagesInMarkdown(md);
  return md || "—";
}
