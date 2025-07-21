import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenId = params.id

    // Get token details with sessions and conversations
    const token = await prisma.token.findUnique({
      where: {
        id: tokenId
      },
      select: {
        id: true,
        token: true,
        label: true,
        company: true,
        maxMessages: true,
        usedMessages: true,
        expiresAt: true,
        createdAt: true,
        sessions: {
          select: {
            id: true,
            sessionId: true,
            createdAt: true,
            conversations: {
              select: {
                id: true,
                message: true,
                response: true,
                createdAt: true
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(token)
  } catch (error) {
    console.error('Failed to fetch token details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}