/** Cloudflare Worker entry point for Print Prep Lab. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS?: Fetcher;
  DB?: D1Database;
  IMAGES?: {
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
const ADMIN_ORIGIN = "https://print-prep-lab-admin.buildtools.workers.dev";
const LEGACY_HOSTS = new Set(["print-prep-lab.hosys.chatgpt.site"]);
const GOOGLE_VERIFICATION_PATH = "/google6d67c58ff3b5201c.html";
const GOOGLE_VERIFICATION_BODY = "google-site-verification: google6d67c58ff3b5201c.html";

const OPERATIONAL_NOINDEX_PATHS = new Set([
  "/jobs", "/qa-history", "/operations", "/change-impact", "/risk-register",
  "/queue-planner", "/waste-ledger", "/approval-matrix", "/release-packet",
  "/revision-diff", "/calibration-registry", "/capa", "/audit-log", "/job-core",
  "/digital-twin", "/supplier-intelligence", "/release-center", "/automation-lab",
  "/production-analytics", "/schedule-optimizer", "/material-intelligence",
  "/customer-handoff", "/vendor-handoff", "/production-archive", "/compliance-center",
  "/knowledge-base", "/enterprise-dashboard", "/readiness-audit", "/command-center",
  "/search", "/vault", "/file-manifest", "/job-brief", "/workspace",
]);

/* These routes are the current professional/operational surface. In a source-only
   build the files are absent and the app router remains authoritative. In the v119
   hybrid artifact the files are present, so the current professional pages remain
   available while public tools/guides/sizes come from current source. */
const STATIC_PAGE_ROUTES: Record<string, string> = {
  "/": "/home-v112.html",
  "/tools/print-readiness-checker": "/print-readiness-v111.html",
  "/jobs": "/jobs.html",
  "/inspector": "/inspector.html",
  "/proof-sheet": "/proof-sheet.html",
  "/scenarios": "/scenarios.html",
  "/prepress-lab": "/prepress-lab.html",
  "/operations": "/operations.html",
  "/job-costing": "/job-costing.html",
  "/capacity-planner": "/capacity-planner.html",
  "/imposition-planner": "/imposition-planner.html",
  "/qa-history": "/qa-history.html",
  "/change-impact": "/change-impact.html",
  "/roll-media": "/roll-media.html",
  "/packaging": "/packaging.html",
  "/risk-register": "/risk-register.html",
  "/timeline": "/timeline.html",
  "/queue-planner": "/queue-planner.html",
  "/stock-coverage": "/stock-coverage.html",
  "/waste-ledger": "/waste-ledger.html",
  "/approval-matrix": "/approval-matrix.html",
  "/release-packet": "/release-packet.html",
  "/revision-diff": "/revision-diff.html",
  "/calibration-registry": "/calibration-registry.html",
  "/capa": "/capa.html",
  "/procurement": "/procurement.html",
  "/audit-log": "/audit-log.html",
  "/fold-planner": "/fold-planner.html",
  "/spine-planner": "/spine-planner.html",
  "/roll-diameter": "/roll-diameter.html",
  "/pallet-planner": "/pallet-planner.html",
  "/provider-matrix": "/provider-matrix.html",
  "/job-core": "/job-core.html",
  "/digital-twin": "/digital-twin.html",
  "/supplier-intelligence": "/supplier-intelligence.html",
  "/release-center": "/release-center.html",
  "/automation-lab": "/automation-lab.html",
  "/production-analytics": "/production-analytics.html",
  "/schedule-optimizer": "/schedule-optimizer.html",
  "/material-intelligence": "/material-intelligence.html",
  "/signature-planner": "/signature-planner.html",
  "/color-control": "/color-control.html",
  "/finishing-intelligence": "/finishing-intelligence.html",
  "/fulfillment-center": "/fulfillment-center.html",
  "/customer-handoff": "/customer-handoff.html",
  "/vendor-handoff": "/vendor-handoff.html",
  "/production-archive": "/production-archive.html",
  "/compliance-center": "/compliance-center.html",
  "/knowledge-base": "/knowledge-base.html",
  "/enterprise-dashboard": "/enterprise-dashboard.html",
  "/readiness-audit": "/readiness-audit.html",
  "/command-center": "/command-center.html",
  "/workspace": "/workspace.html",
  "/sheet-planner": "/sheet-planner.html",
  "/quote-compare": "/quote-compare.html",
  "/vault": "/vault.html",
  "/wall-layout": "/wall-layout.html",
  "/troubleshoot": "/troubleshoot.html",
  "/glossary": "/glossary.html",
  "/search": "/search.html",
  "/file-manifest": "/file-manifest.html",
  "/job-brief": "/job-brief.html",
  "/studio": "/studio.html",
  "/batch": "/batch.html",
  "/preflight": "/preflight.html",
  "/specs": "/specs.html",
};

