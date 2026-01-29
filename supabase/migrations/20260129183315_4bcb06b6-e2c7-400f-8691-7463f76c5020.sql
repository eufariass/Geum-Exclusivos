-- Create table for property comments
create table if not exists public.imovel_comments (
  id uuid default gen_random_uuid() primary key,
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  content text not null,
  created_by uuid,
  created_by_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for property history
create table if not exists public.imovel_history (
  id uuid default gen_random_uuid() primary key,
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  action text not null,
  description text,
  created_by uuid,
  created_by_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.imovel_comments enable row level security;
alter table public.imovel_history enable row level security;

-- Create policies for imovel_comments
create policy "Authenticated users can select comments" 
on public.imovel_comments for select 
using (auth.role() = 'authenticated');

create policy "Authenticated users can insert comments" 
on public.imovel_comments for insert 
with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete comments" 
on public.imovel_comments for delete 
using (auth.role() = 'authenticated');

-- Create policies for imovel_history
create policy "Authenticated users can select history" 
on public.imovel_history for select 
using (auth.role() = 'authenticated');

create policy "Authenticated users can insert history" 
on public.imovel_history for insert 
with check (auth.role() = 'authenticated');