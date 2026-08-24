const SITE_URL = "https://printpreplab.pages.dev";
const INDEXNOW_KEY = "516c1331b746fbca4fb273e523b64e3e";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

function getSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function main() {
  const sitemapResponse = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { "user-agent": "Print-Prep-Lab-IndexNow/1.0" },
  });

  if (!sitemapResponse.ok) {
    throw new Error(`Could not read the live sitemap (${sitemapResponse.status}).`);
  }

  const urls = getSitemapUrls(await sitemapResponse.text());
  const siteHost = new URL(SITE_URL).host;

  if (urls.length === 0) throw new Error("The live sitemap did not contain any URLs.");
  if (urls.some((url) => new URL(url).host !== siteHost)) {
    throw new Error("The sitemap contains a URL outside the verified host.");
  }

  const payload = {
    host: siteHost,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  if (process.argv.includes("--dry-run")) {
    console.log(`IndexNow payload ready for ${urls.length} URLs.`);
    console.log(`Key location: ${KEY_LOCATION}`);
    return;
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  if (![200, 202].includes(response.status)) {
    const responseText = (await response.text()).trim();
    throw new Error(
      `IndexNow rejected the submission (${response.status})${responseText ? `: ${responseText}` : "."}`,
    );
  }

  console.log(`IndexNow accepted ${urls.length} URLs (${response.status}).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
