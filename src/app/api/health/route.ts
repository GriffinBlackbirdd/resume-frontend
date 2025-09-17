import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if FastAPI backend is running
    const response = await fetch('https://stable-dane-quickly.ngrok-free.app/health', {
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