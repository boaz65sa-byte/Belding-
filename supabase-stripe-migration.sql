-- =====================================================
-- Stripe Integration Migration
-- Add Stripe-related columns to user_profiles table
-- =====================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =====================================================

-- 1️⃣ Add Stripe customer ID column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- 2️⃣ Add subscription status column (for Stripe subscription state)
-- Note: You already have a 'status' column, this is specifically for Stripe sync
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'
CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing'));

-- 3️⃣ Add plan type column (tracks which Stripe price/plan)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT
CHECK (plan_type IN ('monthly', 'yearly', 'lifetime', NULL));

-- 4️⃣ Add lifetime access flag
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_lifetime_access BOOLEAN DEFAULT FALSE;

-- 5️⃣ Add Stripe subscription ID for managing recurring subscriptions
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 6️⃣ Add subscription period end date (for recurring plans)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- =====================================================
-- Create indexes for faster lookups
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id 
ON public.user_profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status 
ON public.user_profiles(subscription_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_has_lifetime_access 
ON public.user_profiles(has_lifetime_access);

-- =====================================================
-- Update RLS policies to allow webhook updates
-- =====================================================

-- Allow service role (used by webhooks) to update profiles
CREATE POLICY "Service role can update all profiles"
ON public.user_profiles FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to select profiles (for webhook lookups)
CREATE POLICY "Service role can select all profiles"
ON public.user_profiles FOR SELECT
USING (auth.role() = 'service_role');

-- =====================================================
-- Helper function to check subscription access
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record RECORD;
BEGIN
    SELECT 
        subscription_status,
        has_lifetime_access,
        current_period_end,
        trial_ends,
        status
    INTO profile_record
    FROM public.user_profiles
    WHERE id = user_uuid;

    -- Lifetime access always grants access
    IF profile_record.has_lifetime_access = TRUE THEN
        RETURN TRUE;
    END IF;

    -- Active subscription grants access
    IF profile_record.subscription_status = 'active' THEN
        RETURN TRUE;
    END IF;

    -- Trialing grants access
    IF profile_record.subscription_status = 'trialing' THEN
        RETURN TRUE;
    END IF;

    -- Check legacy trial period
    IF profile_record.status = 'trial' AND profile_record.trial_ends > NOW() THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Verification query - run after migration
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name IN (
        'stripe_customer_id',
        'subscription_status', 
        'plan_type',
        'has_lifetime_access',
        'stripe_subscription_id',
        'current_period_end'
    )
ORDER BY column_name;

-- If you see 6 rows, the migration was successful! ✅
