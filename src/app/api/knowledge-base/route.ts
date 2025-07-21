import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invalidateSystemPromptCache } from '@/lib/knowledge-base'

export async function GET() {
  try {
    const knowledgeBase = await prisma.knowledgeBase.findFirst()
    
    if (!knowledgeBase) {
      return NextResponse.json({ content: '' })
    }
    
    return NextResponse.json({ content: knowledgeBase.content })
  } catch (error) {
    console.error('Error fetching knowledge base:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()
    
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      )
    }
    
    // Check if a knowledge base entry exists
    const existingKnowledgeBase = await prisma.knowledgeBase.findFirst()
    
    let knowledgeBase
    if (existingKnowledgeBase) {
      // Update existing entry
      knowledgeBase = await prisma.knowledgeBase.update({
        where: { id: existingKnowledgeBase.id },
        data: { content }
      })
    } else {
      // Create new entry
      knowledgeBase = await prisma.knowledgeBase.create({
        data: { content }
      })
    }
    
    // Invalidate the cached system prompt
    invalidateSystemPromptCache()
    
    return NextResponse.json({ 
      message: 'Knowledge base updated successfully',
      id: knowledgeBase.id 
    })
  } catch (error) {
    console.error('Error updating knowledge base:', error)
    return NextResponse.json(
      { error: 'Failed to update knowledge base' },
      { status: 500 }
    )
  }
}