const ADMIN_API_BASE_URL = process.env.ADMIN_API_BASE_URL || "http://localhost:5002";

function buildTargetUrl(pathSegments: string[], search: string): string {
  const path = pathSegments.join("/");
  const normalizedBase = ADMIN_API_BASE_URL.replace(/\/+$/, "");

  return `${normalizedBase}/api/${path}${search}`;
}

export async function proxyAdminRequest(request: Request, pathSegments: string[]): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = buildTargetUrl(pathSegments, url.search);
  const headers = new Headers();

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const accept = request.headers.get("accept");
  if (accept) {
    headers.set("accept", accept);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers();
  const responseType = response.headers.get("content-type");

  if (responseType) {
    responseHeaders.set("content-type", responseType);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

