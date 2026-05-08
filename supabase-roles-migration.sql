-- =====================================================
-- מיגרציה: הוספת תמיכה ב-Super Admin ובניינים
-- =====================================================
-- הרץ את זה ב-Supabase SQL Editor
-- =====================================================

-- 1️⃣ עדכון עמודת role לתמיכה ב-super_admin
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- 2️⃣ הוספת עמודת building_id (לקשר משתמש לבניין)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS building_id UUID;

-- 3️⃣ הוספת עמודת building_name (שם הבניין)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS building_name TEXT;

-- 4️⃣ הוספת עמודת phone אם לא קיימת
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 5️⃣ יצירת אינדקס על building_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_building_id 
ON public.user_profiles(building_id);

-- 6️⃣ עדכון המשתמש שלך ל-super_admin (החלף את האימייל שלך!)
-- UPDATE public.user_profiles 
-- SET role = 'super_admin' 
-- WHERE email = 'YOUR_EMAIL@example.com';

-- =====================================================
-- בדיקה שהכל עבד
-- =====================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name IN ('role', 'building_id', 'building_name', 'phone')
ORDER BY column_name;

-- =====================================================
-- 🔥 חשוב! אחרי שתריץ את זה, עדכן את עצמך ל-super_admin:
-- 
-- UPDATE public.user_profiles 
-- SET role = 'super_admin' 
-- WHERE email = 'האימייל_שלך@example.com';
-- =====================================================
