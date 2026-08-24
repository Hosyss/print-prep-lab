/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const CANONICAL_ORIGIN = "https://printpreplab.pages.dev";
const LEGACY_HOSTS = new Set(["print-prep-lab.hosys.chatgpt.site"]);
const GOOGLE_VERIFICATION_PATH = "/google6d67c58ff3b5201c.html";
const GOOGLE_VERIFICATION_BODY = "google-site-verification: google6d67c58ff3b5201c.html";

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "connect-src 'self' https:",
    "frame-src https:",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function withSecurityHeaders(response: Response, request: Request): Response {
  // Keep the HTTP-only local development runtime compatible with Vite HMR.
  const requestUrl = new URL(request.url);
  if (requestUrl.protocol !== "https:") return response;

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);

  const contentType = response.headers.get("content-type") ?? "";
  if (response.ok && contentType.includes("text/html")) {
    const canonicalUrl = new URL(requestUrl.pathname, CANONICAL_ORIGIN).toString();
    const canonicalLink = `<${canonicalUrl}>; rel="canonical"`;
    const existingLink = headers.get("Link");
    headers.set("Link", existingLink ? `${existingLink}, ${canonicalLink}` : canonicalLink);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function legacyRedirect(url: URL): Response | null {
  if (!LEGACY_HOSTS.has(url.hostname)) return null;

  const destination = new URL(url.pathname, CANONICAL_ORIGIN);
  destination.search = url.search;
  const canonicalDestination = new URL(url.pathname, CANONICAL_ORIGIN);

  return new Response(null, {
    status: 301,
    headers: {
      Location: destination.toString(),
      Link: `<${canonicalDestination.toString()}>; rel="canonical"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const redirectResponse = legacyRedirect(url);
    if (redirectResponse) return redirectResponse;

    if (url.pathname === GOOGLE_VERIFICATION_PATH) {
      return withSecurityHeaders(new Response(GOOGLE_VERIFICATION_BODY, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      }), request);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imageResponse = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(imageResponse, request);
    }

    return withSecurityHeaders(await handler.fetch(request, env, ctx), request);
  },
};

export default worker;
