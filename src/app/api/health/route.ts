import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if FastAPI backend is running
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'healthy',
        backend: 'available',
        fastapi: data
      });
    } else {
      return NextResponse.json({
        status: 'degraded',
        backend: 'unavailable',
        message: 'FastAPI backend not responding'
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      backend: 'unavailable',
      error: 'FastAPI backend not reachable'
    });
  }
}