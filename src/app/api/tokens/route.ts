import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['label', 'company', 'createdAt', 'latestMessage', 'latestSession']
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.token.count()

    // For sorting by latest message/session, we need to use raw SQL or a different approach
    // Since Prisma doesn't support direct orderBy on aggregated relation fields in this way,
    // we'll need to handle this differently
    
    let tokens
    
    if (validSortBy === 'latestMessage') {
      // Use raw query to sort by latest message time
      // Tokens with messages first, then tokens without messages
      if (validSortOrder === 'desc') {
        tokens = await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT t.*, 
                   MAX(c."createdAt") as latest_message_time,
                   (SELECT COUNT(*) FROM sessions s WHERE s."tokenId" = t.id) as sessions_count,
                   CASE WHEN MAX(c."createdAt") IS NOT NULL THEN 1 ELSE 0 END as has_messages,
                   CASE WHEN MAX(c."createdAt") IS NOT NULL THEN MAX(c."createdAt") ELSE t."createdAt" END as sort_time
            FROM tokens t
            LEFT JOIN conversations c ON t.id = c."tokenId"
            GROUP BY t.id
            ORDER BY has_messages DESC, sort_time DESC
            LIMIT ${limit} OFFSET ${skip}
          `
        )
      } else {
        tokens = await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT t.*, 
                   MAX(c."createdAt") as latest_message_time,
                   (SELECT COUNT(*) FROM sessions s WHERE s."tokenId" = t.id) as sessions_count,
                   CASE WHEN MAX(c."createdAt") IS NOT NULL THEN 1 ELSE 0 END as has_messages,
                   CASE WHEN MAX(c."createdAt") IS NOT NULL THEN MAX(c."createdAt") ELSE t."createdAt" END as sort_time
            FROM tokens t
            LEFT JOIN conversations c ON t.id = c."tokenId"
            GROUP BY t.id
            ORDER BY has_messages DESC, sort_time ASC
            LIMIT ${limit} OFFSET ${skip}
          `
        )
      }
    } else if (validSortBy === 'latestSession') {
      // Use raw query to sort by latest session time
      // Tokens with sessions first, then tokens without sessions
      if (validSortOrder === 'desc') {
        tokens = await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT t.*, 
                   MAX(s."createdAt") as latest_session_time,
                   COUNT(s.id) as sessions_count,
                   CASE WHEN MAX(s."createdAt") IS NOT NULL THEN 1 ELSE 0 END as has_sessions,
                   CASE WHEN MAX(s."createdAt") IS NOT NULL THEN MAX(s."createdAt") ELSE t."createdAt" END as sort_time
            FROM tokens t
            LEFT JOIN sessions s ON t.id = s."tokenId"
            GROUP BY t.id
            ORDER BY has_sessions DESC, sort_time DESC
            LIMIT ${limit} OFFSET ${skip}
          `
        )
      } else {
        tokens = await prisma.$queryRaw(
          Prisma.sql`
            SELECT DISTINCT t.*, 
                   MAX(s."createdAt") as latest_session_time,
                   COUNT(s.id) as sessions_count,
                   CASE WHEN MAX(s."createdAt") IS NOT NULL THEN 1 ELSE 0 END as has_sessions,
                   CASE WHEN MAX(s."createdAt") IS NOT NULL THEN MAX(s."createdAt") ELSE t."createdAt" END as sort_time
            FROM tokens t
            LEFT JOIN sessions s ON t.id = s."tokenId"
            GROUP BY t.id
            ORDER BY has_sessions DESC, sort_time ASC
            LIMIT ${limit} OFFSET ${skip}
          `
        )
      }
    } else {
      // Use standard Prisma query for other sorting
      tokens = await prisma.token.findMany({
        skip,
        take: limit,
        orderBy: {
          [validSortBy]: validSortOrder
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
          _count: {
            select: {
              sessions: true
            }
          }
        }
      })
    }

    // If we used raw SQL, we need to format the response and add session counts
    if (validSortBy === 'latestMessage' || validSortBy === 'latestSession') {
      // Convert raw SQL results to proper format
      interface RawTokenResult {
        id: string
        token: string
        label: string
        company: string | null
        maxMessages: number
        usedMessages: number
        expiresAt: Date
        createdAt: Date
        updatedAt: Date
        sessions_count?: bigint
        latest_message_time?: Date | null
        latest_session_time?: Date | null
        has_messages?: number
        has_sessions?: number
        sort_time?: Date
      }
      const formattedTokens = await Promise.all(
        (tokens as RawTokenResult[]).map(async (token) => ({
          id: token.id,
          token: token.token,
          label: token.label,
          company: token.company,
          maxMessages: token.maxMessages,
          usedMessages: token.usedMessages,
          expiresAt: token.expiresAt,
          createdAt: token.createdAt,
          _count: {
            sessions: validSortBy === 'latestSession' ? Number(token.sessions_count) : (await prisma.session.count({ where: { tokenId: token.id } }))
          }
        }))
      )
      tokens = formattedTokens
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      tokens,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('Failed to fetch tokens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}