// 3. app/api/keys/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import crypto from "crypto";

export const runtime = "nodejs";

// Only your internal system should call this (protected by MASTER_SECRET)
export async function POST(req: NextRequest) {
  try {
    const { masterSecret, userId, userName, email } = await req.json();

    if (masterSecret !== process.env.MASTER_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId || !userName) {
      return NextResponse.json({ error: "userId and userName are required" }, { status: 400 });
    }

    // Generate secure API key
    const apiKey = `nuku_${crypto.randomBytes(24).toString("hex")}`;

    const keyData = {
      userId,
      name: userName,
      email: email || null,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: "active",
    };

    // Store in Vercel KV (expires in 1 year)
    await kv.set(`key:${apiKey}`, keyData, { ex: 365 * 24 * 60 * 60 });

    return NextResponse.json({
      success: true,
      apiKey,
      message: "API key generated successfully. Save it securely!",
      expires: "1 year",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}