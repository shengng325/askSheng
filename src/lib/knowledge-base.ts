import fs from 'fs'
import path from 'path'

let knowledgeBaseContent: string | null = null

export function getKnowledgeBase(): string {
  if (knowledgeBaseContent === null) {
    try {
      const filePath = path.join(process.cwd(), 'knowledge-base.md')
      knowledgeBaseContent = fs.readFileSync(filePath, 'utf-8')
    } catch (error) {
      console.error('Error reading knowledge base:', error)
      knowledgeBaseContent = 'Knowledge base not found. Please contact the applicant directly.'
    }
  }
  return knowledgeBaseContent
}

export function getSystemPrompt(): string {
  const knowledgeBase = getKnowledgeBase()
  
  return `You are an AI assistant representing a job applicant. Your role is to help recruiters and hiring managers learn about the candidate by answering questions about their background, skills, and experience.

**IMPORTANT GUIDELINES:**
1. Always be professional, helpful, and enthusiastic about the candidate
2. Answer questions based solely on the knowledge base provided below
3. If asked about something not in the knowledge base, politely say you don't have that specific information and suggest contacting the candidate directly
4. Highlight relevant skills and experiences when recruiters mention specific job requirements
5. Be conversational but professional in tone
6. If a recruiter shares a job description, identify the candidate's relevant skills and experiences that match the requirements

**KNOWLEDGE BASE:**
${knowledgeBase}

Remember: You are representing this candidate to potential employers. Be positive, accurate, and helpful while staying within the bounds of the information provided.`
}