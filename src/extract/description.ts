import type { CopyOptions } from "../config/types";
import { httpGetJson } from "../net/http";
import {
  htmlToMarkdown,
  htmlFragmentToMarkdown,
  embedRemoteImagesInMarkdown,
} from "../utils/html-to-md";

interface TrackerIssueApi {
  description?: string;
  markupType?: string;
}

export async function extractDescription(
  root: ParentNode,
  issueKey: string,
  options: CopyOptions,
): Promise<string> {
  try {
    const issue = await httpGetJson<TrackerIssueApi>(
      `/ajax/v2/issues/${issueKey}`,
    );
    if (issue.description?.trim()) {
      if (issue.markupType === "md") {
        return embedRemoteImagesInMarkdown(issue.description.trim(), options);
      }
      return embedRemoteImagesInMarkdown(
        await htmlFragmentToMarkdown(issue.description, options),
        options,
      );
    }
  } catch {
    /* DOM fallback */
  }

  const yfm = root.querySelector<HTMLElement>(
    ".entity-description-desktop .yfm, .page-issue__issue-description .yfm",
  );
  if (!yfm) return "—";

  let md = await htmlToMarkdown(yfm, options);
  md = await embedRemoteImagesInMarkdown(md, options);
  return md || "—";
}
