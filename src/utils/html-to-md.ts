import TurndownService from "turndown";
// @ts-expect-error no types
import { gfm } from "turndown-plugin-gfm";
import { embedImageFromUrl, markdownImage } from "./image-embed";

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

async function embedImagesInElement(root: HTMLElement): Promise<void> {
  const images = [...root.querySelectorAll("img[src]")] as HTMLImageElement[];
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      const alt = img.getAttribute("alt") || "image";
      const embed = await embedImageFromUrl(src, alt);
      if (embed.kind === "data") {
        img.setAttribute("src", embed.dataUrl);
      }
    }),
  );
}

export async function htmlToMarkdown(element: HTMLElement): Promise<string> {
  const clone = prepareClone(element);
  await embedImagesInElement(clone);
  let md = turndown.turndown(clone.innerHTML);
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

export async function htmlFragmentToMarkdown(html: string): Promise<string> {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return htmlToMarkdown(wrapper);
}

/** Post-process markdown img tags that still have remote URLs */
export async function embedRemoteImagesInMarkdown(md: string): Promise<string> {
  const imgRe = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const matches = [...md.matchAll(imgRe)];
  if (!matches.length) return md;

  let result = md;
  for (const match of matches) {
    const [full, alt, url] = match;
    const embed = await embedImageFromUrl(url, alt || "image");
    const replacement = markdownImage(alt || "image", embed);
    result = result.replace(full, replacement);
  }
  return result;
}
