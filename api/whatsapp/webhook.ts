import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAIResponse } from "../../lib/openrouter";
import { addLog } from "../_utils/store";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET") {
    return res.status(200).send("AVA webhook live");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body: any =
      typeof req.body === "string"
        ? parseForm(req.body)
        : req.body || {};

    const userMessage: string = body.Body || "";
    const from: string = body.From || "unknown";

    console.log("Incoming:", userMessage, from);

    let aiReply = "Hello 👋 How can I help you today?";

    if (userMessage) {
      aiReply = await getAIResponse(userMessage);
    }

    addLog({
      from,
      userMessage,
      aiReply,
      time: new Date().toISOString()
    });

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

// -------------------- HELPERS --------------------

function parseForm(body: string) {
  const params = new URLSearchParams(body);
  const obj: Record<string, string> = {};

  for (const [k, v] of params.entries()) {
    obj[k] = v;
  }

  return obj;
}

function escapeXML(str: string = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
