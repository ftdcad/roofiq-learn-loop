import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TrendingDown, Minus, TrendingUp, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InstantFeedbackProps {
  predictionId: string;
  onFeedbackSubmitted?: () => void;
}

export const InstantFeedback: React.FC<InstantFeedbackProps> = ({ 
  predictionId, 
  onFeedbackSubmitted 
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleFeedbackSubmit = async (feedbackType: string) => {
    setIsSubmitting(true);
    setSelectedFeedback(feedbackType);

    try {
      const { error } = await supabase
        .from('prediction_feedback')
        .insert({
          prediction_id: predictionId,
          feedback_type: feedbackType,
          user_feedback: userComment || null
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Feedback submitted",
        description: "Thank you! Your feedback helps improve our predictions.",
      });
      
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-4 border-roofiq-green/20 bg-roofiq-green/5">
        <div className="text-center text-roofiq-green">
          ✓ Thank you for your feedback!
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="text-center">
        <h4 className="text-sm font-medium text-foreground mb-2">
          Does this estimate look right?
        </h4>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedbackSubmit('too_low')}
            disabled={isSubmitting}
            className="flex items-center gap-1 hover:bg-roofiq-red/10 hover:border-roofiq-red/20"
          >
            <TrendingDown className="w-4 h-4 text-roofiq-red" />
            Too Low
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedbackSubmit('about_right')}
            disabled={isSubmitting}
            className="flex items-center gap-1 hover:bg-roofiq-green/10 hover:border-roofiq-green/20"
          >
            <Minus className="w-4 h-4 text-roofiq-green" />
            About Right
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedbackSubmit('too_high')}
            disabled={isSubmitting}
            className="flex items-center gap-1 hover:bg-roofiq-amber/10 hover:border-roofiq-amber/20"
          >
            <TrendingUp className="w-4 h-4 text-roofiq-amber" />
            Too High
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="w-3 h-3" />
          Optional comment:
        </div>
        <Textarea
          placeholder="Any specific feedback about the estimate..."
          value={userComment}
          onChange={(e) => setUserComment(e.target.value)}
          className="text-sm resize-none"
          rows={2}
        />
      </div>
    </Card>
  );
};