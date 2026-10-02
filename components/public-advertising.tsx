import { ADSENSE_CLIENT_ID } from "@/lib/seo";

// Keep site verification on public content pages. Root layouts also wrap error
// screens, so placing the script there could enable Auto ads on a 404 later.
export function PublicAdvertising() {
  return <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`} crossOrigin="anonymous" />;
}
