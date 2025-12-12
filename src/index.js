const express = require('express');
const app = express();
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");



const PORT = 7070;
const hostname = "https://www.kogama.com";

function CookieToString(cookies) {
    return Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
}
function PatchHTMLString(html) {
    const script = fs.readFileSync(path.join(__dirname, "Web", "tools.js"), "utf8");
    html = html.replace(`<link href="//static.kogstatic.com/0000/`, `<link href="/`);

    html = html.replace(`return function (source, callback) {
                const script = document.createElement("script");
                script.type = "text/javascript";
                script.onerror = loadError;

                if (callback) {
                    script.onload = callback
                }

                oHead.appendChild(script);
                script.src = source;
            }`, `return function (source, callback) {
                 ${script}

                const script = document.createElement("script");
                script.type = "text/javascript";
                script.onerror = loadError;

                if (callback) {
                    script.onload = callback
                }

                oHead.appendChild(script);
                script.src = "/modulr-app.js";
            }`);
    return html;
}

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    const target = hostname + "/";
    let response = await fetch(target, {
        headers: {
            cookie: CookieToString(req.cookies),
        }
    });
    let html = await response.text();
    html = PatchHTMLString(html);
    res.send(html);
});

app.delete('/*splat', async (req, res) => {
    const targetUrl = hostname + req.originalUrl;

    const response = await fetch(targetUrl, {
        method: "DELETE",
        headers: req.headers,
        body: JSON.stringify(req.body)
    });


    const cookies = [];
    response.headers.forEach((v, k) => {
        if (k.toLowerCase() === "set-cookie") cookies.push(v);
    });

    console.log("Cookies:", cookies);

    if (cookies.length > 0)
        res.setHeader("Set-Cookie", cookies);


    res.status(response.status).send(await response.text());
});

app.post('/*splat', async (req, res) => {
    console.log("POST", req.originalUrl);
    const targetUrl = hostname + req.originalUrl;
    const response = await fetch(targetUrl, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify(req.body)
    });

    const cookies = [];
    response.headers.forEach((v, k) => {
        if (k.toLowerCase() === "set-cookie") cookies.push(v);
    });


    if (cookies.length > 0)
        res.setHeader("Set-Cookie", cookies);

    res.status(response.status).send(await response.text());
});


app.get("/modulr-app.js", (req, res) => {
    res.sendFile(path.join(__dirname, "Web", "modulr-app.js"));
});
app.get("/Game/WebGLBuild.framework.js.gz", (req, res) => {
    res.sendFile(path.join(__dirname, "Game", "WebGLBuild.framework.js.gz"));
});
app.get("/Game/WebGLBuild.data.gz", (req, res) => {
    res.sendFile(path.join(__dirname, "Game", "WebGLBuild.data.gz"));
});
app.get("/Game/WebGLBuild.wasm.gz", (req, res) => {
    res.sendFile(path.join(__dirname, "Game", "WebGLBuild.wasm.gz"));
});
app.get("/Coloris/min.css", (req, res) => {
    res.sendFile(path.join(__dirname, "Coloris", "min.css"));
});
app.get("/Coloris/min.js", (req, res) => {
    res.sendFile(path.join(__dirname, "Coloris", "min.js"));
});


app.get('/*splat', async (req, res) => {

    let parts = req.originalUrl.split("/");
    if (parts[1] == "modulr-wallpaper") {
        try {
            res.sendFile(path.join(__dirname, "WallPapers", parts[2]));
        } catch {
            res.status(404).send("Wallpaper Not Found.");
        }
        return
    }


    const DisableCookies = !!parseInt(req.headers["disable-cookies"]);
    const target = hostname + req.originalUrl;
    const response = await fetch(target, !DisableCookies ? {
        headers: {
            cookie: CookieToString(req.cookies),
        }
    } : null);




    if (req.originalUrl.slice(-8) === "/app.css") {
        res.sendFile(path.join(__dirname, "Web", "modulr-app.css"));
        return;
    }
    // forward headers EXCEPT problematic ones
    response.headers.forEach((v, k) => {
        const key = k.toLowerCase();
        if (key === "content-encoding") return;  // ❗ REMOVE
        if (key === "content-length") return;    // ❗ REMOVE
        res.setHeader(k, v);
    });

    const contentType = response.headers.get("content-type");
    console.log("GET", req.originalUrl);

    if (contentType && contentType.includes("text/html")) {
        let html = await response.text();
        html = PatchHTMLString(html);

        return res.status(response.status).send(html);
    }


    // RAW binary for everything else
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.status(response.status).send(buffer);
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
