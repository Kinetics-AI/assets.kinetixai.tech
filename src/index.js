export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const objectKey = url.pathname.slice(1); // 去掉 "/"

    if (!objectKey) {
      return new Response("R2 Assets Worker", { status: 400 });
    }

    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const object = await env.MY_BUCKET.get(objectKey);
      if (object === null) {
        return new Response("Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);

      headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");

      const response = new Response(object.body, { headers });
      ctx.waitUntil(cache.put(request, response.clone()));

      return response;
    } catch (err) {
      return new Response("Error: " + err.message, { status: 500 });
    }
  },
};