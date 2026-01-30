
-- Migration: add_manual_override_to_imoveis_arbo
alter table imoveis_arbo 
add column if not exists manual_override boolean default false;

-- Index for performance
create index if not exists idx_imoveis_arbo_manual_override on imoveis_arbo(manual_override);
