import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Routes that logged-in users shouldn't see (redirect to their dashboard)
const AUTH_ROUTES = ["/login", "/register", "/"];

// Role → home dashboard mapping
const ROLE_HOME: Record<string, string> = {
  provider: "/provider/dashboard",
  customer: "/customer/home",
};

export default auth(function middleware(req: NextRequest & { auth: { user: { role: string } } | null }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // --- Already authenticated: bounce away from public auth pages ---
  if (session && AUTH_ROUTES.includes(pathname)) {
    const home = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(new URL(home, req.url));
  }

  // --- Protected provider routes ---
  if (pathname.startsWith("/provider")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "provider") {
      // Customer trying to access provider area
      return NextResponse.redirect(new URL(ROLE_HOME["customer"], req.url));
    }
  }

  // --- Protected customer routes ---
  if (pathname.startsWith("/customer")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "customer") {
      // Provider trying to access customer area
      return NextResponse.redirect(new URL(ROLE_HOME["provider"], req.url));
    }
  }

  // --- Protected API routes ---
  if (pathname.startsWith("/api/provider")) {
    if (!session || role !== "provider") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/customer")) {
    if (!session || role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  // Match everything except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
