import { prisma } from './prisma'

export interface TokenValidationFailureEvent {
  failureReason: 'invalid_token' | 'token_expired' | 'message_limit_reached' | 'server_error' | 'no_token'
  tokenString?: string
  userAgent?: string
  ipAddress?: string
  accessType?: 'page_access' | 'message_send'
  fullUrl?: string
  metadata?: Record<string, string | number | boolean | Date | null>
}

export async function logTokenValidationFailure(event: TokenValidationFailureEvent): Promise<void> {
  try {
    await prisma.tokenAnalytics.create({
      data: {
        failureReason: event.failureReason,
        tokenString: event.tokenString,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        accessType: event.accessType,
        fullUrl: event.fullUrl,
        metadata: event.metadata
      }
    })
  } catch (error) {
    // Don't let analytics failures break the main flow
    console.error('Failed to log token validation failure:', error)
  }
}

export async function getTokenValidationFailureStats(days: number = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const failures = await prisma.tokenAnalytics.findMany({
    where: {
      createdAt: {
        gte: startDate
      }
    },
    select: {
      failureReason: true,
      createdAt: true,
      accessType: true,
      fullUrl: true,
      userAgent: true,
      ipAddress: true
    }
  })

  // Group by failure reason
  const stats = failures.reduce((acc, failure) => {
    const reason = failure.failureReason || 'unknown'
    if (!acc[reason]) {
      acc[reason] = 0
    }
    acc[reason]++
    return acc
  }, {} as Record<string, number>)

  return {
    totalFailures: failures.length,
    failuresByReason: stats,
    recentFailures: failures.slice(-10) // Last 10 failures
  }
}