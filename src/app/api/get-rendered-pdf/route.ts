import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const tempDir = join(process.cwd(), 'temp');
    const rendercvOutputDir = join(tempDir, 'rendercv_output');
    
    if (!existsSync(rendercvOutputDir)) {
      return NextResponse.json({ error: 'No rendercv_output directory found' }, { status: 404 });
    }
    
    // Look for the most recently modified PDF file in the output directory
    let latestPdf: string | null = null;
    let latestTime = 0;
    
    try {
      const files = readdirSync(rendercvOutputDir);
      
      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const filePath = join(rendercvOutputDir, file);
          const stats = statSync(filePath);
          
          if (stats.mtime.getTime() > latestTime) {
            latestTime = stats.mtime.getTime();
            latestPdf = filePath;
          }
        }
      }
    } catch (error) {
      console.error('Error reading rendercv_output directory:', error);
    }
    
    // If no PDF found with directory listing, try common names
    if (!latestPdf) {
      const possiblePdfPaths = [
        join(rendercvOutputDir, 'resume.pdf'),
        join(rendercvOutputDir, 'John_Doe_CV.pdf'),
        join(rendercvOutputDir, 'CV.pdf')
      ];
      
      for (const possiblePath of possiblePdfPaths) {
        if (existsSync(possiblePath)) {
          latestPdf = possiblePath;
          break;
        }
      }
    }
    
    // As last resort, use find command
    if (!latestPdf) {
      try {
        const findResult = await execAsync(`find "${rendercvOutputDir}" -name "*.pdf" -exec ls -t {} + | head -1`);
        if (findResult.stdout.trim()) {
          latestPdf = findResult.stdout.trim();
        }
      } catch (error) {
        console.error('Find command failed:', error);
      }
    }
    
    if (latestPdf && existsSync(latestPdf)) {
      console.log(`Serving PDF from: ${latestPdf}`);
      const pdfBuffer = readFileSync(latestPdf);
      const fileName = latestPdf.split('/').pop() || 'resume.pdf';
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename=${fileName}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      console.log('No PDF file found in rendercv_output directory');
      return NextResponse.json({ 
        error: 'No PDF file found in rendercv_output directory',
        searchedDir: rendercvOutputDir,
        exists: existsSync(rendercvOutputDir)
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}