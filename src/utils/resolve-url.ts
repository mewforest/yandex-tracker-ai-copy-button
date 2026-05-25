export function resolveAbsoluteUrl(url: string): string {
  if (!url || url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `${location.protocol}${url}`;
  return `${location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}
