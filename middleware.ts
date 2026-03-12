import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          
          supabaseResponse = NextResponse.next({
            request,
          });
          
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: 'none',
              secure: true,
            });
          });
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error('Middleware: Error getting user:', error);
    // If refresh token is invalid, user will remain null and we proceed as unauthenticated
  }
  console.log('Middleware: user found:', !!user, 'path:', request.nextUrl.pathname);

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isRootRoute = request.nextUrl.pathname === '/';

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST205') {
      return supabaseResponse;
    }

    const role = profile?.role || 'student';

    if (isAuthRoute) {
      if (role === 'admin') {
        return supabaseResponse;
      }
      const redirectUrl = new URL('/dashboard', request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          ...cookie,
          sameSite: 'none',
          secure: true,
        });
      });
      
      return redirectResponse;
    }

    if (isAdminRoute && role !== 'admin') {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          ...cookie,
          sameSite: 'none',
          secure: true,
        });
      });
      return redirectResponse;
    }

    if (isDashboardRoute && role === 'admin') {
      return supabaseResponse;
    }
  } else {
    if (isDashboardRoute || isAdminRoute) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          ...cookie,
          sameSite: 'none',
          secure: true,
        });
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
