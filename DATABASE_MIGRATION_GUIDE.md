# Database Migration Guide

## Issue
You're getting the error "Could not find the 'question' column of 'polls' in the schema cache" because your database schema has column names that don't match what the application expects:

- Your database has `title` and `description` columns, but the app expects a `question` column
- Your database has `option_text` column in poll_options, but the app expects `text`
- The schema structure needs to be aligned with the application code

## Solution
You need to run the corrected migration script to fix the column names and structure. Follow these steps:

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (the one with URL: `https://otckibggiybcssvtbwmk.supabase.co`)

### Step 2: Open SQL Editor
1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click "New Query" to create a new SQL query

### Step 3: Run the Migration Script
1. Copy the entire contents of the file `migration-to-normalized-schema.sql` (created in your project root)
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

### Step 4: Verify Migration
After running the migration, verify it worked by running this query:

```sql
-- Check if the new structure exists
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('polls', 'poll_options', 'votes')
ORDER BY table_name, ordinal_position;
```

You should see:
- `polls` table with columns: `id`, `user_id`, `question`, `created_at`, `updated_at` (no more `title` or `description`)
- `poll_options` table with columns: `id`, `poll_id`, `text`, `display_order`, `created_at`, `updated_at` (no more `option_text`)
- `votes` table with columns: `id`, `poll_id`, `option_id`, `user_id`, `created_at` (no more `option_index`)

### Step 5: Verify the Fix
After running the migration, try creating a new poll in your application. The "question column not found" error should be resolved.

The migration script automatically:
- Removes old `title` and `description` columns from polls
- Removes old `option_text` column from poll_options  
- Removes old `option_index` column from votes (if it exists)

## What This Migration Does

1. **Fixes polls table**: Renames `title` + `description` columns to `question` (combines them if both exist)
2. **Fixes poll_options table**: Renames `option_text` column to `text`
3. **Updates votes table**: Ensures `option_id` column exists and migrates from `option_index` if needed
4. **Adds proper indexes**: Improves query performance
5. **Sets up RLS policies**: Maintains security with proper policies

## After Migration

Once the migration is complete:
1. Your existing polls and votes will be preserved
2. The application will work with the new normalized schema
3. You can create new polls without the "question column" error

## Troubleshooting

If you encounter any issues:
1. Check the SQL Editor for error messages
2. Ensure you have the necessary permissions on your Supabase project
3. If you have existing data, the migration will preserve it
4. Contact support if you need help with the migration process

## Alternative: Reset Database (If No Important Data)

If you don't have important data to preserve, you can also:
1. Go to Settings > Database in your Supabase dashboard
2. Reset your database
3. Run the `supabase-schema-updated.sql` file instead

This will give you a clean database with the new schema structure.