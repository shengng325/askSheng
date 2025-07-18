import { NextRequest, NextResponse } from 'next/server'
import { validateToken, incrementTokenUsage } from '@/lib/token-validation'
import { generateResponse } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { message, token } = await request.json()

    if (!message || !token) {
      return NextResponse.json(
        { error: 'Message and token are required' },
        { status: 400 }
      )
    }

    // Validate token
    const validation = await validateToken(token)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    // Generate AI response
    const response = await generateResponse(message)

    // Save conversation and increment token usage
    await Promise.all([
      prisma.conversation.create({
        data: {
          tokenId: validation.token!.id,
          message,
          response
        }
      }),
      incrementTokenUsage(validation.token!.id)
    ])

    return NextResponse.json({
      response,
      remainingMessages: validation.token!.maxMessages - validation.token!.usedMessages - 1
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}