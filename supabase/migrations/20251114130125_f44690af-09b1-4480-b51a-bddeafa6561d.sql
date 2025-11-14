-- Remove foreign key constraints from metricas table
ALTER TABLE public.metricas 
DROP CONSTRAINT IF EXISTS metricas_created_by_fkey;

ALTER TABLE public.metricas 
DROP CONSTRAINT IF EXISTS metricas_updated_by_fkey;

-- Remove foreign key constraints from imoveis table
ALTER TABLE public.imoveis 
DROP CONSTRAINT IF EXISTS imoveis_created_by_fkey;

ALTER TABLE public.imoveis 
DROP CONSTRAINT IF EXISTS imoveis_updated_by_fkey;

-- The columns will remain as UUID fields but without foreign key constraints
-- This allows us to store user IDs without requiring them to exist in a specific table