# Supabase Setup Guide for ALX Polly

This guide will help you set up Supabase for the ALX Polly polling application.

## Prerequisites

- A [Supabase](https://supabase.com) account
- Node.js installed on your machine
- Basic understanding of SQL

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in to your account
2. Click "New Project"
3. Choose your organization
4. Fill in your project details:
   - **Name**: `alx-polly` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. You'll find your project credentials:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Project API Keys**:
     - `anon` `public` key (safe to use in browsers)
     - `service_role` `secret` key (keep this secret!)

## Step 3: Configure Environment Variables

1. In your project root, you should already have a `.env.local` file
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: For admin operations (keep this secret!)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Important**: Never commit your actual API keys to version control!

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from your project root
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- `polls` table for storing poll questions and options
- `votes` table for storing user votes
- Row Level Security (RLS) policies for data protection
- Indexes for better performance
- A view for poll results

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your authentication settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/**` for development
3. For production, update these URLs to your actual domain

### Email Authentication (Default)

Email authentication is enabled by default. Users can sign up with email and password.

### Optional: Social Authentication

To enable social logins (Google, GitHub, etc.):
1. Go to **Authentication** → **Providers**
2. Enable the providers you want
3. Configure each provider with their respective credentials

## Step 6: Test Your Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser
4. Try to register a new account
5. Create a test poll
6. Verify that data appears in your Supabase dashboard under **Table Editor**

## Step 7: Verify Database Tables

In your Supabase dashboard:
1. Go to **Table Editor**
2. You should see two tables:
   - `polls` - Contains poll questions and options
   - `votes` - Contains user votes
3. The `auth.users` table (built-in) contains user authentication data

## Troubleshooting

### Common Issues

**"Invalid API key" error:**
- Double-check your API keys in `.env.local`
- Make sure you're using the `anon` key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after changing environment variables

**"relation does not exist" error:**
- Make sure you've run the SQL schema from `supabase-schema.sql`
- Check the **Table Editor** to confirm tables were created

**Authentication not working:**
- Verify your Site URL and Redirect URLs in Authentication settings
- Check that email confirmation is properly configured

**RLS (Row Level Security) issues:**
- The schema includes RLS policies, but you may need to adjust them based on your needs
- Check the **Authentication** → **Policies** section in your dashboard

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [Next.js with Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## Production Deployment

When deploying to production:

1. Update your environment variables on your hosting platform
2. Update the Site URL and Redirect URLs in Supabase Authentication settings
3. Consider using the `service_role` key for server-side operations that require elevated permissions
4. Review and adjust RLS policies as needed for your security requirements

## Security Best Practices

- Never expose your `service_role` key in client-side code
- Always use Row Level Security (RLS) policies
- Regularly review your authentication and authorization settings
- Use HTTPS in production
- Keep your Supabase project and dependencies up to date

---

**Next Steps**: Once your Supabase setup is complete, you can start using the ALX Polly application to create polls, vote, and explore the security features of the application.