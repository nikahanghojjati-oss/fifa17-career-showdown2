const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const host = process.env.CMS_TEST_HOST || "127.0.0.1";
const port = Number(process.env.CMS_TEST_PORT || 4173);

const mimeTypes = new Map([
    [".css", "text/css; charset=utf-8"],
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".md", "text/markdown; charset=utf-8"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".webp", "image/webp"]
]);

function resolveRequestPath(requestUrl){
    const pathname = decodeURIComponent(new URL(requestUrl || "/", `http://${host}:${port}`).pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const candidate = path.resolve(root, relative);
    if(candidate !== root && !candidate.startsWith(`${root}${path.sep}`)){
        return null;
    }
    return candidate;
}

const server = http.createServer((request, response) => {
    const candidate = resolveRequestPath(request.url);
    if(!candidate){
        response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
    }

    fs.stat(candidate, (statError, stats) => {
        const filePath = !statError && stats.isDirectory() ? path.join(candidate, "index.html") : candidate;
        fs.readFile(filePath, (readError, data) => {
            if(readError){
                response.writeHead(readError.code === "ENOENT" ? 404 : 500, {
                    "content-type": "text/plain; charset=utf-8",
                    "cache-control": "no-store"
                });
                response.end(readError.code === "ENOENT" ? "Not found" : "Server error");
                return;
            }

            response.writeHead(200, {
                "content-type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
                "cache-control": "no-store",
                "x-content-type-options": "nosniff"
            });
            if(request.method === "HEAD"){
                response.end();
                return;
            }
            response.end(data);
        });
    });
});

server.listen(port, host, () => {
    process.stdout.write(`Career Mode Showdown test server listening at http://${host}:${port}/\n`);
});

function stop(){
    server.close(error => {
        process.exitCode = error ? 1 : 0;
    });
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
