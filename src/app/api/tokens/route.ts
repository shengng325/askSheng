import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tokens = await prisma.token.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        token: true,
        label: true,
        maxMessages: true,
        usedMessages: true,
        expiresAt: true,
        createdAt: true
      }
    })

    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Failed to fetch tokens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}