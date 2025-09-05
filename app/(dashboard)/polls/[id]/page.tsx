import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getPollById } from '@/app/lib/actions/poll-actions';
import PollVoteForm from './PollVoteForm';

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch poll data using the updated action
  const { poll, error: pollError } = await getPollById(id);
  
  if (pollError || !poll) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>Error loading poll: {pollError || 'Poll not found'}</p>
          <Link href="/polls" className="text-blue-600 hover:underline mt-2 inline-block">
            &larr; Back to Polls
          </Link>
        </div>
      </div>
    );
  }

  // Calculate total votes
  const totalVotes = poll.options ? poll.options.reduce((sum, option) => sum + (option.votes || 0), 0) : 0;

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/polls/${id}/edit`}>Edit Poll</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          {poll.description && <CardDescription>{poll.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <PollVoteForm poll={poll} />
          
          <div className="space-y-4 mt-6">
            <h3 className="font-medium">Current Results:</h3>
            {poll.options && poll.options.map((option) => (
              <div key={option.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{option.option_text}</span>
                  <span>{getPercentage(option.votes || 0)}% ({option.votes || 0} votes)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${getPercentage(option.votes || 0)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            <div className="text-sm text-slate-500 pt-2">
              Total votes: {totalVotes}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            Copy Link
          </Button>
          <Button variant="outline" className="flex-1">
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
}