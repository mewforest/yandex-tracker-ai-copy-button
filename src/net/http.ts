type ResponseType = "text" | "blob" | "arraybuffer" | "json";

function resolveUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function httpRequest<T = string>(
  url: string,
  options: {
    method?: "GET" | "POST";
    responseType?: ResponseType;
  } = {},
): Promise<{ status: number; data: T }> {
  const { method = "GET", responseType = "text" } = options;
  const gmResponseType =
    responseType === "blob" || responseType === "arraybuffer"
      ? responseType
      : undefined;

  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method,
      url: resolveUrl(url),
      responseType: gmResponseType,
      onload: (response) => {
        const status = response.status;
        if (status < 200 || status >= 300) {
          reject(new Error(`HTTP ${status} for ${url}`));
          return;
        }

        if (responseType === "json") {
          try {
            resolve({
              status,
              data: JSON.parse(response.responseText) as T,
            });
          } catch {
            reject(new Error(`Invalid JSON from ${url}`));
          }
          return;
        }

        if (responseType === "text") {
          resolve({
            status,
            data: response.responseText as T,
          });
          return;
        }

        resolve({
          status,
          data: response.response as T,
        });
      },
      onerror: () => reject(new Error(`Network error for ${url}`)),
    });
  });
}

export async function httpGetText(url: string): Promise<string> {
  const { data } = await httpRequest<string>(url, { responseType: "text" });
  return data;
}

export async function httpGetBlob(url: string): Promise<Blob> {
  const { data } = await httpRequest<Blob>(url, { responseType: "blob" });
  return data;
}

export async function httpGetJson<T>(url: string): Promise<T> {
  const { data } = await httpRequest<T>(url, { responseType: "json" });
  return data;
}
