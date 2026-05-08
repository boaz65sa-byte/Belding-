-- =====================================================
-- 🔧 הגדרה מלאה של מסד הנתונים - Supabase
-- =====================================================
-- הרץ את כל הקוד הזה ב-Supabase SQL Editor
-- =====================================================

-- 1️⃣ יצירת טבלת user_profiles (אם לא קיימת)
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
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    has_lifetime_access BOOLEAN DEFAULT FALSE,
    building_id UUID,
    building_name TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ יצירת טבלת payments (אם לא קיימת)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ILS',
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    subscription_type TEXT,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3️⃣ יצירת טבלת activity_log (אם לא קיימת)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ יצירת אינדקסים
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_building_id ON public.user_profiles(building_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);

-- 5️⃣ הפעלת RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 6️⃣ מחיקת פוליסות קיימות (אם יש)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- 7️⃣ יצירת פוליסות RLS
-- משתמשים יכולים לראות את הפרופיל שלהם
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- משתמשים יכולים לעדכן את הפרופיל שלהם
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- אדמינים יכולים לראות את כל הפרופילים
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- אדמינים יכולים לעדכן את כל הפרופילים
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- משתמשים יכולים לראות את התשלומים שלהם
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- אדמינים יכולים לראות את כל התשלומים
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- אדמינים יכולים להוסיף תשלומים
CREATE POLICY "Admins can insert payments" ON public.payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 8️⃣ פונקציה ליצירת פרופיל אוטומטית בהרשמה
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, phone, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'user',
        'trial'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9️⃣ יצירת טריגר להרשמה אוטומטית
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 🔟 עדכון בועז ל-super_admin
UPDATE public.user_profiles 
SET role = 'super_admin', status = 'active'
WHERE email = 'boaz65sa@gmail.com';

-- אם המשתמש לא קיים בטבלה, צור אותו
INSERT INTO public.user_profiles (id, email, role, status)
SELECT id, email, 'super_admin', 'active'
FROM auth.users 
WHERE email = 'boaz65sa@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';

-- =====================================================
-- ✅ בדיקה שהכל עבד
-- =====================================================
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM public.user_profiles
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'activity_log', COUNT(*) FROM public.activity_log;

-- בדיקת המשתמש שלך
SELECT id, email, role, status, full_name 
FROM public.user_profiles 
WHERE email = 'boaz65sa@gmail.com';
