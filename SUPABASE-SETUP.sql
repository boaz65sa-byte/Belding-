-- =====================================================
-- Vaad 2025 - Supabase Setup Script
-- בועז סעדה © 2026
-- =====================================================
-- הוראות הרצה:
-- 1. היכנס ל-Supabase Dashboard
-- 2. לחץ על "SQL Editor" בתפריט השמאלי
-- 3. לחץ "+ New Query"
-- 4. העתק והדבק את כל הקוד הזה
-- 5. לחץ "Run" (או Ctrl+Enter)
-- =====================================================

-- 1️⃣ טבלת פרופילי משתמשים
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    
    -- ניהול הרשאות
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'blocked', 'expired')),
    
    -- ניהול מנויים
    subscription_type TEXT CHECK (subscription_type IN ('trial', 'monthly', 'yearly', 'lifetime')),
    subscription_start TIMESTAMPTZ,
    subscription_expires TIMESTAMPTZ,
    trial_ends TIMESTAMPTZ,
    
    -- מעקב פעילות
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- מטא-דאטה
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2️⃣ טבלת תשלומים
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- פרטי תשלום
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ILS',
    payment_method TEXT, -- 'credit_card', 'paypal', 'stripe', 'manual'
    transaction_id TEXT,
    
    -- סטטוס
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- סוג מנוי
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly', 'yearly', 'lifetime')),
    
    -- תאריכים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    
    -- מטא-דאטה (למידע נוסף מספק התשלום)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3️⃣ טבלת דיירים (קשורה למשתמש)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- פרטי דייר
    name TEXT NOT NULL,
    apartment TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    id_number TEXT,
    
    -- פרטי דיור
    entry_date DATE,
    monthly_payment DECIMAL(10, 2) DEFAULT 0,
    
    -- סטטוס
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- תאריכים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- מטא-דאטה
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4️⃣ טבלת תשלומי דיירים
CREATE TABLE IF NOT EXISTS public.tenant_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- פרטי תשלום
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    
    -- סטטוס
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    
    -- תאריכים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- הערות
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5️⃣ טבלת הוצאות
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- פרטי הוצאה
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    
    -- קבלה/מסמך
    receipt_number TEXT,
    receipt_url TEXT,
    
    -- תאריכים
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- מטא-דאטה
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6️⃣ טבלת לוג פעילות (לאדמין)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    -- פעולה
    action TEXT NOT NULL, -- 'login', 'logout', 'payment', 'tenant_add', etc.
    entity_type TEXT, -- 'user', 'tenant', 'payment', etc.
    entity_id UUID,
    
    -- פרטים
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    
    -- תאריך
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 🔒 Row Level Security (RLS) Policies
-- =====================================================

-- הפעלת RLS על כל הטבלאות
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ✅ מדיניות user_profiles
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- ✅ מדיניות payments
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage all payments"
    ON public.payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- ✅ מדיניות tenants
CREATE POLICY "Users can view own tenants"
    ON public.tenants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tenants"
    ON public.tenants FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tenants"
    ON public.tenants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- ✅ מדיניות tenant_payments
CREATE POLICY "Users can view own tenant payments"
    ON public.tenant_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tenant payments"
    ON public.tenant_payments FOR ALL
    USING (auth.uid() = user_id);

-- ✅ מדיניות expenses
CREATE POLICY "Users can view own expenses"
    ON public.expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own expenses"
    ON public.expenses FOR ALL
    USING (auth.uid() = user_id);

-- ✅ מדיניות activity_log
CREATE POLICY "Users can view own activity"
    ON public.activity_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity"
    ON public.activity_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all activity"
    ON public.activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 📊 אינדקסים לביצועים
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

CREATE INDEX IF NOT EXISTS idx_tenant_payments_user_id ON public.tenant_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant_id ON public.tenant_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_status ON public.tenant_payments(status);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_date ON public.expenses(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- =====================================================
-- 🎬 טריגרים אוטומטיים
-- =====================================================

-- טריגר ליצירת פרופיל משתמש אוטומטי לאחר רישום
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, trial_ends, subscription_start, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        NOW() + INTERVAL '14 days',
        NOW(),
        'trial'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- קישור הטריגר לטבלת auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- טריגר לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- החלת הטריגר על הטבלאות הרלוונטיות
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_payments_updated_at ON public.tenant_payments;
CREATE TRIGGER update_tenant_payments_updated_at
    BEFORE UPDATE ON public.tenant_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ✅ הכל מוכן!
-- =====================================================

-- בדיקה סופית: ספירת טבלאות שנוצרו
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'user_profiles', 
        'payments', 
        'tenants', 
        'tenant_payments', 
        'expenses', 
        'activity_log'
    )
ORDER BY tablename;

-- אם רואה 6 טבלאות - הכל תקין! ✅
