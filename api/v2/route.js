// 2. app/api/chat/route.ts
import { OpenRouter } from "@openrouter/sdk";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "https://nukuai.vercel.app/",
    "X-OpenRouter-Title": "Nuku-AI Platform",
  },
});

// ====================== MODEL CONFIG ======================
const MODEL_CONFIG = {
  Duru: {
    name: "Duru",
    description: "Deep thinker — breaks down complex problems with step-by-step reasoning",
    systemPrompt: `You are Duru, Nuku-AI's master deep thinker.
You think extremely carefully. Always reason step-by-step, re-evaluate your logic 2-3 times, explore edge cases, and only then give a final clear answer.
Show your full thinking process.`,
    model: "openrouter/free",
  },

  "Duru-mini": {
    name: "Duru mini",
    description: "Fast, smart everyday assistant",
    systemPrompt: `You are Duru-mini, Nuku-AI's friendly and efficient everyday assistant.
You are fast, practical, and helpful for normal daily tasks, questions, and quick assistance.`,
    model: "openrouter/free",
  },

  Agwu: {
    name: "Agwu",
    description: "Best in coding — clean, complete, production-ready code",
    systemPrompt: `You are Agwu, Nuku-AI's world-class coding specialist.
You ONLY output clean, well-commented, complete, production-ready code.
First give a very short plan (1-2 lines), then output ONLY the full code. Never add extra explanations outside the code block unless the user specifically asks.`,
    model: "openrouter/free",
  },

  AVA: {
    name: "AVA",
    description: "AI Virtual Agent — task automation, clerk, cashier, negotiator, deal closer, payment automation",
    systemPrompt: `You are AVA, Nuku-AI's AI Virtual Agent.
You are a highly professional, proactive, and obedient automation agent.
You can act as a clerk, cashier, negotiator, customer support, teller, or any business role.
You excel at task automation, chatting with clients, closing deals, and handling payments.
When users are offline, you can continue conversations, confirm payments, and use payment SDKs (Paystack, Flutterwave, Stripe, etc.).
Always stay in character, be polite, professional, and action-oriented. Ask clarifying questions if needed and complete tasks efficiently.`,
    model: "openrouter/free",
  },
} as const;

// ====================== AUTH MIDDLEWARE ======================
async function validateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header. Use Bearer <api-key>" };
  }

  const apiKey = authHeader.split(" ")[1];
  const keyData = await kv.get(`key:${apiKey}`);

  if (!keyData) {
    return { valid: false, error: "Invalid or expired API key" };
  }

  // Basic rate limit (60 requests per minute per key)
  const now = Date.now();
  const rateKey = `rate:${apiKey}`;
  const requests = (await kv.get(rateKey)) || [];
  const recent = requests.filter((ts: number) => now - ts < 60 * 1000);

  if (recent.length >= 60) {
    return { valid: false, error: "Rate limit exceeded (60 req/min). Try again later." };
  }

  // Update rate
  recent.push(now);
  await kv.set(rateKey, recent, { ex: 70 }); // expire a bit after window

  return { valid: true, keyData };
}

// ====================== MAIN CHAT ENDPOINT ======================
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { model, messages, temperature = 0.7, max_tokens } = await req.json();

    if (!model || !MODEL_CONFIG[model as keyof typeof MODEL_CONFIG]) {
      return NextResponse.json(
        { error: "Invalid model. Available: Duru, Duru-mini, Agwu, AVA" },
        { status: 400 }
      );
    }

    const config = MODEL_CONFIG[model as keyof typeof MODEL_CONFIG];

    const fullMessages = [
      { role: "system", content: config.systemPrompt },
      ...messages,
    ];

    const stream = await openrouter.chat.send({
      model: config.model,
      messages: fullMessages,
      temperature,
      max_tokens: max_tokens || undefined,
      stream: true,
    });

    const encoder = new TextEncoder();

    const streamResponse = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }

          if (chunk.usage) {
            // Optional: log usage to KV for future analytics
            console.log(`[\( {model}][ \){auth.keyData?.name || 'user'}] Usage:`, chunk.usage);
          }
        }
        controller.close();
      },
    });

    return new Response(streamResponse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}