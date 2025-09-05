'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { deletePoll } from '@/app/lib/actions/poll-actions';

interface AdminPollActionsProps {
  pollId: string;
}

export default function AdminPollActions({ pollId }: AdminPollActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const result = await deletePoll(pollId);
      
      if (!result.error) {
        // Refresh the page to show updated list
        window.location.reload();
      } else {
        alert('Failed to delete poll: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete poll. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}