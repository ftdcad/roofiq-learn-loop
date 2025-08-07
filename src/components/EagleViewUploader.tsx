import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EagleViewUploaderProps {
  predictionId: string;
  onUploadComplete: (eagleViewData: any) => void;
}

export const EagleViewUploader: React.FC<EagleViewUploaderProps> = ({
  predictionId,
  onUploadComplete
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadedFile(file);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Process the EagleView PDF
      const { data, error } = await supabase.functions.invoke('process-eagleview', {
        body: {
          predictionId,
          fileName: file.name,
          fileSize: file.size,
          // In production, would upload file to storage first
          fileData: await fileToBase64(file)
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      toast({
        title: "EagleView report processed",
        description: "Successfully extracted roof measurements",
      });

      onUploadComplete(data);

    } catch (error) {
      console.error('Error uploading EagleView file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process EagleView report",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadedFile(null);
      }, 2000);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  if (isUploading) {
    return (
      <Card className="p-6 border-roofiq-blue/20 bg-roofiq-blue/5">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-roofiq-blue animate-spin" />
            <span className="font-medium text-roofiq-blue">Processing EagleView Report</span>
          </div>
          
          {uploadedFile && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {uploadedFile.name}
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {uploadProgress}% complete
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Extracting roof measurements</div>
            <div>• Analyzing structural details</div>
            <div>• Preparing comparison data</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload EagleView Report
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload your EagleView PDF to compare AI predictions with professional measurements
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-roofiq-blue bg-roofiq-blue/5' 
              : 'border-border hover:border-roofiq-blue/50 hover:bg-roofiq-blue/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              Drop your EagleView PDF here or click to browse
            </div>
            <div className="text-xs text-muted-foreground">
              Supports PDF files up to 10MB
            </div>
          </div>
          
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-3">
          <div className="text-xs font-medium text-foreground">What we'll extract:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-roofiq-green" />
              <span className="text-muted-foreground">Roof measurements</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-roofiq-green" />
              <span className="text-muted-foreground">Facet dimensions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-roofiq-green" />
              <span className="text-muted-foreground">Pitch calculations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-roofiq-green" />
              <span className="text-muted-foreground">Total square footage</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-roofiq-amber/10 border border-roofiq-amber/20">
          <AlertTriangle className="w-4 h-4 text-roofiq-amber" />
          <div className="text-xs text-roofiq-amber">
            This data helps improve AI accuracy for future predictions
          </div>
        </div>
      </div>
    </Card>
  );
};