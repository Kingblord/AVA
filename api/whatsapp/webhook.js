import { getAIResponse } from "../../lib/openrouter.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // health check
  if (req.method === "GET") {
    return res.status(200).send("AVA webhook live");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body =
      typeof req.body === "string"
        ? parseForm(req.body)
        : req.body || {};

    const userMessage = body.Body || "";
    const from = body.From || "unknown";

    console.log("Incoming:", userMessage, from);

    let aiReply = "Hello 👋 How can I help you today?";

    if (userMessage) {
      aiReply = await getAIResponse(userMessage);
    }

    res.setHeader("Content-Type", "text/xml");

    return res.status(200).send(`
<Response>
<Message>${escapeXML(aiReply)}</Message>
</Response>
    `);

  } catch (err) {
    console.error("CRASH:", err);

    res.setHeader("Content-Type", "text/xml");

    return res.status(200).send(`
<Response>
<Message>Server error occurred</Message>
</Response>
    `);
  }
}

/* ---------------- HELPERS ---------------- */

function parseForm(body) {
  const params = new URLSearchParams(body);
  const obj = {};
  for (const [k, v] of params.entries()) {
    obj[k] = v;
  }
  return obj;
}

function escapeXML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
