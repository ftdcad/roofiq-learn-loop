import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, Loader2, Home, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DualUploadLearningProps {
  predictionId: string;
  onUploadComplete: (data: any, type: 'roof' | 'footprint') => void;
}

export const DualUploadLearning: React.FC<DualUploadLearningProps> = ({
  predictionId,
  onUploadComplete
}) => {
  const [roofDragOver, setRoofDragOver] = useState(false);
  const [footprintDragOver, setFootprintDragOver] = useState(false);
  const [roofUploading, setRoofUploading] = useState(false);
  const [footprintUploading, setFootprintUploading] = useState(false);
  const [roofProgress, setRoofProgress] = useState(0);
  const [footprintProgress, setFootprintProgress] = useState(0);
  const [roofFile, setRoofFile] = useState<File | null>(null);
  const [footprintFile, setFootprintFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File, type: 'roof' | 'footprint') => {
    const setUploading = type === 'roof' ? setRoofUploading : setFootprintUploading;
    const setProgress = type === 'roof' ? setRoofProgress : setFootprintProgress;
    const setFile = type === 'roof' ? setRoofFile : setFootprintFile;

    setUploading(true);
    setFile(file);
    setProgress(0);

    // Validate file type and size
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const validForType = type === 'roof' ? isPdf : (isPdf || isImage);
    if (!validForType) {
      toast({ title: 'Invalid file type', description: type === 'roof' ? 'Please upload a PDF report' : 'Please upload a PDF or image file', variant: 'destructive' });
      setUploading(false);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: 'File too large', description: 'Maximum size is 10MB', variant: 'destructive' });
      setUploading(false);
      return;
    }

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 1) Upload the file to Supabase Storage (private bucket)
      const bucket = 'validation-reports';
      const storagePath = `${predictionId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) {
        throw uploadError;
      }

      // 2) Notify the edge function with metadata only
      const correlationId = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('process-validation-report', {
        body: {
          analysisId: predictionId,
          fileName: file.name,
          fileSize: file.size,
          fileType: type,
          storageBucket: bucket,
          storagePath,
          correlationId
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      const message = type === 'roof' 
        ? "Roof measurements processed successfully"
        : "Property footprint data processed successfully";

      toast({
        title: "File processed",
        description: message,
      });

      onUploadComplete(data, type);

    } catch (error) {
      console.error(`Error uploading ${type} file:`, error);
      const description = error instanceof Error ? error.message : `Failed to process ${type} file`;
      toast({
        title: "Upload failed",
        description,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProgress(0);
        setFile(null);
      }, 2000);
    }
  };

  const createDragHandlers = (type: 'roof' | 'footprint') => {
    const setDragOver = type === 'roof' ? setRoofDragOver : setFootprintDragOver;
    
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        const validFile = files.find(file => {
          const isPdf = file.type === 'application/pdf';
          const isImage = file.type.startsWith('image/');
          return type === 'roof' ? isPdf : (isPdf || isImage);
        });
        
        if (validFile) {
          handleFileUpload(validFile, type);
        } else {
          toast({
            title: 'Invalid file type',
            description: type === 'roof' ? 'Please upload a PDF report' : 'Please upload a PDF or image file',
            variant: 'destructive',
          });
        }
      }
    };
  };


  const roofHandlers = createDragHandlers('roof');
  const footprintHandlers = createDragHandlers('footprint');

  const UploadZone = ({ 
    type, 
    isUploading, 
    isDragOver, 
    progress, 
    file, 
    handlers 
  }: {
    type: 'roof' | 'footprint';
    isUploading: boolean;
    isDragOver: boolean;
    progress: number;
    file: File | null;
    handlers: any;
  }) => {
    const isRoof = type === 'roof';
    const title = isRoof ? 'Roof Measurement Report' : 'Property Footprint Data';
    const subtitle = isRoof ? 'Professional measurements for validation' : 'Building foundation for overhang learning';
    const icon = isRoof ? PieChart : Home;
    const IconComponent = icon;
    
    if (isUploading) {
      return (
        <Card className="p-6 border-roofiq-blue/20 bg-roofiq-blue/5 h-full">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-roofiq-blue animate-spin" />
              <span className="font-medium text-roofiq-blue">Processing {title}</span>
            </div>
            
            {file && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {progress}% complete
                </div>
              </div>
            )}
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 h-full">
        <div className="space-y-4 h-full flex flex-col">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-roofiq-blue/10">
                <IconComponent className="w-5 h-5 text-roofiq-blue" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer flex-1 flex flex-col justify-center ${
              isDragOver 
                ? 'border-roofiq-blue bg-roofiq-blue/5' 
                : 'border-border hover:border-roofiq-blue/50 hover:bg-roofiq-blue/5'
            }`}
            {...handlers}
            onClick={() => document.getElementById(`${type}-file-input`)?.click()}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">
                {isRoof ? '📄 Drop PDF Here' : '🏠 Drop File Here'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isRoof ? 'PDF files up to 10MB' : 'PDF or image files up to 10MB'}
              </div>
            </div>
            
            <input
              id={`${type}-file-input`}
              type="file"
              accept={isRoof ? ".pdf" : ".pdf,image/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, type);
              }}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground">Accepts:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              {isRoof ? (
                <>
                  <div>• EagleView, Hover, RoofR</div>
                  <div>• QuickSquare, Physical</div>
                </>
              ) : (
                <>
                  <div>• Tax Records, Appraiser</div>
                  <div>• Zillow, Floor Plans</div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-roofiq-green/10 border border-roofiq-green/20">
            <CheckCircle className="w-3 h-3 text-roofiq-green" />
            <div className="text-xs text-roofiq-green">
              {isRoof ? 'Improves accuracy by ~0.2%' : 'Learns overhang patterns'}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-roofiq-green/10">
            <Upload className="w-6 h-6 text-roofiq-green" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Help Us Learn
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload data to improve AI accuracy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UploadZone
          type="roof"
          isUploading={roofUploading}
          isDragOver={roofDragOver}
          progress={roofProgress}
          file={roofFile}
          handlers={roofHandlers}
        />
        
        <UploadZone
          type="footprint"
          isUploading={footprintUploading}
          isDragOver={footprintDragOver}
          progress={footprintProgress}
          file={footprintFile}
          handlers={footprintHandlers}
        />
      </div>
    </div>
  );
};