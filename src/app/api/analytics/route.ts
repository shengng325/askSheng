import { NextRequest, NextResponse } from 'next/server'
import { logTokenValidationFailure } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { failureReason, tokenString, userAgent, ipAddress, accessType, fullUrl, metadata } = body

    await logTokenValidationFailure({
      failureReason,
      tokenString,
      userAgent: userAgent || request.headers.get('user-agent') || undefined,
      ipAddress: ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      accessType,
      fullUrl,
      metadata
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics logging error:', error)
    return NextResponse.json({ error: 'Failed to log analytics' }, { status: 500 })
  }
}