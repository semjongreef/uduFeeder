import * as path from "jsr:@std/path";

const port = Number(Deno.env.get("PORT")) || 3200;

const kv = await Deno.openKv();
const FEED_KEY = "lastFed";

Deno.serve({ port }, async (req: Request) => {
  const url = new URL(req.url);

  try {
    // handle index route
    if (url.pathname === "/") {
      const html = await Deno.readFile("./public/index.html");

      return new Response(html, {
        headers: new Headers({
          "Content-Type": "text/html",
        }),
      });
    }

    // API
    if (url.pathname === "/feed") {

      if (req.method == "GET") {
        const lastFed = (await kv.get([FEED_KEY]))?.value;
        const time = lastFed ? lastFed : "never";

        const response = { time };

        return new Response(JSON.stringify(response), {
          headers: new Headers({
            "Content-Type": "text/html",
          }),
          status: 200,
        });
      }

      if (req.method == "POST") {
        const now = new Date();

        // Get the ISO 8601 string in UTC
        const isoTimestamp = now.toISOString();

        const storageResult = await kv.set([FEED_KEY], isoTimestamp);
        const ok = storageResult.ok;

        const response = { ok, time: now };

        return new Response(JSON.stringify(response), {
          headers: new Headers({
            "Content-Type": "text/html",
          }),
          status: 200,
        });
      }
    }

    // handle static files
    const filePath = path.join(Deno.cwd(), url.pathname);
    const file = await Deno.readFile(filePath);
    const extname = filePath.split(".").pop();

    const contentType = extname === "jpg" || extname === "jpeg"
      ? "image/jpeg"
      : extname === "png"
      ? "image/png"
      : extname === "gif"
      ? "image/gif"
      : "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("404 Not Found", { status: 404 });
  }
});
