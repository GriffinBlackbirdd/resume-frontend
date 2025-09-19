import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { yamlContent } = await request.json();
    
    // Create temp directory for processing
    const tempDir = join(process.cwd(), 'temp');
    const yamlPath = join(tempDir, 'resume.yaml');
    const pdfPath = join(tempDir, 'resume.pdf');
    
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await execAsync(`mkdir -p ${tempDir}`);
    }
    
    // Copy entire designs folder to temp directory
    const sourceDesignsDir = '/app/config/designs';
    const targetDesignsDir = join(tempDir, 'designs');
    
    try {
      await execAsync(`cp -r "${sourceDesignsDir}" "${tempDir}/"`);
      console.log('Entire designs folder copied successfully');
      console.log('Source:', sourceDesignsDir);
      console.log('Target:', targetDesignsDir);
      
      // List all files in the designs directory
      const verifyResult = await execAsync(`ls -la "${targetDesignsDir}"`);
      console.log('Designs folder contents:', verifyResult.stdout);
    } catch (copyError) {
      console.error('Error copying designs folder:', copyError);
      // Continue without design files - will use default
    }
    
    // Write YAML content to file
    writeFileSync(yamlPath, yamlContent);
    
    try {
      // Execute RenderCV command with specific design (relative path from copied designs)
      const command = `cd ${tempDir} && rendercv render resume.yaml --design designs/engineeringClassic.yaml`;
      console.log('Executing command:', command);
      console.log('Working directory:', tempDir);
      
      const result = await execAsync(command);
      console.log('RenderCV stdout:', result.stdout);
      console.log('RenderCV stderr:', result.stderr);
      
      // Check for rendered PDF in rendercv_output directory
      const rendercvOutputDir = join(tempDir, 'rendercv_output');
      const renderedPdfPath = join(rendercvOutputDir, 'resume.pdf');
      
      // Also check for PDF with different naming conventions that rendercv might use
      const possiblePdfPaths = [
        join(rendercvOutputDir, 'resume.pdf'),
        join(rendercvOutputDir, 'John_Doe_CV.pdf'),
        join(rendercvOutputDir, 'CV.pdf')
      ];
      
      let pdfBuffer = null;
      let foundPdfPath = null;
      
      for (const possiblePath of possiblePdfPaths) {
        if (existsSync(possiblePath)) {
          pdfBuffer = readFileSync(possiblePath);
          foundPdfPath = possiblePath;
          break;
        }
      }
      
      // If no PDF found in expected locations, check the entire rendercv_output directory
      if (!pdfBuffer && existsSync(rendercvOutputDir)) {
        const files = await execAsync(`find ${rendercvOutputDir} -name "*.pdf" | head -1`);
        if (files.stdout.trim()) {
          const firstPdfPath = files.stdout.trim();
          pdfBuffer = readFileSync(firstPdfPath);
          foundPdfPath = firstPdfPath;
        }
      }
      
      if (pdfBuffer) {
        console.log(`PDF found at: ${foundPdfPath}`);
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename=resume.pdf'
          }
        });
      } else {
        console.error('No PDF found in rendercv_output directory');
        return NextResponse.json({ error: 'PDF generation failed - no output file found' }, { status: 500 });
      }
    } catch (renderError) {
      console.error('RenderCV Error:', renderError);
      
      // Fallback: Create a simple HTML to PDF conversion or mock PDF
      const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

5 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(Resume Preview - RenderCV Integration Pending) Tj
0 -20 Td
(Please install RenderCV to see full PDF output) Tj
0 -20 Td
(Command: pip install rendercv) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;

      return new NextResponse(mockPdfContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename=resume.pdf'
        }
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}