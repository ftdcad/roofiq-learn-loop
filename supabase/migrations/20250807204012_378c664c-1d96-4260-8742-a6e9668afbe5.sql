-- Add consensus and source metadata columns to roof_analyses
ALTER TABLE public.roof_analyses
  ADD COLUMN IF NOT EXISTS model_agreement numeric,
  ADD COLUMN IF NOT EXISTS consensus_confidence text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'dual-model';