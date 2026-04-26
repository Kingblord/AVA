import { getAIResponse } from "../../lib/openrouter.js";

export default async function handler(req, res) {
  // Allow quick test in browser
  if (req.method === "GET") {
    return res.status(200).send("AVA WhatsApp webhook live");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};

    console.log("FULL BODY:", body);

    const userMessage = body.Body || "";
    const from = body.From || "";

    console.log("Message:", userMessage);
    console.log("From:", from);

    // -------------------------
    // AI RESPONSE
    // -------------------------
    const aiReply = await getAIResponse(userMessage);

    console.log("AI Reply:", aiReply);

    // -------------------------
    // TWILIO XML RESPONSE
    // -------------------------
    res.setHeader("Content-Type", "text/xml");

    return res.status(200).send(`
      <Response>
        <Message>${aiReply}</Message>
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