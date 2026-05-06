// netlify/functions/claude.js
const https = require("https");

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API-sleutel niet geconfigureerd." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Ongeldig verzoek." }) };
  }

  // Gebruik de ingebouwde https module — werkt op alle Node.js versies
  return new Promise((resolve) => {
    const postData = JSON.stringify(body);

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers,
            body: JSON.stringify(parsed),
          });
        } catch (e) {
          resolve({
            statusCode: 502,
            headers,
            body: JSON.stringify({ error: "Ongeldig antwoord van API.", raw: data.slice(0, 200) }),
          });
        }
      });
    });

    req.on("error", (e) => {
      resolve({
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Verbindingsfout: " + e.message }),
      });
    });

    req.setTimeout(25000, () => {
      req.destroy();
      resolve({
        statusCode: 504,
        headers,
        body: JSON.stringify({ error: "Timeout: API reageerde niet op tijd." }),
      });
    });

    req.write(postData);
    req.end();
  });
};
