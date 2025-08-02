import { prisma } from './prisma'
import { logTokenValidationFailure } from './analytics'

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
  failureReason?: 'invalid_token' | 'token_expired' | 'message_limit_reached' | 'server_error'
}

export async function validateToken(
  tokenString: string, 
  context?: { 
    accessType?: 'page_access' | 'message_send', 
    fullUrl?: string,
    userAgent?: string,
    ipAddress?: string,
    skipAnalytics?: boolean
  }
): Promise<TokenValidationResult> {
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
      // Log analytics for invalid token (skip if skipAnalytics is true)
      if (!context?.skipAnalytics) {
        await logTokenValidationFailure({
          failureReason: 'invalid_token',
          tokenString,
          accessType: context?.accessType || 'message_send',
          fullUrl: context?.fullUrl,
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress
        })
      }
      return {
        isValid: false,
        error: `This link doesn't seem to be active anymore. Please contact Sheng to regain access to askSheng.`,
        failureReason: 'invalid_token'
      }
    }

    if (token.expiresAt < new Date()) {
      // Log analytics for token expired (skip if skipAnalytics is true)
      if (!context?.skipAnalytics) {
        await logTokenValidationFailure({
          failureReason: 'token_expired',
          tokenString,
          accessType: context?.accessType || 'message_send',
          fullUrl: context?.fullUrl,
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress,
          metadata: { expiresAt: token.expiresAt }
        })
      }
      return {
        isValid: false,
        error: `This link doesn't seem to be active anymore. Please contact Sheng to regain access to askSheng.`,
        failureReason: 'token_expired'
      }
    }

    if (token.usedMessages >= token.maxMessages) {
      // Log analytics for message limit reached (skip if skipAnalytics is true)
      if (!context?.skipAnalytics) {
        await logTokenValidationFailure({
          failureReason: 'message_limit_reached',
          tokenString,
          accessType: context?.accessType || 'message_send',
          fullUrl: context?.fullUrl,
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress,
          metadata: { usedMessages: token.usedMessages, maxMessages: token.maxMessages }
        })
      }
      return {
        isValid: false,
        error: `Maximum message limit reached. Please contact Sheng if you'd like to continue using askSheng.`,
        failureReason: 'message_limit_reached'
      }
    }

    return {
      isValid: true,
      token
    }
  } catch (error) {
    console.error('Token validation error:', error)
    // Log analytics for server error (skip if skipAnalytics is true)
    if (!context?.skipAnalytics) {
      await logTokenValidationFailure({
        failureReason: 'server_error',
        tokenString,
        accessType: context?.accessType || 'message_send',
        fullUrl: context?.fullUrl,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
    return {
      isValid: false,
      error: 'Internal server error',
      failureReason: 'server_error'
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