import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas vs públicas
  // Excluimos explícitamente rutas públicas y estáticas
  const isPublicPath = 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/sing-up') ||
    request.nextUrl.pathname.startsWith('/auth') || 
    request.nextUrl.pathname.startsWith('/uploads')

  if (
    !user &&
    !isPublicPath
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/sing-up'
    const intendedPath = request.nextUrl.pathname + (request.nextUrl.search || '')
    url.searchParams.set('redirectTo', intendedPath)
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new Response object with NextResponse.redirect() you must
  // copy the cookies from supabaseResponse to the new Response object.
  return supabaseResponse
}
