import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  if (
    pathname === "/" ||
    pathname === "/requestform" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/requestform") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/asset") {
    const requestedLocationId = Number(searchParams.get("locationId"));
    const allowed =
      payload.isAdmin ||
      (payload.location || []).includes(requestedLocationId);

    if (!allowed) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/login|api/requestform|_next/static|_next/image|favicon.ico).*)"],
};