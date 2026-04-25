import express from "express";

const app = express();

// VERY IMPORTANT
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/api/whatsapp/webhook", (req, res) => {
  console.log("FULL BODY:", req.body);

  const msg = req.body.Body;
  const from = req.body.From;

  console.log("Message:", msg);
  console.log("From:", from);

  const reply = `AVA received: ${msg}`;

  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Message>${reply}</Message>
    </Response>
  `);
});

app.get("/", (req, res) => {
  res.send("Server is alive");
});

app.listen(3000, () => console.log("Running on port 3000"));