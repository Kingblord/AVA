import { getAIResponse } from "../../lib/openrouter.js";

export default async function handler(req, res) {
  // Health check
  if (req.method === "GET") {
    return res.status(200).send("AVA WhatsApp webhook live");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    // -------------------------
    // SAFE BODY PARSING
    // -------------------------
    const body =
      typeof req.body === "string"
        ? parseForm(req.body)
        : req.body || {};

    console.log("FULL BODY:", body);

    const userMessage = body.Body || body.body || "";
    const from = body.From || body.from || "unknown";

    console.log("Message:", userMessage);
    console.log("From:", from);

    // -------------------------
    // AI RESPONSE
    // -------------------------
    let aiReply = "Sorry, I didn't get that.";

    if (userMessage) {
      aiReply = await getAIResponse(userMessage);
    }

    console.log("AI Reply:", aiReply);

    // -------------------------
    // TWILIO XML RESPONSE
    // -------------------------
    res.setHeader("Content-Type", "text/xml");

    return res.status(200).send(`
      <Response>
        <Message>${escapeXML(aiReply)}</Message>
      </Response>
    `);

  } catch (error) {
    console.error("ERROR:", error);

    res.setHeader("Content-Type", "text/xml");

    return res.status(200).send(`
      <Response>
        <Message>AVA is currently unavailable. Try again.</Message>
      </Response>
    `);
  }
}

// -------------------------
// HELPERS
// -------------------------

function parseForm(body) {
  const params = new URLSearchParams(body);
  const obj = {};
  for (const [key, value] of params.entries()) {
    obj[key] = value;
  }
  return obj;
}

function escapeXML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}