import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Try to get the latest revamped resume from generated-content
    const { data: files, error } = await supabase.storage
      .from('generated-content')
      .list(`${userId}/`, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json({ error: 'Failed to fetch revamped resumes' }, { status: 500 });
    }

    // Find the latest revamped resume file
    // Look for files that might be generated from revamping process
    const resumeFiles = files?.filter(file =>
      (file.name.includes('revamped') || file.name.includes('optimized')) &&
      file.name.endsWith('.pdf')
    ) || [];

    if (resumeFiles.length === 0) {
      // If no revamped resume found, check for any recently generated PDF
      const allPdfs = files?.filter(file => file.name.endsWith('.pdf')) || [];
      if (allPdfs.length > 0) {
        const latestPdf = allPdfs[0];
        const filePath = `${userId}/${latestPdf.name}`;

        const { data: fileData, error: downloadError } = await supabase.storage
          .from('generated-content')
          .download(filePath);

        if (downloadError) {
          console.error('Error downloading file:', downloadError);
          return NextResponse.json({ error: 'Failed to download revamped resume' }, { status: 500 });
        }

        return new NextResponse(fileData, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      return NextResponse.json({ error: 'No revamped resume found' }, { status: 404 });
    }

    const latestResume = resumeFiles[0];
    const filePath = `${userId}/${latestResume.name}`;

    // Get the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('generated-content')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return NextResponse.json({ error: 'Failed to download revamped resume' }, { status: 500 });
    }

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