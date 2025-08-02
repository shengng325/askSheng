import { NextRequest, NextResponse } from 'next/server'
import { getTokenValidationFailureStats } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    // Security: Require admin access token for stats access
    const authHeader = request.headers.get('authorization')
    const adminToken = process.env.ADMIN_ACCESS_TOKEN
    
    // Always require authentication for analytics stats
    if (!adminToken || !authHeader || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: 'Unauthorized access to analytics' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    // Limit the days parameter to prevent excessive data exposure
    const limitedDays = Math.min(days, 30)
    
    const stats = await getTokenValidationFailureStats(limitedDays)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Analytics stats error:', error)
    return NextResponse.json({ error: 'Failed to get analytics stats' }, { status: 500 })
  }
}