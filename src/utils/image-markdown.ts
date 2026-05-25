import { resolveAbsoluteUrl } from "./resolve-url";

export function markdownImageLink(alt: string, url: string): string {
  return `![${alt}](${resolveAbsoluteUrl(url)})`;
}
