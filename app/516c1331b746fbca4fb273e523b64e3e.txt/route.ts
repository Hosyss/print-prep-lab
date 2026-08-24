const INDEXNOW_KEY = "516c1331b746fbca4fb273e523b64e3e";

export function GET() {
  return new Response(`${INDEXNOW_KEY}\n`, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
