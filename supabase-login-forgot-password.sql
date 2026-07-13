-- =====================================================
-- התחברות + שכחתי סיסמה — מה שצריך ב-SQL (Supabase)
-- =====================================================
-- חשוב:
-- • התחברות במייל/סיסמה ואיפוס סיסמה נשלחים דרך Supabase Auth (טבלת auth.users)
--   — זה לא דורש טבלאות משלך, אבל כן דורש הגדרות ב-Dashboard (ראה סוף הקובץ).
-- • האפליקציה קוראת לטבלה public.user_profiles אחרי כניסה — בלי טבלה/RLS נכונים
--   תראה שגיאות או חוסר גישה.
-- הרץ ב-SQL Editor: Dashboard → SQL → New query → Run
-- =====================================================

-- ---------- 1) טבלת user_profiles (מינימום שהקוד מצפה לו) ----------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'blocked', 'expired')),
    subscription_type TEXT CHECK (subscription_type IN ('trial', 'monthly', 'yearly', 'lifetime')),
    subscription_start TIMESTAMPTZ,
    subscription_expires TIMESTAMPTZ,
    trial_ends TIMESTAMPTZ,
    has_lifetime_access BOOLEAN DEFAULT FALSE,
    -- הקוד ב-auth.js שומר כאן מזהה טקסטואלי מהכתובת (לא UUID)
    building_id TEXT,
    building_name TEXT,
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- עמודות נוספות אם הטבלה כבר נוצרה בגרסה ישנה יותר
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS has_lifetime_access BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS building_id TEXT,
    ADD COLUMN IF NOT EXISTS building_name TEXT,
    ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS trial_ends TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- ---------- 2) RLS + פוליסיות (קריטי: גם INSERT לפרופיל שלי — ל-upsert מהדפדפן) ----------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

-- מאפשר יצירת שורת פרופיל בכניסה ראשונה (OAuth / אחרי אימות מייל)
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- ---------- 3) טריגר: יצירת פרופיל אוטומטית בהרשמה (מקום ל-upsert בצד לקוח) ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        phone,
        role,
        status,
        trial_ends,
        subscription_start,
        building_name,
        building_id
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            ''
        ),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        CASE
            WHEN NEW.email IN ('boaz65sa@gmail.com', 'chef@roxoneilat.co.il') THEN 'super_admin'
            ELSE 'user'
        END,
        CASE
            WHEN NEW.email IN ('boaz65sa@gmail.com', 'chef@roxoneilat.co.il') THEN 'active'
            ELSE 'trial'
        END,
        CASE
            WHEN NEW.email IN ('boaz65sa@gmail.com', 'chef@roxoneilat.co.il') THEN NULL
            ELSE NOW() + INTERVAL '14 days'
        END,
        NOW(),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'building_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'building_id'), '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.user_profiles.full_name),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- הרשאות לטריגר לקרוא auth (בדרך כלל כבר קיים ב-Supabase)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- סיום — אם הופיעה הודעת Success, הכל תקין.
-- (אל תדביק לכאן שורות כמו "0 rows" מתוצאות שאילתה קודמת)
-- מה לסדר ב-Dashboard (לא ב-SQL) — שכחתי סיסמה והתחברות
-- =====================================================
-- Authentication → URL Configuration
--   Site URL = כתובת האתר החיה (https://...)
--   Redirect URLs = אותה כתובת + https://.../reset-password.html
--
-- Authentication → Providers → Email
--   אם SMTP לא מוגדר — מיילי איפוס לא יישלחו. אפשר להפעיל את שירות המייל של Supabase
--   או לחבר Custom SMTP.
--
-- Authentication → Email Templates → Reset password
--   ודא שהקישור ב-template תואם ל-PKCE אם נדרש (ברירת מחדל של Supabase תקינה ברוב המקרים).
--
-- אם "Confirm email" דלוק להרשמה — עד לאישור המייל לא תוכל להתחבר בסיסמה.
-- =====================================================
