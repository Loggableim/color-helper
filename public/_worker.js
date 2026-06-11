// www → non-www redirect for Cloudflare Pages
// Runs at the edge before serving static assets
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Redirect www → non-www (301 permanent)
    if (url.hostname === 'www.color-helper.com') {
      url.hostname = 'color-helper.com';
      return Response.redirect(url.toString(), 301);
    }

    // Serve static assets from Pages
    return env.ASSETS.fetch(request);
  },
};
