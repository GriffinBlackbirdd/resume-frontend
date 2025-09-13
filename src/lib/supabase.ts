import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://buvnzjfspowdttkgohtb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dm56amZzcG93ZHR0a2dvaHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODcxODMsImV4cCI6MjA3MjY2MzE4M30.QtTmwQ7-T16Vw9lqqxphi5yBOM0_oy8ep93KE5GzhMI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)