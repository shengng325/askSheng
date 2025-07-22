import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { label, company, maxMessages = 30, validityDays = 30 } = await request.json()

    if (!label) {
      return NextResponse.json(
        { error: 'Label is required' },
        { status: 400 }
      )
    }

    // Generate unique token (shorter UUID - first 8 characters)
    let token = uuidv4().substring(0, 8)
    
    // If company is provided, prepend it to the token
    if (company && company.trim()) {
      const companySlug = company
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .slice(0, 2)
        .join('-')
        .replace(/[^a-z0-9-]/g, '')
      token = `${companySlug}-${token}`
    }
    
    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validityDays)

    // Create token in database
    const newToken = await prisma.token.create({
      data: {
        token,
        label: label.trim(),
        company: company?.trim() || null,
        maxMessages,
        expiresAt
      }
    })

    return NextResponse.json({
      token: newToken.token,
      label: newToken.label,
      company: newToken.company,
      maxMessages: newToken.maxMessages,
      expiresAt: newToken.expiresAt,
      url: `${process.env.NEXT_PUBLIC_APP_URL}?src=${newToken.token}`
    })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}