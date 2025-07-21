import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['label', 'company', 'createdAt']
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.token.count()

    // Get tokens with pagination, sorting, and session counts
    const tokens = await prisma.token.findMany({
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