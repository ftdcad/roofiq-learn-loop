-- Create private bucket for validation report uploads (if not exists)
insert into storage.buckets (id, name, public)
select 'validation-reports', 'validation-reports', false
where not exists (
  select 1 from storage.buckets where id = 'validation-reports'
);

-- Allow anonymous clients to upload files into this bucket
create policy "Anyone can upload validation reports"
on storage.objects
for insert
with check (bucket_id = 'validation-reports');

-- Add columns to store footprint uploads on analyses (idempotent)
alter table public.roof_analyses
  add column if not exists footprint_data jsonb,
  add column if not exists footprint_upload_date timestamptz;