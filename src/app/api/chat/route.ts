import { NextRequest, NextResponse } from 'next/server'
import { validateToken, incrementTokenUsage } from '@/lib/token-validation'
import { generateResponse, ChatMessage } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

// In-memory conversation history storage (per token)
const conversationHistory = new Map<string, ChatMessage[]>()

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

    // Get conversation history for this token
    const tokenHistory = conversationHistory.get(token) || []
    
    // Generate AI response with conversation history
    const response = await generateResponse(message, tokenHistory)

    // Update conversation history with new messages
    const newUserMessage: ChatMessage = { role: 'user', content: message }
    const newAssistantMessage: ChatMessage = { role: 'assistant', content: response }
    
    const updatedHistory = [...tokenHistory, newUserMessage, newAssistantMessage]
    
    // Keep only last 20 messages (10 user + 10 assistant pairs)
    const limitedHistory = updatedHistory.slice(-20)
    
    // Store updated history
    conversationHistory.set(token, limitedHistory)

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