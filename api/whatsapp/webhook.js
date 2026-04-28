import { getAIResponse } from "../../lib/openrouter.js";
import { addLog } from "../_utils/store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

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

    // 🚨 SAFE AI CALL (INLINE — NO IMPORT ISSUES)
    let aiReply = "Hello 👋 How can I help you today?";

    if (userMessage) {
      aiReply = await getAI(userMessage);
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

// 🔥 INLINE AI FUNCTION (NO IMPORT RISK)
async function getAI(message) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content: "You are a helpful sales assistant. Keep replies short."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await res.json();

    return data?.choices?.[0]?.message?.content || "No response";

  } catch (e) {
    console.error("AI ERROR:", e);
    return "AI unavailable";
  }
}

// HELPERS
function parseForm(body) {
  const params = new URLSearchParams(body);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function escapeXML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
