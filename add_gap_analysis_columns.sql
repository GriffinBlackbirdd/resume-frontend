-- Add gap analysis fields to projects table
ALTER TABLE projects 
ADD COLUMN has_gap_analysis BOOLEAN DEFAULT FALSE,
ADD COLUMN gap_analysis_files TEXT[] DEFAULT NULL;

-- Update existing records to have gap analysis as false
UPDATE projects SET has_gap_analysis = FALSE WHERE has_gap_analysis IS NULL;

-- Add an index for faster queries on gap analysis status
CREATE INDEX idx_projects_has_gap_analysis ON projects(has_gap_analysis);