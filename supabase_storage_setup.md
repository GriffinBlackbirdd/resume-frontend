# Supabase Storage Bucket Setup

## Buckets to Create

Go to Storage in your Supabase dashboard and create these buckets:

### 1. `resume-files` bucket
- **Purpose**: Store original resume PDF files
- **Public**: No
- **File size limit**: 10MB
- **Allowed MIME types**: `application/pdf`

### 2. `job-descriptions` bucket  
- **Purpose**: Store job description files (PDF/DOCX/TXT)
- **Public**: No
- **File size limit**: 10MB
- **Allowed MIME types**: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`

### 3. `generated-resumes` bucket
- **Purpose**: Store optimized resume PDFs
- **Public**: No  
- **File size limit**: 10MB
- **Allowed MIME types**: `application/pdf`

## Storage Policies

After creating the buckets, add these RLS policies:

### For `resume-files` bucket:
```sql
-- Users can insert their own files
CREATE POLICY "Users can upload own resume files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resume-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can select their own files  
CREATE POLICY "Users can view own resume files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'resume-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own files
CREATE POLICY "Users can delete own resume files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resume-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

### For `job-descriptions` bucket:
```sql
-- Users can insert their own files
CREATE POLICY "Users can upload own job description files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'job-descriptions'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can select their own files
CREATE POLICY "Users can view own job description files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'job-descriptions'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own files
CREATE POLICY "Users can delete own job description files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'job-descriptions'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

### For `generated-resumes` bucket:
```sql
-- Users can insert their own files
CREATE POLICY "Users can upload own generated resumes" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'generated-resumes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can select their own files
CREATE POLICY "Users can view own generated resumes" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'generated-resumes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own files
CREATE POLICY "Users can delete own generated resumes" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'generated-resumes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

## File Organization Structure

Files will be organized by user ID:
- `resume-files/{user_id}/{timestamp}_resume.pdf`
- `job-descriptions/{user_id}/{timestamp}_jd.{ext}`
- `generated-resumes/{user_id}/{project_id}_optimized.pdf`

This ensures proper user isolation and easy file management.