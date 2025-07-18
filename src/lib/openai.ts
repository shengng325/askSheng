import OpenAI from 'openai'
import { getSystemPrompt } from './knowledge-base'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateResponse(message: string): Promise<string> {
  try {
    const systemPrompt = getSystemPrompt()
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    return completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate response')
  }
}