// Tiny static server for the gears tiling tool.
// Usage: npm run gears  →  http://localhost:5178/gears.html
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)); // repo root
const port = 5178;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

http
  .createServer(async (req, res) => {
    // Serve the page itself from tools/, images from assets/source/gears/
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/") urlPath = "/gears.html";
    if (urlPath === "/gears.html") urlPath = "/tools/gears.html";
    if (urlPath.startsWith("/gears/")) urlPath = "/assets/source" + urlPath;

    const file = normalize(join(root, urlPath));
    if (!file.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) {
      // Minimal anchor listing so gears.html can discover the files
      const items = await (await import("node:fs/promises")).readdir(file);
      const body = (await items)
        .filter((n) => /\.(png|jpe?g|webp|gif)$/i.test(n))
        .map((n) => `<a href="${urlPath.replace(/\/?$/, "/")}${encodeURIComponent(n)}">${n}</a>`)
        .join("\n");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(body);
      return;
    }
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  })
  .listen(port, () => {
    console.log(`Gears tiling tool → http://localhost:${port}/gears.html`);
  });
