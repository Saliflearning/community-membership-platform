import { NextResponse } from "next/server";
import { getPlatformConfig } from "@/services/config-service";

export async function GET() {
  return NextResponse.json(await getPlatformConfig());
}
