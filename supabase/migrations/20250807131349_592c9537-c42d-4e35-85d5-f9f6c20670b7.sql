-- Rename EagleView database columns to use generic validation terminology
ALTER TABLE public.roof_analyses 
RENAME COLUMN eagleview_data TO validation_data;

ALTER TABLE public.roof_analyses 
RENAME COLUMN eagleview_upload_date TO validation_upload_date;

ALTER TABLE public.roof_analyses 
RENAME COLUMN eagleview_report_id TO validation_report_id;

-- Update existing index to reflect new column name
DROP INDEX IF EXISTS idx_roof_analyses_eagleview;
CREATE INDEX idx_roof_analyses_validation ON public.roof_analyses(validation_report_id) WHERE validation_report_id IS NOT NULL;