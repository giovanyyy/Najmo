import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isPublicRoute = ["/login", "/api/auth"].some(route => nextUrl.pathname.startsWith(route))

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
