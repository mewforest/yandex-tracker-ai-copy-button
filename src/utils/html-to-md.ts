import TurndownService from "turndown";
// @ts-expect-error no types
import { gfm } from "turndown-plugin-gfm";
import type { CopyOptions } from "../config/types";
import {
  embedImageFromUrl,
  markdownImage,
  markdownImageLink,
} from "./image-embed";
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

async function embedImagesInElement(
  root: HTMLElement,
  options: CopyOptions,
): Promise<void> {
  const images = [...root.querySelectorAll("img[src]")] as HTMLImageElement[];
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const alt = img.getAttribute("alt") || "image";
      const absolute = resolveAbsoluteUrl(src);

      if (!options.formatted) {
        img.setAttribute("src", absolute);
        return;
      }

      const embed = await embedImageFromUrl(src, alt);
      if (embed.kind === "data") {
        img.setAttribute("src", embed.dataUrl);
      } else {
        img.setAttribute("src", absolute);
      }
    }),
  );
}

export async function htmlToMarkdown(
  element: HTMLElement,
  options: CopyOptions,
): Promise<string> {
  const clone = prepareClone(element);
  await embedImagesInElement(clone, options);
  let md = turndown.turndown(clone.innerHTML);
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

export async function htmlFragmentToMarkdown(
  html: string,
  options: CopyOptions,
): Promise<string> {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const yfm = wrapper.querySelector(".yfm") ?? wrapper;
  return htmlToMarkdown(yfm as HTMLElement, options);
}

function isEmbeddableImageUrl(url: string): boolean {
  if (!url || url.startsWith("data:")) return false;
  return (
    /^https?:\/\//i.test(url) || url.startsWith("/") || url.startsWith("//")
  );
}

/** Post-process markdown img tags that still have remote or relative URLs */
export async function embedRemoteImagesInMarkdown(
  md: string,
  options: CopyOptions,
): Promise<string> {
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...md.matchAll(imgRe)];
  if (!matches.length) return md;

  let result = md;
  for (const match of matches) {
    const [full, alt, url] = match;
    if (!isEmbeddableImageUrl(url)) continue;

    const replacement = options.formatted
      ? markdownImage(
          alt || "image",
          await embedImageFromUrl(url, alt || "image"),
        )
      : markdownImageLink(alt || "image", url);

    result = result.replace(full, replacement);
  }
  return result;
}
