import OpenAI from 'openai'
import { getSystemPrompt } from './knowledge-base'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function generateResponse(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    const systemPrompt = await getSystemPrompt()
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })

    return completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate response')
  }
}