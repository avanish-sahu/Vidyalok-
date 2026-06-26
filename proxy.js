import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

async function getRole(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role;
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;
  const role = await getRole(token);

  if (pathname.startsWith("/teacher")) {
    if (role !== "teacher") {
      return NextResponse.redirect(new URL("/login?role=teacher", request.url));
    }
  }

  const studentAreaPrefixes = [
    "/subjects",
    "/test-series",
    "/performance",
    "/attendance",
    "/marks",
    "/fees",
    "/notifications",
  ];
  if (studentAreaPrefixes.some((p) => pathname.startsWith(p))) {
    if (!role) {
      return NextResponse.redirect(new URL("/login?role=student", request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/subjects/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/test-series/:path*",
    "/performance/:path*",
    "/attendance/:path*",
    "/marks/:path*",
    "/fees/:path*",
    "/notifications/:path*",
  ],
};
