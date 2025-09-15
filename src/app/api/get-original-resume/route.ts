import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, try to get the latest original resume from Supabase storage
    const { data: files, error } = await supabase.storage
      .from('user-documents')
      .list(`${userId}/`, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
    }

    // Find the latest resume file
    const resumeFiles = files?.filter(file => file.name.startsWith('resume_') && file.name.endsWith('.pdf')) || [];

    if (resumeFiles.length === 0) {
      return NextResponse.json({ error: 'No resume found' }, { status: 404 });
    }

    const latestResume = resumeFiles[0];
    const filePath = `${userId}/${latestResume.name}`;

    // Get the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-documents')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return NextResponse.json({ error: 'Failed to download resume' }, { status: 500 });
    }

    // Convert PDF to image for comparison
    // For now, we'll return the PDF and let the frontend handle conversion
    // In a real implementation, you might want to convert to image on the server

    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}