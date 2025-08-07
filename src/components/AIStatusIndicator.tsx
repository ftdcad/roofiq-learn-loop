import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIStatusIndicatorProps {
  prediction?: any;
  onStatusChange?: (isWorking: boolean) => void;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ 
  prediction, 
  onStatusChange 
}) => {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const { toast } = useToast();

  const testOpenAIConnection = async () => {
    setTesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-openai');
      
      if (error) throw error;
      
      setStatus(data);
      onStatusChange?.(data.working);
      
      if (data.working) {
        toast({
          title: "✅ OpenAI Connected!",
          description: `Model: ${data.model} | GPT-4 Vision: ${data.hasGPT4Vision ? 'Available' : 'Not Available'}`,
        });
      } else {
        toast({
          title: "❌ OpenAI Connection Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing OpenAI:', error);
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  // Check if using mock data
  const isUsingMockData = prediction?.note?.includes("temporarily unavailable") || 
                         prediction?.note?.includes("enhanced AI prediction");

  return (
    <div className="space-y-4">
      {/* Status Alert */}
      {isUsingMockData ? (
        <Alert className="border-roofiq-amber bg-roofiq-amber/5">
          <AlertTriangle className="h-4 w-4 text-roofiq-amber" />
          <AlertDescription className="text-roofiq-amber">
            <strong>⚠️ DEMO MODE ACTIVE</strong>
            <br />
            <span className="text-sm">Analysis using mock data - OpenAI not connected</span>
          </AlertDescription>
        </Alert>
      ) : prediction ? (
        <Alert className="border-roofiq-green bg-roofiq-green/5">
          <CheckCircle className="h-4 w-4 text-roofiq-green" />
          <AlertDescription className="text-roofiq-green">
            <strong>✅ Live AI Analysis Active</strong>
            <br />
            <span className="text-sm">Using real GPT-4 Vision analysis</span>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          {status?.working ? (
            <Wifi className="w-5 h-5 text-roofiq-green" />
          ) : status === null ? (
            <div className="w-5 h-5 rounded-full bg-muted" />
          ) : (
            <WifiOff className="w-5 h-5 text-roofiq-amber" />
          )}
          
          <div>
            <div className="font-medium">OpenAI Connection</div>
            <div className="text-sm text-muted-foreground">
              {status === null ? 'Not tested' : 
               status.working ? `Connected (${status.model})` : 
               status.error}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status?.working && (
            <Badge variant="secondary" className="bg-roofiq-green/10 text-roofiq-green">
              GPT-4 Vision: {status.hasGPT4Vision ? 'Available' : 'Not Available'}
            </Badge>
          )}
          
          <Button
            onClick={testOpenAIConnection}
            disabled={testing}
            size="sm"
            variant="outline"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>
      </div>

      {/* Error Details */}
      {status && !status.working && (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <strong>Connection Issues:</strong>
            <br />
            <span className="text-sm">{status.details}</span>
            {status.status === 401 && (
              <div className="mt-2 text-xs">
                💡 Fix: Check your OpenAI API key in Supabase Dashboard → Settings → API
              </div>
            )}
            {status.status === 402 && (
              <div className="mt-2 text-xs">
                💡 Fix: Add credits to your OpenAI account at platform.openai.com
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Details */}
      {status?.working && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>✅ API Key Valid</div>
          <div>✅ Models Available: {status.availableModels}</div>
          <div>✅ Chat Completion: "{status.testMessage}"</div>
          <div>✅ Last Tested: {new Date(status.timestamp).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};