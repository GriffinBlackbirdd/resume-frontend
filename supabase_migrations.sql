-- Complete Supabase Database Schema for Resume Builder
-- Run these migrations in order in your Supabase SQL Editor

-- Migration 1: User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT,
    phone TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Migration 2: Resume Projects Table
CREATE TABLE resume_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_role TEXT NOT NULL,
    project_name TEXT,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger to resume_projects
CREATE TRIGGER update_resume_projects_updated_at 
    BEFORE UPDATE ON resume_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on resume_projects
ALTER TABLE resume_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for resume_projects
CREATE POLICY "Users can view own projects" ON resume_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON resume_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON resume_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON resume_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Migration 3: Job Descriptions Table
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT, -- Path in Supabase Storage
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt')),
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on job_descriptions
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for job_descriptions
CREATE POLICY "Users can view own job descriptions" ON job_descriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job descriptions" ON job_descriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job descriptions" ON job_descriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Migration 4: Original Resumes Table
CREATE TABLE original_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES resume_projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT, -- Path in Supabase Storage
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on original_resumes
ALTER TABLE original_resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for original_resumes (access through project ownership)
CREATE POLICY "Users can view own original resumes" ON original_resumes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own original resumes" ON original_resumes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

-- Migration 5: Keywords Analysis Table
CREATE TABLE keywords_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES resume_projects(id) ON DELETE CASCADE,
    job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    required_keywords JSONB,
    preferred_keywords JSONB,
    keyword_density JSONB,
    api_response JSONB, -- Store full API response for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on keywords_analysis
ALTER TABLE keywords_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for keywords_analysis
CREATE POLICY "Users can view own keywords analysis" ON keywords_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own keywords analysis" ON keywords_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

-- Migration 6: Optimized Resumes Table
CREATE TABLE optimized_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES resume_projects(id) ON DELETE CASCADE,
    yaml_content TEXT NOT NULL,
    pdf_file_path TEXT, -- Path to rendered PDF in Storage
    theme_used TEXT DEFAULT 'engineeringClassic',
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on optimized_resumes
ALTER TABLE optimized_resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for optimized_resumes
CREATE POLICY "Users can view own optimized resumes" ON optimized_resumes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own optimized resumes" ON optimized_resumes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own optimized resumes" ON optimized_resumes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

-- Migration 7: ATS Scores Table
CREATE TABLE ats_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES resume_projects(id) ON DELETE CASCADE,
    original_resume_id UUID REFERENCES original_resumes(id) ON DELETE SET NULL,
    optimized_resume_id UUID REFERENCES optimized_resumes(id) ON DELETE SET NULL,
    job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    score_value DECIMAL(5,2) NOT NULL,
    score_type TEXT NOT NULL CHECK (score_type IN ('original', 'optimized')),
    api_response JSONB, -- Store full API response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ats_scores
ALTER TABLE ats_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for ats_scores
CREATE POLICY "Users can view own ats scores" ON ats_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own ats scores" ON ats_scores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM resume_projects rp 
            WHERE rp.id = project_id AND rp.user_id = auth.uid()
        )
    );

-- Migration 8: Dashboard Views
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    rp.user_id,
    COUNT(rp.id) as total_projects,
    COUNT(CASE WHEN rp.status = 'completed' THEN 1 END) as completed_projects,
    AVG(CASE WHEN ats.score_type = 'optimized' THEN ats.score_value END) as avg_optimized_score,
    AVG(CASE WHEN ats.score_type = 'original' THEN ats.score_value END) as avg_original_score,
    MAX(rp.created_at) as last_activity
FROM resume_projects rp
LEFT JOIN ats_scores ats ON ats.project_id = rp.id
GROUP BY rp.user_id;

-- Enable RLS on the view
ALTER VIEW user_dashboard_stats SET (security_invoker = on);

-- Additional useful views for dashboard
CREATE OR REPLACE VIEW recent_projects AS
SELECT 
    rp.*,
    up.location,
    COUNT(ats.id) as score_count,
    MAX(ats.score_value) as best_score
FROM resume_projects rp
LEFT JOIN user_profiles up ON up.id = rp.user_id
LEFT JOIN ats_scores ats ON ats.project_id = rp.id AND ats.score_type = 'optimized'
WHERE rp.user_id = auth.uid()
GROUP BY rp.id, up.location
ORDER BY rp.created_at DESC
LIMIT 10;

ALTER VIEW recent_projects SET (security_invoker = on);