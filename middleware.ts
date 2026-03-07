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
          
          // Create the response with the updated request cookies
          supabaseResponse = NextResponse.next({
            request,
          });
          
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Ensure cross-origin iframe support
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
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      // If there's an auth error (like invalid refresh token), we should treat the user as logged out
      if (authError.message !== 'Auth session missing!') {
        console.warn('Middleware auth error (handled):', authError.message);
      }
      user = null;
    } else {
      user = authUser;
    }
  } catch (error) {
    console.error('Middleware auth exception:', error);
    user = null;
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isRootRoute = request.nextUrl.pathname === '/';

  if (user) {
    // Get user role for intelligent redirection
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If table doesn't exist yet, don't crash middleware
    if (profileError && profileError.code === 'PGRST205') {
      return supabaseResponse;
    }

    const role = profile?.role || 'student';

    if (isAuthRoute || isRootRoute) {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/dashboard', request.url));
    }

    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isDashboardRoute && role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  } else {
    if (isDashboardRoute || isAdminRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
