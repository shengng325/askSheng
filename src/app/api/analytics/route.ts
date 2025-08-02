import { NextRequest, NextResponse } from 'next/server'
import { logTokenValidationFailure } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    // Security: Only allow requests from same origin in production
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
      ].filter(Boolean)

      const isValidOrigin = origin && allowedOrigins.some(allowed => 
        allowed && origin === allowed
      )
      
      const isValidReferer = referer && allowedOrigins.some(allowed => 
        allowed && (referer === allowed || referer.startsWith(allowed + '/'))
      )
      
      // Allow if either origin or referer is valid (handles different browser behaviors)
      if (!isValidOrigin && !isValidReferer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { failureReason, tokenString, userAgent, ipAddress, accessType, fullUrl, metadata } = body

    // Validate required fields and allowed values
    const allowedFailureReasons = ['invalid_token', 'token_expired', 'message_limit_reached', 'server_error', 'no_token']
    const allowedAccessTypes = ['page_access', 'message_send']

    if (!failureReason || !allowedFailureReasons.includes(failureReason)) {
      return NextResponse.json({ error: 'Invalid failure reason' }, { status: 400 })
    }

    if (accessType && !allowedAccessTypes.includes(accessType)) {
      return NextResponse.json({ error: 'Invalid access type' }, { status: 400 })
    }

    // Sanitize inputs - limit string lengths to prevent abuse
    const sanitizedData = {
      failureReason,
      tokenString: tokenString ? String(tokenString).substring(0, 500) : undefined,
      userAgent: (userAgent || request.headers.get('user-agent') || undefined)?.substring(0, 500),
      ipAddress: (ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined)?.substring(0, 45),
      accessType,
      fullUrl: fullUrl ? String(fullUrl).substring(0, 2000) : undefined,
      metadata
    }

    await logTokenValidationFailure(sanitizedData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics logging error:', error)
    return NextResponse.json({ error: 'Failed to log analytics' }, { status: 500 })
  }
}