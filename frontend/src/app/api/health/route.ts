import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Insight Ignite Frontend App",
    timestamp: new Date().toISOString(),
  });
}
