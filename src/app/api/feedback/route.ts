import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating, message, theme, roomId, systemInfo, timestamp } = body;
    
    if (!rating) {
      return NextResponse.json({ error: 'Rating is required' }, { status: 400 });
    }

    // Generate a unique ID for the feedback
    const feedbackId = `feedback:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Store feedback in Redis
    await redis.hset(feedbackId, {
      rating,
      message: message || '',
      theme: theme || 'default',
      roomId: roomId || 'unknown',
      userAgent: systemInfo?.userAgent || 'unknown',
      screenSize: systemInfo?.screenSize || 'unknown',
      language: systemInfo?.language || 'unknown',
      timeZone: systemInfo?.timeZone || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    
    // Add to a sorted set for easier querying
    await redis.zadd('feedback:index', { 
      score: Date.now(), 
      member: feedbackId 
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
} 