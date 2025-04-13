import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    newUser: "/register",
    signIn: "/login", 

  },
});


// Allow anonymous access to /api/health
export const config = {
  matcher: [
    /*
     * Match all routes except for:
     * - /api/health
     * - static files (e.g., /_next/, /favicon.ico, etc.)
     */
    "/((?!api/health|register|_next/static|_next/image|favicon.ico).*)",
  ],
};