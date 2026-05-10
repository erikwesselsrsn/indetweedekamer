// netlify/functions/claude.js
// Proxy naar Anthropic API met Supabase-tokenverificatie.

const https = require("https");

async function verifySupabaseToken(token) {
  return new Promise((resolve) => {
    const options = {
      hostname: "etrbfxfnjaliezlbkzrw.supabase.co",
      path: "/auth/v1/user",
      method: "GET",
      headers: {
        "apikey": process.env.SUPABASE_ANON_KEY || "",
        "Authorization": "Bearer " + token,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(res.statusCode === 200));
    });
    req.on("error", () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  // Supabase tokenverificatie
  const authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Niet ingelogd. Log in om het spel te spelen." }) };
  }

  const isValid = await verifySupabaseToken(token);
  if (!isValid) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Sessie verlopen. Log opnieuw in." }) };
  }

  // Anthropic API call
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "API-sleutel niet geconfigureerd." }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: "Ongeldig verzoek." }) }; }

  return new Promise((resolve) => {
    const postData = JSON.stringify(body);
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve({ statusCode: res.statusCode, headers, body: data }); }
        catch (e) { resolve({ statusCode: 502, headers, body: JSON.stringify({ error: "API-fout." }) }); }
      });
    });
    req.on("error", (e) => resolve({ statusCode: 502, headers, body: JSON.stringify({ error: e.message }) }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ statusCode: 504, headers, body: JSON.stringify({ error: "Timeout." }) }); });
    req.write(postData);
    req.end();
  });
};
