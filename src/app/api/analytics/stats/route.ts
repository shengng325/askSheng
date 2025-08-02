import { NextRequest, NextResponse } from 'next/server'
import { getTokenValidationFailureStats } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    const stats = await getTokenValidationFailureStats(days)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Analytics stats error:', error)
    return NextResponse.json({ error: 'Failed to get analytics stats' }, { status: 500 })
  }
}