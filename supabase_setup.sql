-- Create table for property comments
create table if not exists imovel_comments (
  id uuid default gen_random_uuid() primary key,
  imovel_id uuid not null,
  content text not null,
  created_by uuid,
  created_by_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for property history
create table if not exists imovel_history (
  id uuid default gen_random_uuid() primary key,
  imovel_id uuid not null,
  action text not null,
  description text,
  created_by uuid,
  created_by_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table imovel_comments enable row level security;
alter table imovel_history enable row level security;

-- Create policies (Allow authenticated users to read/write)
-- You can adjust these policies based on your specific security requirements
create policy "Authenticated users can select comments" on imovel_comments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert comments" on imovel_comments for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can select history" on imovel_history for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert history" on imovel_history for insert with check (auth.role() = 'authenticated');
