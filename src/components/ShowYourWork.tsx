import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Calculator, Eye } from 'lucide-react';
import { RoofPrediction } from '@/types/roof-analysis';

interface ShowYourWorkProps {
  prediction: RoofPrediction;
}

export const ShowYourWork: React.FC<ShowYourWorkProps> = ({ prediction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pred = prediction.prediction;

  // Calculate breakdown (simplified for demo)
  const totalArea = Number(pred.totalArea ?? 0);
  const baseFootprint = Math.round(totalArea * 0.85);
  const overhangs = Math.round(totalArea * 0.12);
  const miscAdditions = totalArea - baseFootprint - overhangs;

  const steps = [
    {
      label: "Base building footprint",
      value: baseFootprint,
      source: "Satellite imagery analysis"
    },
    {
      label: "Estimated overhangs",
      value: overhangs,
      source: "Architectural style detection"
    },
    {
      label: "Additional structures",
      value: miscAdditions,
      source: "Facet analysis"
    }
  ];

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-roofiq-blue" />
              <span className="font-medium text-foreground">Show calculation breakdown</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3 mt-3">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {step.source}
                  </div>
                </div>
                <div className="font-mono text-sm font-medium text-foreground">
                  {Number(step.value ?? 0) > 0 ? '+' : ''}{Number(step.value ?? 0).toLocaleString()} sq ft
                </div>
              </div>
            ))}
            
            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center font-medium">
                <span className="text-foreground">Total roof area:</span>
                <span className="font-mono text-lg text-roofiq-blue">
                  {Number(pred.totalArea ?? 0).toLocaleString()} sq ft
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-roofiq-blue/5 border border-roofiq-blue/20">
            <div className="text-xs text-roofiq-blue space-y-1">
              <div className="font-medium">Analysis Details:</div>
              <div>• {pred.facets.length} roof facets detected</div>
              <div>• Predominant pitch: {pred.predominantPitch}</div>
              <div>• Confidence: {pred.confidence}%</div>
              {pred.dualModelMetadata && (
                <div>• Model agreement: {Math.round(pred.dualModelMetadata.modelAgreement * 100)}%</div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};