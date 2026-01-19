import * as path from "jsr:@std/path";
import { Redis } from "@upstash/redis";

const port = Number(Deno.env.get("PORT")) || 3200;

// Initialize Upstash Redis client
const redis = new Redis({
  url: Deno.env.get("REDIS_REST_URL")!,
  token: Deno.env.get("REDIS_REST_TOKEN")!,
});

// Helper function to get the last feed time
async function getLastFeedTime(): Promise<string> {
  // ZRANGE with rev option returns array with most recent entry
  const result = await redis.zrange("feed_times", 0, 0, { rev: true }) as string[];
  return result.length > 0 ? result[0] : "never";
}

// Helper function to add a new feed time
async function addFeedTime(timestamp: string): Promise<void> {
  const score = new Date(timestamp).getTime(); // Unix timestamp in milliseconds
  await redis.zadd("feed_times", { score, member: timestamp });
}

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

    if (url.pathname === "/offline") {
      const html = await Deno.readFile("./public/offline.html");

      return new Response(html, {
        headers: new Headers({
          "Content-Type": "text/html",
        }),
      });
    }

    // API
    if (url.pathname === "/feed") {

      if (req.method == "GET") {
        const time = await getLastFeedTime();

        const response = { time };

        return new Response(JSON.stringify(response), {
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          status: 200,
        });
      }

      if (req.method == "POST") {
        const now = new Date();

        // Get the ISO 8601 string in UTC
        const isoTimestamp = now.toISOString();

        await addFeedTime(isoTimestamp);
        const ok = true;

        const response = { ok, time: now };

        return new Response(JSON.stringify(response), {
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          status: 200,
        });
      }
    }

    // handle static files
    const filePath = path.join(Deno.cwd(), url.pathname);
    const file = await Deno.readFile(filePath);
    const extname = filePath.split(".").pop();

    // Define MIME types using an object
    const mimeTypes: Record<string, string> = {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "gif": "image/gif",
      "js": "text/javascript",
      "css": "text/css",
      "html": "text/html",
      "json": "application/json",
    };

    // Use the object to look up the MIME type, default to "application/octet-stream"
    const contentType = mimeTypes[extname!] || "application/octet-stream";

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
