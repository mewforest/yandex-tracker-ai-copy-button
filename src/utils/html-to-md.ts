import TurndownService from "turndown";
// @ts-expect-error no types
import { gfm } from "turndown-plugin-gfm";
import { markdownImageLink } from "./image-markdown";
import { resolveAbsoluteUrl } from "./resolve-url";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});

turndown.use(gfm);

turndown.addRule("removeHiddenMagicLinks", {
  filter: (node) =>
    node.nodeName === "A" &&
    (node as Element).classList.contains("MagicLink-Hidden"),
  replacement: () => "",
});

turndown.addRule("stripEditorChrome", {
  filter: (node) => {
    const el = node as Element;
    return (
      el.classList?.contains("editable-formatter__header") ||
      el.classList?.contains("editable-formatter__header-actions") ||
      el.tagName === "BUTTON"
    );
  },
  replacement: () => "",
});

function prepareClone(root: HTMLElement): HTMLElement {
  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      ".MagicLink-Hidden, .editable-formatter__header, .editable-formatter__header-actions, button",
    )
    .forEach((el) => el.remove());
  return clone;
}

function normalizeImagesInElement(root: HTMLElement): void {
  for (const img of root.querySelectorAll("img[src]")) {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("data:")) continue;
    img.setAttribute("src", resolveAbsoluteUrl(src));
  }
}

export async function htmlToMarkdown(element: HTMLElement): Promise<string> {
  const clone = prepareClone(element);
  normalizeImagesInElement(clone);
  let md = turndown.turndown(clone.innerHTML);
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

export async function htmlFragmentToMarkdown(html: string): Promise<string> {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const yfm = wrapper.querySelector(".yfm") ?? wrapper;
  return htmlToMarkdown(yfm as HTMLElement);
}

function isImageMarkdownUrl(url: string): boolean {
  if (!url || url.startsWith("data:")) return false;
  return (
    /^https?:\/\//i.test(url) || url.startsWith("/") || url.startsWith("//")
  );
}

/** Ensure markdown images use absolute URLs */
export async function normalizeImagesInMarkdown(md: string): Promise<string> {
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...md.matchAll(imgRe)];
  if (!matches.length) return md;

  let result = md;
  for (const match of matches) {
    const [full, alt, url] = match;
    if (!isImageMarkdownUrl(url)) continue;
    result = result.replace(full, markdownImageLink(alt || "image", url));
  }
  return result;
}
