import * as path from "jsr:@std/path";
import { DB } from "https://deno.land/x/sqlite/mod.ts";

const port = Number(Deno.env.get("PORT")) || 3200;

const dbPath = "./data/udu.db";
const db = new DB(dbPath);

// Create schema if it doesn't exist
db.execute(`
  CREATE TABLE IF NOT EXISTS feed_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

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
        const result = db.query<[string]>(
          "SELECT timestamp FROM feed_times ORDER BY created_at DESC LIMIT 1"
        );
        const rows = Array.from(result);
        const time = rows.length > 0 ? rows[0][0] : "never";

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

        db.query("INSERT INTO feed_times (timestamp) VALUES (?)", [isoTimestamp]);
        const ok = true;

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
