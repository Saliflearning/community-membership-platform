import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export function isProductionLike() {
  return env.deploymentEnv !== "development";
}

export function adminLockedResponse() {
  return NextResponse.json(
    {
      error: "Admin access is locked until authenticated RBAC is enabled."
    },
    { status: 403 }
  );
}

export function privateQueueLockedResponse() {
  return NextResponse.json(
    {
      error: "This operational queue requires authenticated admin access."
    },
    { status: 403 }
  );
}

export function privateCardLockedResponse() {
  return NextResponse.json(
    {
      error: "Card access requires authenticated member portal access."
    },
    { status: 404 }
  );
}