const LEGACY_STATIC_ASSETS = new Set([
  "/ppl-ui-v111.css", "/ppl-ui-v1186.js", "/ppl-app-v111.css", "/ppl-app-v111.js",
  "/ppl-app-v112.css", "/ppl-app-v1186.js", "/ppl-ar-v1186.json",
  "/print-readiness-v109.js", "/ppl-workflow-v119.css", "/ppl-workflow-v1187.js",
]);

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
    "form-action 'self'", "img-src 'self' blob: data: https:", "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:", "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "connect-src 'self' https:", "frame-src https:", "worker-src 'self' blob:", "upgrade-insecure-requests",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Resource-Policy": "same-origin",
};

function normalizedPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
}

function withSecurityHeaders(response: Response, request: Request): Response {
  const requestUrl = new URL(request.url);
  if (requestUrl.protocol !== "https:") return response;
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  const contentType = response.headers.get("content-type") ?? "";
  if (response.ok && contentType.includes("text/html")) {
    const path = normalizedPath(requestUrl.pathname);
    const canonicalUrl = new URL(path === "/" ? "/" : path, CANONICAL_ORIGIN).toString();
    const canonicalLink = `<${canonicalUrl}>; rel="canonical"`;
    const existingLink = headers.get("Link");
    headers.set("Link", existingLink ? `${existingLink}, ${canonicalLink}` : canonicalLink);
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set("CDN-Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
    if (OPERATIONAL_NOINDEX_PATHS.has(path)) headers.set("X-Robots-Tag", "noindex, follow");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function legacyRedirect(url: URL): Response | null {
  if (!LEGACY_HOSTS.has(url.hostname)) return null;
  const destination = new URL(url.pathname, CANONICAL_ORIGIN);
  destination.search = url.search;
  const canonicalDestination = new URL(url.pathname, CANONICAL_ORIGIN);
  return new Response(null, {
    status: 301,
    headers: { Location: destination.toString(), Link: `<${canonicalDestination.toString()}>; rel="canonical"`, "Cache-Control": "public, max-age=3600" },
  });
}

async function staticPageResponse(request: Request, env: Env, target: string): Promise<Response | null> {
  if (!env.ASSETS || (request.method !== "GET" && request.method !== "HEAD")) return null;
  const assetRequest = new Request(new URL(target, request.url), { method: request.method, headers: request.headers });
  const response = await env.ASSETS.fetch(assetRequest);
  return response.ok ? withSecurityHeaders(response, request) : null;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const redirectResponse = legacyRedirect(url);
    if (redirectResponse) return redirectResponse;

    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      return new Response(null, {
        status: 302,
        headers: { Location: ADMIN_ORIGIN, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" },
      });
    }

    if (url.pathname === GOOGLE_VERIFICATION_PATH) {
      return withSecurityHeaders(new Response(GOOGLE_VERIFICATION_BODY, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      }), request);
    }

    if (url.pathname.endsWith(".html")) {
      return withSecurityHeaders(new Response("Not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      }), request);
    }

    if (env.ASSETS && LEGACY_STATIC_ASSETS.has(url.pathname)) {
      return withSecurityHeaders(await env.ASSETS.fetch(request), request);
    }

    const path = normalizedPath(url.pathname);
    const staticTarget = STATIC_PAGE_ROUTES[path];
    if (staticTarget) {
      const staticResponse = await staticPageResponse(request, env, staticTarget);
      if (staticResponse) return staticResponse;
    }

    if (url.pathname === "/_vinext/image" && env.ASSETS && env.IMAGES) {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imageResponse = await handleImageOptimization(request, {
        fetchAsset: (assetPath) => env.ASSETS!.fetch(new Request(new URL(assetPath, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES!.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(imageResponse, request);
    }

    return withSecurityHeaders(await handler.fetch(request, env, ctx), request);
  },
};

export default worker;
