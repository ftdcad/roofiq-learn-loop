-- Week 2: Add feedback tracking table
CREATE TABLE public.prediction_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('too_low', 'about_right', 'too_high')),
  user_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create feedback" 
ON public.prediction_feedback 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Feedback is publicly viewable" 
ON public.prediction_feedback 
FOR SELECT 
USING (true);

-- Week 3: Add neighborhood analysis cache
CREATE TABLE public.neighborhood_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  radius_miles NUMERIC NOT NULL DEFAULT 0.5,
  average_roof_area NUMERIC,
  median_roof_area NUMERIC,
  total_samples INTEGER DEFAULT 0,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(address, radius_miles)
);

-- Enable RLS
ALTER TABLE public.neighborhood_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view neighborhood analysis" 
ON public.neighborhood_analysis 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create neighborhood analysis" 
ON public.neighborhood_analysis 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update neighborhood analysis" 
ON public.neighborhood_analysis 
FOR UPDATE 
USING (true);