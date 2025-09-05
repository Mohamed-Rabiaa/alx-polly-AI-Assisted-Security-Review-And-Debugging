'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { submitVote } from '@/app/lib/actions/poll-actions';
import { Poll } from '@/app/lib/types';

interface PollVoteFormProps {
  poll: Poll;
}

export default function PollVoteForm({ poll }: PollVoteFormProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error: voteError } = await submitVote(poll.id, selectedOption);
      
      if (voteError) {
        setError(voteError);
      } else {
        setHasVoted(true);
        // Refresh the page to show updated results
        window.location.reload();
      }
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
        <p>Thank you for voting! Your vote has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Cast your vote:</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {poll.options && poll.options.map((option) => (
          <div 
            key={option.id} 
            className={`p-3 border rounded-md cursor-pointer transition-colors ${
              selectedOption === option.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'hover:bg-slate-50'
            }`}
            onClick={() => setSelectedOption(option.id)}
          >
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="poll-option"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                className="text-blue-600"
              />
              <span>{option.option_text}</span>
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        onClick={handleVote} 
        disabled={!selectedOption || isSubmitting} 
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Vote'}
      </Button>
    </div>
  );
}