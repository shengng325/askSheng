import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect admin routes: /generate, /tokens, and token API endpoints
  if (request.nextUrl.pathname.startsWith('/generate') || 
      request.nextUrl.pathname.startsWith('/tokens') ||
      request.nextUrl.pathname.startsWith('/api/tokens')) {
    const basicAuth = request.headers.get('authorization')
    
    if (!basicAuth) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      })
    }

    try {
      const authValue = basicAuth.split(' ')[1]
      if (!authValue) {
        throw new Error('No auth value')
      }
      
      const [username, password] = atob(authValue).split(':')
      
      // Check credentials against environment variables
      const validUsername = process.env.ADMIN_USERNAME
      const validPassword = process.env.ADMIN_PASSWORD
      
      // Remove debug logging for production
      
      if (username !== validUsername || password !== validPassword) {
        return new NextResponse('Invalid credentials', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"',
          },
        })
      }
    } catch (error) {
      console.error('Auth error:', error)
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/generate', '/tokens/:path*', '/api/tokens/:path*']
}