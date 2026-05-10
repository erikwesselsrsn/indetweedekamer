// netlify/functions/auth.js
// Proxy voor Supabase auth-calls.
// Supabase URL en anon key staan alleen op de server, nooit in de browser.

const https = require("https");

const SUPABASE_HOST = "etrbfxfnjaliezlbkzrw.supabase.co";

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const supabasePath = event.queryStringParameters?.path || "/auth/v1/user";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";

  // Bouw forward headers
  const forwardHeaders = {
    "apikey": anonKey,
    "Content-Type": "application/json",
  };

  // Stuur Authorization header door als die aanwezig is
  const authHeader = event.headers["authorization"] || event.headers["Authorization"];
  if (authHeader) forwardHeaders["Authorization"] = authHeader;

  return new Promise((resolve) => {
    const postData = event.body || "";
    const options = {
      hostname: SUPABASE_HOST,
      path: supabasePath,
      method: event.httpMethod === "GET" ? "GET" : "POST",
      headers: {
        ...forwardHeaders,
        ...(postData ? { "Content-Length": Buffer.byteLength(postData) } : {}),
      },
    };

    const req = https.request(options, (res) => {
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
      resolve({ statusCode: 504, headers, body: JSON.stringify({ error: "Timeout" }) });
    });

    if (postData) req.write(postData);
    req.end();
  });
};
