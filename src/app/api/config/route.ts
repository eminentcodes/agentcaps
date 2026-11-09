import { NextResponse } from "next/server";
import { appConfig } from "@/lib/server-chain";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(appConfig(), { headers: { "Cache-Control": "no-store" } }); }
