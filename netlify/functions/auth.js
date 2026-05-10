// netlify/functions/auth.js
// Proxy voor Supabase auth. Keys staan ALLEEN hier via environment variables.

const https = require("https");

const SUPABASE_HOST = "etrbfxfnjaliezlbkzrw.supabase.co";

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Auth niet geconfigureerd op de server." }) };
  }

  const supabasePath = (event.queryStringParameters && event.queryStringParameters.path)
    ? event.queryStringParameters.path
    : "/auth/v1/user";

  const forwardHeaders = {
    "apikey": anonKey,
    "Content-Type": "application/json",
  };

  const authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
  if (authHeader) forwardHeaders["Authorization"] = authHeader;

  const postData = event.body || "";
  if (postData) forwardHeaders["Content-Length"] = Buffer.byteLength(postData).toString();

  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      path: supabasePath,
      method: event.httpMethod,
      headers: forwardHeaders,
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: { ...headers, "Content-Type": res.headers["content-type"] || "application/json" },
          body: data,
        });
      });
    });

    req.on("error", (e) => {
      resolve({ statusCode: 502, headers, body: JSON.stringify({ error: e.message }) });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ statusCode: 504, headers, body: JSON.stringify({ error: "Timeout bij authenticatie." }) });
    });

    if (postData && event.httpMethod !== "GET") req.write(postData);
    req.end();
  });
};
