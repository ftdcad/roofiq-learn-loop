-- Create roof analyses table to store all predictions and comparisons
CREATE TABLE public.roof_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  satellite_image_url TEXT,
  prediction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- AI Prediction Data
  ai_prediction JSONB NOT NULL,
  ai_confidence DECIMAL(5,2),
  
  -- EagleView Data (when uploaded)
  eagleview_data JSONB,
  eagleview_upload_date TIMESTAMP WITH TIME ZONE,
  eagleview_report_id TEXT,
  
  -- Comparison Results
  comparison_results JSONB,
  
  -- Learning Data
  area_error_percent DECIMAL(5,2),
  overall_accuracy_score DECIMAL(5,2),
  
  -- Metadata
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roof_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a beta learning system)
CREATE POLICY "Roof analyses are publicly viewable" 
ON public.roof_analyses 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create roof analyses" 
ON public.roof_analyses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update roof analyses" 
ON public.roof_analyses 
FOR UPDATE 
USING (true);

-- Create training progress table
CREATE TABLE public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_comparisons INTEGER NOT NULL DEFAULT 0,
  target_comparisons INTEGER NOT NULL DEFAULT 3000,
  average_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  facet_detection_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  area_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  pitch_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  estimated_days_to_target INTEGER,
  model_version TEXT NOT NULL DEFAULT '3.0.0',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for training progress
CREATE POLICY "Training progress is publicly viewable" 
ON public.training_progress 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update training progress" 
ON public.training_progress 
FOR ALL 
USING (true);

-- Insert initial training progress record
INSERT INTO public.training_progress (
  total_comparisons,
  target_comparisons,
  average_accuracy,
  facet_detection_rate,
  area_accuracy,
  pitch_accuracy,
  estimated_days_to_target,
  model_version
) VALUES (
  0,
  3000,
  0.0,
  0.0,
  0.0,
  0.0,
  365,
  '3.0.0'
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_roof_analyses_updated_at
BEFORE UPDATE ON public.roof_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_roof_analyses_address ON public.roof_analyses(address);
CREATE INDEX idx_roof_analyses_prediction_date ON public.roof_analyses(prediction_date);
CREATE INDEX idx_roof_analyses_accuracy ON public.roof_analyses(overall_accuracy_score);
CREATE INDEX idx_roof_analyses_eagleview ON public.roof_analyses(eagleview_report_id) WHERE eagleview_report_id IS NOT NULL;