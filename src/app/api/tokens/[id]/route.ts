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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenId = params.id
    const body = await request.json()
    
    const { maxMessages, expiresAt, label, company } = body

    // Validate input
    if (maxMessages !== undefined && (typeof maxMessages !== 'number' || maxMessages < 1)) {
      return NextResponse.json(
        { error: 'Max messages must be a positive number' },
        { status: 400 }
      )
    }

    if (expiresAt !== undefined && isNaN(new Date(expiresAt).getTime())) {
      return NextResponse.json(
        { error: 'Invalid expiration date' },
        { status: 400 }
      )
    }

    if (label !== undefined && (typeof label !== 'string' || label.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Label cannot be empty' },
        { status: 400 }
      )
    }

    if (company !== undefined && company !== null && typeof company !== 'string') {
      return NextResponse.json(
        { error: 'Company must be a string or null' },
        { status: 400 }
      )
    }

    // Check if token exists
    const existingToken = await prisma.token.findUnique({
      where: { id: tokenId },
      select: { id: true }
    })

    if (!existingToken) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (maxMessages !== undefined) {
      updateData.maxMessages = maxMessages
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = new Date(expiresAt)
    }
    if (label !== undefined) {
      updateData.label = label.trim()
    }
    if (company !== undefined) {
      updateData.company = company === '' ? null : company
    }

    // Update token
    const updatedToken = await prisma.token.update({
      where: { id: tokenId },
      data: updateData,
      select: {
        id: true,
        token: true,
        label: true,
        company: true,
        maxMessages: true,
        usedMessages: true,
        expiresAt: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedToken)
  } catch (error) {
    console.error('Failed to update token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}