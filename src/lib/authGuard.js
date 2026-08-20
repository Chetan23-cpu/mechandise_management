import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

// Reads the session cookie and returns the decoded token payload, or null
// if there's no valid session. Use this when a route just needs to know
// who's asking (or whether anyone is).
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return payload;
}

// Use at the top of an admin-only route handler:
//
//   const guard = await requireAdmin();
//   if (guard) return guard; // guard is a NextResponse (401 or 403)
//
// Returns null when the caller is a verified admin, otherwise returns the
// NextResponse to send back immediately.
export async function requireAdmin() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = user.isAdmin === true || user.isAdmin === "Yes";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
