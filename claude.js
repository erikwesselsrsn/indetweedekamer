// netlify/functions/claude.js
// Proxy tussen het spel en de Anthropic API.
// De echte API-sleutel staat ALLEEN in de Netlify-omgevingsvariabele ANTHROPIC_API_KEY,
// nooit in de browser-code.

exports.handler = async function (event) {
  // Alleen POST-verzoeken toestaan
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // CORS-headers zodat de browser het verzoek mag sturen
  const headers = {
    "Access-Control-Allow-Origin": "*",          // Verander naar jouw Netlify-URL voor extra veiligheid
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Preflight OPTIONS-verzoek afhandelen
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // API-sleutel ophalen uit Netlify-omgevingsvariabele (NOOIT hardcoded)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API-sleutel niet geconfigureerd op de server." }),
    };
  }

  // Verzoek doorzetten naar Anthropic
  try {
    const body = JSON.parse(event.body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || "API-fout" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Serverfout: " + err.message }),
    };
  }
};
