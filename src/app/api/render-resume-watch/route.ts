import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Store active watch processes
const activeWatchers = new Map<string, ChildProcess>();

export async function POST(request: NextRequest) {
  try {
    const { yamlContent, action } = await request.json();
    
    console.log('Watch API called with action:', action);
    console.log('YAML content length:', yamlContent?.length || 0);
    
    // Create temp directory for processing
    const tempDir = join(process.cwd(), 'temp');
    const yamlPath = join(tempDir, 'resume.yaml');
    
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await execAsync(`mkdir -p ${tempDir}`);
    }
    
    // Copy entire designs folder to temp directory
    const sourceDesignsDir = '/app/config/designs';
    const targetDesignsDir = join(tempDir, 'designs');
    
    console.log('ATTEMPTING TO COPY DESIGNS FOLDER');
    console.log('Source:', sourceDesignsDir);
    console.log('Target directory:', tempDir);
    console.log('Expected target:', targetDesignsDir);
    
    try {
      // Check if source exists first
      const sourceCheck = await execAsync(`ls -la "${sourceDesignsDir}"`);
      console.log('Source designs folder exists:', sourceCheck.stdout);
      
      await execAsync(`cp -r "${sourceDesignsDir}" "${tempDir}/"`);
      console.log('✅ Entire designs folder copied to watch directory:', targetDesignsDir);
      
      // List all files in the designs directory
      const verifyResult = await execAsync(`ls -la "${targetDesignsDir}"`);
      console.log('✅ Watch designs folder contents:', verifyResult.stdout);
    } catch (copyError) {
      console.error('❌ Error copying designs folder for watch:', copyError);
      console.error('Copy error details:', copyError);
    }
    
    if (action === 'start') {
      // Stop any existing watcher for this directory
      const existingWatcher = activeWatchers.get(tempDir);
      if (existingWatcher) {
        existingWatcher.kill();
        activeWatchers.delete(tempDir);
      }
      
      // Write YAML content to file
      writeFileSync(yamlPath, yamlContent);
      
      try {
        // Start rendercv in watch mode with specific design
        console.log('🚀 Starting rendercv watch process...');
        const designPath = 'designs/engineeringClassic.yaml';
        console.log('📁 Working directory:', tempDir);
        console.log('🎨 Design file:', designPath);
        console.log('📋 Full command: rendercv render resume.yaml --design', designPath, '--watch');
        
        const watchProcess = spawn('rendercv', [
          'render',
          'resume.yaml',
          '--design',
          designPath,
          '--watch'
        ], {
          cwd: tempDir,
          detached: false,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Store the process
        activeWatchers.set(tempDir, watchProcess);
        
        // Log output from rendercv
        watchProcess.stdout?.on('data', (data) => {
          console.log('📄 RenderCV stdout:', data.toString());
        });
        
        watchProcess.stderr?.on('data', (data) => {
          console.log('⚠️ RenderCV stderr:', data.toString());
        });
        
        watchProcess.on('error', (error) => {
          console.error('❌ RenderCV process error:', error);
        });
        
        watchProcess.on('close', (code) => {
          console.log('🔚 RenderCV process closed with code:', code);
        });
        
        
        watchProcess.on('exit', (code) => {
          console.log(`Watch process exited with code: ${code}`);
          activeWatchers.delete(tempDir);
        });
        
        // Give the process a moment to start
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return NextResponse.json({ 
          status: 'Watch started',
          processId: watchProcess.pid,
          outputDir: join(tempDir, 'rendercv_output')
        });
        
      } catch (error) {
        console.error('Failed to start watch process:', error);
        return NextResponse.json({ error: 'Failed to start watch process' }, { status: 500 });
      }
      
    } else if (action === 'stop') {
      // Stop existing watcher
      const existingWatcher = activeWatchers.get(tempDir);
      if (existingWatcher) {
        existingWatcher.kill();
        activeWatchers.delete(tempDir);
        return NextResponse.json({ status: 'Watch stopped' });
      } else {
        return NextResponse.json({ status: 'No active watch process found' });
      }
      
    } else if (action === 'update') {
      // Update YAML content for existing watcher
      writeFileSync(yamlPath, yamlContent);
      return NextResponse.json({ status: 'YAML updated' });
      
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "start", "stop", or "update"' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Get status of active watchers
  const tempDir = join(process.cwd(), 'temp');
  const watcher = activeWatchers.get(tempDir);
  
  return NextResponse.json({
    active: !!watcher,
    processId: watcher?.pid || null,
    outputDir: join(tempDir, 'rendercv_output')
  });
}