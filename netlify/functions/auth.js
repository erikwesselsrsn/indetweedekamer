// netlify/functions/auth.js
// Proxy voor Supabase auth. Keys staan ALLEEN hier via environment variables.
//
// Alleen de Supabase auth-routes die de frontend daadwerkelijk gebruikt
// worden doorgelaten (zie ALLOWED_ROUTES). Dit voorkomt dat deze proxy als
// generiek doorgeefluik naar de volledige Supabase auth-API kan worden
// misbruikt — vóór deze wijziging werd elk pad en elke method 1-op-1
// doorgestuurd op basis van een query-parameter.
//
// Frontend-aanroepen (index.html, supabaseFetch()):
//   POST /auth/v1/token?grant_type=password   — doLogin()
//   GET  /auth/v1/user                        — checkBestaandeLogin()
//   PUT  /auth/v1/user                        — doSetPassword()
//   POST /auth/v1/logout                      — doLogout()

const https = require("https");

const SUPABASE_HOST = "etrbfxfnjaliezlbkzrw.supabase.co";

const ALLOWED_ROUTES = [
  { method: "POST", pathname: "/auth/v1/token", query: { grant_type: ["password"] } },
  { method: "GET", pathname: "/auth/v1/user" },
  { method: "PUT", pathname: "/auth/v1/user" },
  { method: "POST", pathname: "/auth/v1/logout" },
];

// Zuivere, los testbare functie: geen netwerk, geen side effects.
function isAllowedRoute(method, rawPath) {
  if (!method || !rawPath || typeof rawPath !== "string") return false;
  let url;
  try {
    // Basis-URL is alleen nodig om relatieve paden te kunnen parsen; de
    // WHATWG URL-parser normaliseert ook eventuele ../-segmenten in het pad.
    url = new URL(rawPath, "https://auth-proxy.invalid");
  } catch (e) {
    return false;
  }
  return ALLOWED_ROUTES.some((route) => {
    if (route.method !== method) return false;
    if (route.pathname !== url.pathname) return false;
    if (route.query) {
      return Object.entries(route.query).every(([key, allowedValues]) => {
        const actual = url.searchParams.get(key);
        return actual !== null && allowedValues.includes(actual);
      });
    }
    return true;
  });
}

exports.isAllowedRoute = isAllowedRoute;

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

  if (!isAllowedRoute(event.httpMethod, supabasePath)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Dit auth-pad is niet toegestaan." }) };
  }

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
