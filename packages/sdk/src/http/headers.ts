/**
 * Builds HTTP headers for Zorveus API requests.
 */
export function buildHeaders(options: {
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
  customHeaders?: Record<string, string>;
  contentType?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  // Only set User-Agent in server/Node.js environments where allowed
  if (typeof window === "undefined") {
    headers["User-Agent"] = "@zorveus/sdk/0.1.0";
  }

  if (options.contentType) {
    headers["Content-Type"] = options.contentType;
  }

  if (options.apiKey) {
    headers["Authorization"] = `Bearer ${options.apiKey}`;
  }

  // Merge default client headers
  if (options.defaultHeaders) {
    Object.assign(headers, options.defaultHeaders);
  }

  // Merge per-request headers
  if (options.customHeaders) {
    Object.assign(headers, options.customHeaders);
  }

  return headers;
}
