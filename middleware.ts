import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = (token as any)?.role;

    // Admin-only routes
    const adminOnlyPaths = ["/employees", "/analytics", "/activity", "/integrations"];
    if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Admin + Manager routes
    const privilegedPaths = ["/attendance/manage", "/payslips", "/quotations", "/invoices"];
    if (privilegedPaths.some((p) => pathname.startsWith(p))) {
      if (!["admin", "manager"].includes(role)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run on non-API, non-static, non-auth routes
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Only protect page routes — exclude ALL /api/ routes (each handles its own auth),
  // _next internals, static files, favicon, and the login page itself.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|login).*)",
  ],
};
