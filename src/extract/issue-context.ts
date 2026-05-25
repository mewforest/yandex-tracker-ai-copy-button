const ISSUE_KEY_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/;

const ISSUE_WRAPPER_SEL = ".page-issue__wrapper, .page-issue__wrapper_compact";

export interface IssueContext {
  key: string;
  title: string;
  url: string;
  root: ParentNode;
}

function findIssueRoot(anchor?: Element | null): ParentNode {
  if (!anchor) return document;
  return (
    anchor.closest(ISSUE_WRAPPER_SEL) ??
    anchor.closest(".side-card-drawer") ??
    document
  );
}

function extractKey(root: ParentNode): string | null {
  const link = root.querySelector<HTMLAnchorElement>(
    ".page-issue__issue-key.link, a.page-issue__issue-key",
  );
  const fromDom = link?.textContent?.trim();
  if (fromDom && ISSUE_KEY_RE.test(fromDom)) {
    return fromDom.match(ISSUE_KEY_RE)![1];
  }

  const breadcrumbTitle = root
    .querySelector<HTMLElement>(
      ".page-issue__issue-key [title], .g-breadcrumbs__item_current [title]",
    )
    ?.getAttribute("title")
    ?.trim();
  if (breadcrumbTitle && ISSUE_KEY_RE.test(breadcrumbTitle)) {
    return breadcrumbTitle.match(ISSUE_KEY_RE)![1];
  }

  const pathMatch = location.pathname.match(/\/([A-Z][A-Z0-9]+-\d+)\/?$/i);
  if (pathMatch) return pathMatch[1].toUpperCase();

  const titleMatch = document.title.match(ISSUE_KEY_RE);
  if (titleMatch) return titleMatch[1];

  return null;
}

function extractTitle(root: ParentNode, key: string): string {
  const input = root.querySelector<HTMLElement>(
    '.issue-summary [role="textbox"], .issue-summary input, .issue-summary textarea',
  );
  const fromInput =
    input?.textContent?.trim() || (input as HTMLInputElement)?.value?.trim();
  if (fromInput) return fromInput;

  const heading = root.querySelector<HTMLElement>(
    ".issue-summary h1, .page-issue__content h1",
  );
  if (heading?.textContent?.trim()) return heading.textContent.trim();

  const titlePart = document.title.split("@")[0]?.trim() ?? "";
  const prefix = `${key}:`;
  if (titlePart.toUpperCase().startsWith(prefix)) {
    return titlePart.slice(prefix.length).trim();
  }
  return titlePart;
}

export function getIssueContext(anchor?: Element | null): IssueContext | null {
  const root = findIssueRoot(anchor);
  const key = extractKey(root);
  if (!key) return null;

  const title = extractTitle(root, key);
  const url = `${location.origin}/${key}`;

  return { key, title, url, root };
}
