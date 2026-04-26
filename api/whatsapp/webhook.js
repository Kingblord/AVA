export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("AVA webhook alive");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};

    console.log("FULL BODY:", body);

    const msg = body.Body || body.body || "";
    const from = body.From || body.from || "";

    console.log("Message:", msg);
    console.log("From:", from);

    const reply = `AVA received: ${msg}`;

    res.setHeader("Content-Type", "text/xml");

    return res.status(200).send(`
      <Response>
        <Message>${reply}</Message>
      </Response>
    `);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error");
  }
}