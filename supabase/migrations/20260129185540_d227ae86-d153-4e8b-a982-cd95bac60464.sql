-- Add unique constraint on name column for ON CONFLICT to work
ALTER TABLE lead_pipeline_stages ADD CONSTRAINT lead_pipeline_stages_name_unique UNIQUE (name);