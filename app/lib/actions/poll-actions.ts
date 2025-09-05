"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!title || options.length < 2) {
    return { error: "Please provide a title and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  // Insert the poll first
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert([
      {
        user_id: user.id,
        title,
        description: description || null,
      },
    ])
    .select()
    .single();

  if (pollError) {
    return { error: pollError.message };
  }

  // Insert the poll options
  const pollOptions = options.map((option_text) => ({
    poll_id: poll.id,
    option_text,
  }));

  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(pollOptions);

  if (optionsError) {
    return { error: optionsError.message };
  }

  revalidatePath("/polls");
  redirect("/polls");
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  // Get all polls created by the user
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (pollsError) return { polls: [], error: pollsError.message };

  // For each poll, get its options
  const pollsWithOptions = await Promise.all(
    polls.map(async (poll) => {
      const { data: options, error: optionsError } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll.id);

      if (optionsError) {
        console.error(`Error fetching options for poll ${poll.id}:`, optionsError);
        return { ...poll, options: [] };
      }

      return { ...poll, options: options.map(opt => opt.option_text) };
    })
  );

  return { polls: pollsWithOptions ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Get the poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (pollError) return { poll: null, error: pollError.message };

  // Get the poll options
  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", id);

  if (optionsError) {
    return { poll: null, error: optionsError.message };
  }

  // Get vote counts for each option
  const { data: votes, error: voteCountsError } = await supabase
    .from("votes")
    .select("option_id")
    .eq("poll_id", id);

  if (voteCountsError) {
    console.error("Error fetching vote counts:", voteCountsError);
  }

  // Create a map of option_id to vote count
  const voteCountMap = (votes || []).reduce((acc, curr) => {
    acc[curr.option_id] = (acc[curr.option_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Combine poll with options and vote counts
  const pollWithOptions = {
    ...poll,
    options: options.map(option => ({
      id: option.id,
      option_text: option.option_text,
      votes: voteCountMap[option.id] || 0
    }))
  };

  return { poll: pollWithOptions, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally require login to vote
  // if (!user) return { error: 'You must be logged in to vote.' };

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_id: optionId,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!title || options.length < 2) {
    return { error: "Please provide a title and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Update the poll title and description
  const { error: pollUpdateError } = await supabase
    .from("polls")
    .update({ title, description: description || null })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (pollUpdateError) {
    return { error: pollUpdateError.message };
  }

  // Get existing options to compare with new ones
  const { data: existingOptions, error: fetchOptionsError } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId);

  if (fetchOptionsError) {
    return { error: fetchOptionsError.message };
  }

  // Delete all existing options and create new ones
  // This is simpler than trying to update existing ones and handle additions/removals
  const { error: deleteOptionsError } = await supabase
    .from("poll_options")
    .delete()
    .eq("poll_id", pollId);

  if (deleteOptionsError) {
    return { error: deleteOptionsError.message };
  }

  // Insert new options
  const newOptions = options.map((option_text) => ({
    poll_id: pollId,
    option_text,
  }));

  const { error: insertOptionsError } = await supabase
    .from("poll_options")
    .insert(newOptions);

  if (insertOptionsError) {
    return { error: insertOptionsError.message };
  }

  revalidatePath(`/polls/${pollId}`);
  revalidatePath("/polls");
  return { error: null };
}

// GET ALL POLLS (for admin)
export async function getAllPolls() {
  const supabase = await createClient();
  
  // Get all polls
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (pollsError) return { polls: [], error: pollsError.message };

  // For each poll, get its options
  const pollsWithOptions = await Promise.all(
    polls.map(async (poll) => {
      const { data: options, error: optionsError } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll.id);

      if (optionsError) {
        console.error(`Error fetching options for poll ${poll.id}:`, optionsError);
        return { ...poll, options: [] };
      }

      return { ...poll, options };
    })
  );

  return { polls: pollsWithOptions ?? [], error: null };
}

// GET POLL RESULTS
export async function getPollResults(pollId: string) {
  const supabase = await createClient();
  
  // Use the poll_results view if available
  const { data, error } = await supabase
    .from("poll_results")
    .select("*")
    .eq("id", pollId)
    .single();

  if (error) {
    // Fallback if the view doesn't exist
    return getPollById(pollId);
  }

  return { poll: data, error: null };
}
