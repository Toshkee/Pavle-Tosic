import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Without an incrementalCache, the prerendered pages Next writes to
// .open-next/cache never reach the Worker, so every request re-renders and
// /work/[slug] (dynamicParams = false) 404s because its params are only known
// from the prerender output. This override ships that output as static assets
// under cdn-cgi/_next_cache and reads it through the ASSETS binding.
// It is read-only, which is exactly right here: nothing on this site
// revalidates, every page is prerendered at build time.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
