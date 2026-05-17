'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

interface PhaseExitFeedbackProps {
  onSubmit?: (data: FeedbackData) => void;
}

export interface FeedbackData {
  analyticsFeedback: string;
  aiRecommendationDecision: 'accepted' | 'rejected' | 'pending';
  additionalComments: string;
}

export function PhaseExitFeedback({ onSubmit }: PhaseExitFeedbackProps) {
  const [analyticsFeedback, setAnalyticsFeedback] = useState('');
  const [aiDecision, setAiDecision] = useState<'accepted' | 'rejected' | 'pending'>('pending');
  const [additionalComments, setAdditionalComments] = useState('');

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        analyticsFeedback,
        aiRecommendationDecision: aiDecision,
        additionalComments,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Self-Service Analytics Beta Feedback
          </CardTitle>
          <CardDescription>
            Please provide your feedback on the Self-Service Analytics Beta feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="analytics-feedback">
              What aspects of the analytics feature work well, and what could be improved?
            </Label>
            <Textarea
              id="analytics-feedback"
              placeholder="Share your experience with the analytics dashboard, query builder, and visualization tools..."
              value={analyticsFeedback}
              onChange={(e) => setAnalyticsFeedback(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations Decision</CardTitle>
          <CardDescription>
            Review and accept or reject the AI-generated recommendations for this phase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={aiDecision}
            onValueChange={(value) => setAiDecision(value as 'accepted' | 'rejected' | 'pending')}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="accepted" id="accepted" />
              <Label htmlFor="accepted" className="flex items-center gap-2 cursor-pointer">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Accept AI Recommendations
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rejected" id="rejected" />
              <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer">
                <XCircle className="h-4 w-4 text-red-500" />
                Reject AI Recommendations
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pending" id="pending" />
              <Label htmlFor="pending" className="cursor-pointer">
                Defer Decision (Review Later)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Comments</CardTitle>
          <CardDescription>
            Any other feedback or notes for the phase exit review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Optional: Add any additional comments or context for the review team..."
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => {
          setAnalyticsFeedback('');
          setAiDecision('pending');
          setAdditionalComments('');
        }}>
          Clear Form
        </Button>
        <Button onClick={handleSubmit}>
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}