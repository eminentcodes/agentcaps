import { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { loadWorkspace } from "@/lib/server-chain";
import { readableError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get("owner");
  if (!owner || !isAddress(owner)) return NextResponse.json({ error: "A valid owner wallet is required." }, { status: 400 });
  try { return NextResponse.json(await loadWorkspace(getAddress(owner)), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: readableError(error) }, { status: 503 }); }
}
