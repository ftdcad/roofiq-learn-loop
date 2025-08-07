import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIStatusIndicatorProps {
  prediction?: any;
  onStatusChange?: (isWorking: boolean) => void;
  compact?: boolean;
  autoTest?: boolean;
  cacheTtlMs?: number;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ 
  prediction, 
  onStatusChange,
  compact = false,
  autoTest = true,
  cacheTtlMs = 15 * 60 * 1000
}) => {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const { toast } = useToast();

  const testOpenAIConnection = async () => {
    setTesting(true);
    
    try {
      // Test simple OpenAI connection first
      const { data, error } = await supabase.functions.invoke('test-openai-simple');
      
      if (error) throw error;
      
      setStatus(data);
      onStatusChange?.(data.success);
      try {
        localStorage.setItem('openaiStatusCache', JSON.stringify({ timestamp: Date.now(), data }));
      } catch (e) {
        // ignore cache errors
      }
      
      if (data.success) {
        toast({
          title: "✅ OpenAI Connected!",
          description: `${data.message} | Model: ${data.model}`,
        });
      } else {
        toast({
          title: "❌ OpenAI Connection Failed",
          description: `${data.error} - ${data.fix || 'Check your API key'}`,
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

  // Auto-test OpenAI connection with cache
  useEffect(() => {
    if (!autoTest) return;

    try {
      const raw = localStorage.getItem('openaiStatusCache');
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.timestamp < cacheTtlMs) {
          setStatus(cached.data);
          onStatusChange?.(!!cached.data?.success);
          return; // fresh cache, skip network call
        }
      }
    } catch (e) {
      // ignore cache read errors
    }

    let cancelled = false;
    const run = async () => {
      setTesting(true);
      try {
        const { data, error } = await supabase.functions.invoke('test-openai-simple');
        if (error) throw error;
        if (!cancelled) {
          setStatus(data);
          onStatusChange?.(data.success);
          try {
            localStorage.setItem('openaiStatusCache', JSON.stringify({ timestamp: Date.now(), data }));
          } catch {}
        }
      } catch (err) {
        if (!cancelled) {
          setStatus({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
          onStatusChange?.(false);
        }
      } finally {
        if (!cancelled) setTesting(false);
      }
    };
    run();

    return () => { cancelled = true };
  }, [autoTest, cacheTtlMs, onStatusChange]);

  // Check if using mock data
  const isUsingMockData = prediction?.note?.includes("temporarily unavailable") || 
                         prediction?.note?.includes("enhanced AI prediction");

  const connectionState = status === null ? 'idle' : status?.success ? 'ok' : 'error';

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 rounded-md border bg-card">
        <div className="flex items-center gap-2">
          {connectionState === 'ok' ? (
            <Wifi className="w-4 h-4 text-roofiq-green" />
          ) : connectionState === 'idle' ? (
            <div className="w-4 h-4 rounded-full bg-muted" />
          ) : (
            <WifiOff className="w-4 h-4 text-destructive" />
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">OpenAI</span>
            <span className="text-xs text-muted-foreground">
              {status === null ? 'Not tested' : status.success ? `Connected (${status.model})` : 'Disconnected'}
            </span>
          </div>
        </div>
        <Button onClick={testOpenAIConnection} disabled={testing} size="sm" variant="ghost">
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Retesting
            </>
          ) : (
            'Retest'
          )}
        </Button>
      </div>
    );
  }

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
          {connectionState === 'ok' ? (
            <Wifi className="w-5 h-5 text-roofiq-green" />
          ) : connectionState === 'idle' ? (
            <div className="w-5 h-5 rounded-full bg-muted" />
          ) : (
            <WifiOff className="w-5 h-5 text-destructive" />
          )}
          
          <div>
            <div className="font-medium">OpenAI Connection</div>
            <div className="text-sm text-muted-foreground">
              {status === null ? 'Not tested' : 
               status.success ? `Connected (${status.model})` : 
               status.error}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status?.success && (
            <Badge variant="secondary" className="bg-roofiq-green/10 text-roofiq-green">
              Model: {status.model}
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
      {status && !status.success && (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <strong>Connection Issues:</strong>
            <br />
            <span className="text-sm">{status.details || status.fix}</span>
            {status.status === 401 && (
              <div className="mt-2 text-xs">
                💡 Fix: {status.fix || 'Check your OpenAI API key'}
              </div>
            )}
            {status.status === 402 && (
              <div className="mt-2 text-xs">
                💡 Fix: {status.fix || 'Add credits to your OpenAI account'}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Details */}
      {status?.success && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>✅ API Key Valid</div>
          <div>✅ Model Available: {status.model}</div>
          <div>✅ Response: "{status.message}"</div>
          <div>✅ Last Tested: {new Date(status.timestamp).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};