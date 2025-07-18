import { prisma } from './prisma'

export interface TokenValidationResult {
  isValid: boolean
  token?: {
    id: string
    label: string
    usedMessages: number
    maxMessages: number
    expiresAt: Date
  }
  error?: string
}

export async function validateToken(tokenString: string): Promise<TokenValidationResult> {
  try {
    const token = await prisma.token.findUnique({
      where: { token: tokenString },
      select: {
        id: true,
        label: true,
        usedMessages: true,
        maxMessages: true,
        expiresAt: true
      }
    })

    if (!token) {
      return {
        isValid: false,
        error: 'This link doesn’t seem to be active anymore. Please contact Sheng to regain access to askSheng.'
      }
    }

    if (token.expiresAt < new Date()) {
      return {
        isValid: false,
        error: 'This link doesn’t seem to be active anymore. Please contact Sheng to regain access to askSheng.'
      }
    }

    if (token.usedMessages >= token.maxMessages) {
      return {
        isValid: false,
        error: 'Maximum message limit reached. Please contact Sheng if you’d like to continue using askSheng.'
      }
    }

    return {
      isValid: true,
      token
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return {
      isValid: false,
      error: 'Internal server error'
    }
  }
}

export async function incrementTokenUsage(tokenId: string): Promise<void> {
  await prisma.token.update({
    where: { id: tokenId },
    data: {
      usedMessages: {
        increment: 1
      }
    }
  })
}