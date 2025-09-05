"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";
import { Poll } from "@/app/lib/types";

interface PollActionsProps {
  poll: Poll;
}

export default function PollActions({ poll }: PollActionsProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const result = await deletePoll(poll.id);
      
      if (!result.error) {
        // Refresh the page to show updated list
        window.location.reload();
      } else {
        alert('Failed to delete poll: ' + result.error);
      }
    } catch (error) {
      console.error('Delete poll error:', error);
      alert('Failed to delete poll. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.title}
              </h2>
              <p className="text-slate-500">{poll.options ? poll.options.length : 0} options</p>
            </div>
          </div>
        </div>
      </Link>
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      )}
    </div>
  );
}
