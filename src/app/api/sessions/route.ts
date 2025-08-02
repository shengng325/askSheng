import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/token-validation'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { token, fullUrl } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Check if URL has 't' parameter to skip analytics
    const skipAnalytics = fullUrl ? new URL(fullUrl).searchParams.has('t') : false

    // Validate token with page access context
    const validation = await validateToken(token, { 
      accessType: 'page_access',
      fullUrl,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      skipAnalytics
    })
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    // Generate unique session ID
    const sessionId = randomUUID()

    // Create session record
    const session = await prisma.session.create({
      data: {
        sessionId,
        tokenId: validation.token!.id
      }
    })

    return NextResponse.json({
      sessionId: session.sessionId,
      createdAt: session.createdAt
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}