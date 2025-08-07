-- Learning Events Tracking Table
CREATE TABLE public.learning_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('prediction', 'comparison', 'improvement', 'error_analysis')),
  accuracy_delta DECIMAL,
  patterns_learned JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Learning events are publicly viewable" 
ON public.learning_events 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create learning events" 
ON public.learning_events 
FOR INSERT 
WITH CHECK (true);

-- Quality Assurance Checks Table
CREATE TABLE public.quality_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL,
  physically_possible BOOLEAN DEFAULT true,
  internal_consistency BOOLEAN DEFAULT true,
  outlier_detection BOOLEAN DEFAULT false,
  confidence_calibration DECIMAL,
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quality_checks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Quality checks are publicly viewable" 
ON public.quality_checks 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create quality checks" 
ON public.quality_checks 
FOR INSERT 
WITH CHECK (true);

-- System Health Metrics Table  
CREATE TABLE public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_predictions INTEGER DEFAULT 0,
  average_processing_time_ms INTEGER,
  error_rate DECIMAL,
  learning_velocity DECIMAL,
  cost_per_prediction DECIMAL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(metric_date)
);

-- Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System metrics are publicly viewable" 
ON public.system_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update system metrics" 
ON public.system_metrics 
FOR ALL 
USING (true);