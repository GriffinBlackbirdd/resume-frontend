import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('Received gap analysis request');

  try {
    const formData = await request.formData();

    // Log received data for debugging
    console.log('Form data received:', {
      email: formData.get('email'),
      jobRole: formData.get('jobRole'),
      resumeFile: formData.get('resumeFile')?.constructor?.name,
      jobDescriptionFile: formData.get('jobDescriptionFile')?.constructor?.name,
    });

    // Validate required fields for revamp
    const requiredFields = ['email', 'phone', 'linkedin', 'jobRole', 'resumeFile', 'jobDescriptionFile'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log(`Forwarding request to FastAPI at: ${FASTAPI_URL}/revamp-existing`);

    // Test FastAPI connection first
    try {
      const healthCheck = await fetch(`${FASTAPI_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!healthCheck.ok) {
        throw new Error(`FastAPI health check failed: ${healthCheck.status}`);
      }

      console.log('FastAPI backend is healthy');
    } catch (healthError) {
      console.error('FastAPI backend health check failed:', healthError);
      return NextResponse.json(
        {
          error: 'Analysis service is not available. Please make sure the FastAPI backend is running on port 8000.',
          details: 'Run: python start_backend.py'
        },
        { status: 503 }
      );
    }

    // Forward the complete form data to FastAPI backend (revamp needs all fields)
    const response = await fetch(`${FASTAPI_URL}/revamp-existing`, {
      method: 'POST',
      body: formData,
    });

    console.log(`FastAPI response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'Unknown FastAPI error' };
      }

      return NextResponse.json(
        { error: errorData.detail || 'FastAPI server error', status: response.status },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Analysis completed successfully');
    return NextResponse.json(result);

  } catch (error) {
    console.error('API route error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to communicate with analysis service',
        details: errorMessage,
        troubleshooting: 'Make sure FastAPI backend is running: python start_backend.py'
      },
      { status: 500 }
    );
  }
}