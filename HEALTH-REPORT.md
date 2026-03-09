# 🔍 Health Report – Building Management SaaS
## Static Analysis & Logical Audit

**Date:** March 8, 2025  
**Scope:** Authentication, Document Management, Tenant Communication, Payment Tracking, Error Handling  
**Methodology:** Deep static analysis of HTML and JS files, Supabase + Stripe flows

---

## Executive Summary

| Category | Critical | High | Medium |
|----------|----------|------|--------|
| Authentication & Roles | 1 | 2 | 0 |
| Document Management | 0 | 1 | 2 |
| Tenant Communication | 1 | 0 | 0 |
| Payment Tracking | 1 | 0 | 1 |
| Error Handling | 2 | 3 | 2 |

---

## 1. Authentication & Roles

### 🔴 CRITICAL: Create-Checkout API – No Server-Side User Verification

**File:** `api/create-checkout.js`  
**Issue:** `userId` and `userEmail` are taken from `req.body` with no verification against the authenticated session. A malicious user can pass another user's `userId` and create a Stripe checkout that charges their own card but assigns the subscription to the victim's account.

**Current code (lines 55–68):**
```javascript
const { planType, userId, userEmail } = req.body;

if (!planType || !PLAN_CONFIG[planType]) {
    return res.status(400).json({ error: 'Invalid plan type...' });
}

if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
}
```

**Fix:**
```javascript
const { planType, userId, userEmail } = req.body;

// Verify the request comes from an authenticated user matching the userId
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization' });
}
const token = authHeader.split(' ')[1];

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user || user.id !== userId) {
    return res.status(403).json({ error: 'User ID does not match authenticated user' });
}
```

Client must send: `Authorization: Bearer <session.access_token>` and use the logged-in user's ID.

---

### 🟠 HIGH: Index.html – Blocked Users Not Redirected

**File:** `index.html` (inline script ~line 1828)  
**Issue:** When `accessCheck.reason === 'blocked'`, the user remains on the page with `hasAccess: false` but no redirect. Blocked users should be sent to `blocked.html`.

**Current code:**
```javascript
if (!accessCheck.hasAccess) {
    if (accessCheck.reason === 'not_logged_in') {
        window.location.href = 'login.html';
        return;
    }
    if (accessCheck.reason === 'expired' ||
        accessCheck.reason === 'trial_expired' || 
        accessCheck.reason === 'subscription_expired') {
        window.location.href = 'pricing.html?expired=true';
        return;
    }
}
```

**Fix:**
```javascript
if (!accessCheck.hasAccess) {
    if (accessCheck.reason === 'not_logged_in') {
        window.location.href = 'login.html';
        return;
    }
    if (accessCheck.reason === 'blocked') {
        window.location.href = 'blocked.html';
        return;
    }
    if (accessCheck.reason === 'expired' ||
        accessCheck.reason === 'trial_expired' || 
        accessCheck.reason === 'subscription_expired') {
        window.location.href = 'pricing.html?expired=true';
        return;
    }
}
```

---

### 🟠 HIGH: Supabase Client – Possible Null Reference

**File:** `js/supabase-client.js`  
**Issue:** `getSupabase()` returns `window.supabaseClient`, which can be `undefined` if `config.js` fails or loads after this module. `getCurrentSession()` and `getCurrentUser()` call `getSupabase().auth`, causing `TypeError: Cannot read property 'auth' of undefined`.

**Current code (lines 45–52):**
```javascript
async function getCurrentSession() {
    try {
        const { data: { session }, error } = await getSupabase().auth.getSession();
```

**Fix:**
```javascript
async function getCurrentSession() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            console.error('Supabase client not initialized');
            return null;
        }
        const { data: { session }, error } = await supabase.auth.getSession();
```

Apply the same pattern in `getCurrentUser()` and any other function that calls `getSupabase()` without a null check.

---

## 2. Document Management

### 🟠 HIGH: generateReceipt – Missing Null Check on DOM Element

**File:** `js/app.js` (around line 4571)  
**Issue:** `document.getElementById('receiptContent')` may return `null` if the element is missing or not yet rendered. Assigning to `receiptContent.innerHTML` throws and can crash the app.

**Current code:**
```javascript
const receiptContent = document.getElementById('receiptContent');
const currentDate = new Date().toLocaleDateString('he-IL');
receiptContent.innerHTML = `...`;
```

**Fix:**
```javascript
const receiptContent = document.getElementById('receiptContent');
if (!receiptContent) {
    console.error('Receipt content element not found');
    showToast('שגיאה: רכיב הקבלה לא נמצא', 'error');
    return;
}
const currentDate = new Date().toLocaleDateString('he-IL');
receiptContent.innerHTML = `...`;
```

---

### 🟡 MEDIUM: generateNoticePdf – Missing Null Check

**File:** `js/app.js` (around line 3902)  
**Issue:** `document.getElementById('noticePreview')` can be `null`. `html2canvas(element)` will throw.

**Current code:**
```javascript
const element = document.getElementById('noticePreview');

try {
    const canvas = await html2canvas(element, {
```

**Fix:**
```javascript
const element = document.getElementById('noticePreview');
if (!element) {
    showToast('שגיאה: תצוגת ההודעה לא נמצאה', 'error');
    return;
}

try {
    const canvas = await html2canvas(element, {
```

---

### 🟡 MEDIUM: printNotice – No Check for Popup Blocker

**File:** `js/app.js` (around line 3948)  
**Issue:** `window.open('', '', ...)` can return `null` if the browser blocks popups. Code then calls `printWindow.document.write`, causing a crash.

**Current code:**
```javascript
setTimeout(() => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const previewContent = document.getElementById('noticePreview').innerHTML;
    printWindow.document.write(`...`);
```

**Fix:**
```javascript
setTimeout(() => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
        showToast('לא ניתן לפתוח חלון הדפסה. אפשרו חלונות קופצים.', 'error');
        return;
    }
    const previewEl = document.getElementById('noticePreview');
    if (!previewEl) {
        printWindow.close();
        return;
    }
    const previewContent = previewEl.innerHTML;
    printWindow.document.write(`...`);
```

---

## 3. Tenant Communication

### 🔴 CRITICAL: openWhatsappModal – Wrong Argument Type (Tenant vs ID)

**File:** `js/app.js` (line 718 and `openWhatsappModal` definition)  
**Issue:** In the tenant cards template, `openWhatsappModal('${tenant.id}')` passes a string ID, but `openWhatsappModal` expects a tenant object. `appState.currentTenantForWhatsapp` is set to the ID string, so `generateBillingMessage(tenant)` receives a string and accesses `tenant.name`, producing "שלום undefined".

**Current code (tenant card template):**
```javascript
onclick="openWhatsappModal('${tenant.id}')"
```

**Current function:**
```javascript
function openWhatsappModal(tenant, messageType = 'billing') {
    appState.currentTenantForWhatsapp = tenant;
```

**Fix (option A – resolve by ID in the function):**
```javascript
function openWhatsappModal(tenantOrId, messageType = 'billing') {
    const tenant = typeof tenantOrId === 'string'
        ? appState.tenants.find(t => t.id === tenantOrId)
        : tenantOrId;
    if (!tenant) {
        showToast('דייר לא נמצא', 'error');
        return;
    }
    appState.currentTenantForWhatsapp = tenant;
```

**Fix (option B – pass tenant object from template):**  
Pass the tenant object via a data attribute or a wrapper function, e.g. `onclick="openWhatsappModalById('${tenant.id}')"` with a small helper that looks up the tenant and calls `openWhatsappModal`.

---

## 4. Payment Tracking

### 🔴 CRITICAL: Stripe Webhook – No Idempotency

**File:** `api/stripe-webhook.js`  
**Issue:** Stripe may deliver the same webhook more than once. Each delivery triggers a new insert into `payments`. There is no idempotency key or check for an existing record, so duplicate rows can be created.

**Current code (handleCheckoutCompleted, lines 156–168):**
```javascript
await supabaseAdmin.from('payments').insert({
    user_id: userId,
    amount: session.amount_total / 100,
    ...
});
```

**Fix:** Use a unique constraint and/or idempotency key:
```javascript
// Option 1: Use Stripe session ID as unique key
const { error } = await supabaseAdmin.from('payments').upsert({
    user_id: userId,
    amount: session.amount_total / 100,
    currency: session.currency?.toUpperCase() || 'ILS',
    payment_method: 'stripe',
    transaction_id: session.payment_intent || session.subscription,
    stripe_session_id: session.id,  // add column, unique
    status: 'completed',
    subscription_type: planType,
    metadata: { ... },
}, {
    onConflict: 'stripe_session_id',
    ignoreDuplicates: true
});

// Option 2: Check before insert
const { data: existing } = await supabaseAdmin.from('payments')
    .select('id')
    .eq('metadata->>stripe_session_id', session.id)
    .single();
if (!existing) {
    await supabaseAdmin.from('payments').insert({...});
}
```

---

### 🟡 MEDIUM: savePayment – No Duplicate Check

**File:** `js/app.js` (function `savePayment`)  
**Issue:** No validation to prevent recording the same payment twice (same tenant, date, and amount). Double-click or accidental resubmit can create duplicate entries.

**Fix:**
```javascript
function savePayment(formData) {
    const tenantId = formData.get('tenantId');
    const tenant = appState.tenants.find(t => t.id === tenantId);
    
    if (!tenant) {
        showToast('שגיאה: דייר לא נמצא', 'error');
        return;
    }
    
    const amount = parseFloat(formData.get('amount'));
    const date = formData.get('date');
    
    // Duplicate check
    const isDuplicate = appState.payments.some(p =>
        p.tenantId === tenantId &&
        p.date === date &&
        Math.abs(p.amount - amount) < 0.01
    );
    if (isDuplicate) {
        showToast('תשלום זה כבר נרשם קודם לכן', 'warning');
        return;
    }
    
    const payment = {
        id: generateId(),
        tenantId: tenantId,
        amount: amount,
        date: date,
        ...
    };
```

---

## 5. Error Handling – DOM and Crash Risks

### 🔴 CRITICAL: recordPayment – Null Reference on Select

**File:** `js/app.js` (function `recordPayment`, ~line 1058)  
**Issue:** `document.getElementById('paymentTenant')` can be `null`. Assigning to `select.innerHTML` throws.

**Current code:**
```javascript
function recordPayment() {
    const select = document.getElementById('paymentTenant');
    select.innerHTML = '<option value="">-- בחר דייר --</option>' + ...
```

**Fix:**
```javascript
function recordPayment() {
    const select = document.getElementById('paymentTenant');
    if (!select) {
        console.error('Payment tenant select not found');
        showToast('שגיאה: טופס התשלום לא נמצא', 'error');
        return;
    }
    select.innerHTML = '<option value="">-- בחר דייר --</option>' + ...
```

---

### 🔴 CRITICAL: admin.js unblockUser – Null Reference on User

**File:** `js/admin.js` (function `unblockUser`, lines 101–120)  
**Issue:** `const { data: user } = await getSupabase()...` can leave `user` as `null` if the query fails or returns no row. Accessing `user.subscription_type` throws.

**Current code:**
```javascript
const { data: user } = await getSupabase()
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

let newStatus = USER_STATUS.ACTIVE;
if (user.subscription_type === 'trial') {
```

**Fix:**
```javascript
const { data: user, error: userError } = await getSupabase()
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

if (userError || !user) {
    throw new Error('משתמש לא נמצא');
}

let newStatus = USER_STATUS.ACTIVE;
if (user.subscription_type === 'trial') {
```

---

### 🟠 HIGH: updateStatistics – No Null Checks on Stat Elements

**File:** `js/app.js` (function `updateStatistics`)  
**Issue:** `document.getElementById('totalTenants')` etc. can be `null` if the dashboard section is not rendered. `textContent` assignment will throw.

**Current code:**
```javascript
document.getElementById('totalTenants').textContent = totalTenants;
document.getElementById('paidTenants').textContent = paidTenants;
document.getElementById('pendingTenants').textContent = pendingTenants;
document.getElementById('totalRevenue').textContent = `₪${totalRevenue.toLocaleString()}`;
```

**Fix:**
```javascript
const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
};
setText('totalTenants', totalTenants);
setText('paidTenants', paidTenants);
setText('pendingTenants', pendingTenants);
setText('totalRevenue', `₪${totalRevenue.toLocaleString()}`);
```

---

### 🟠 HIGH: setupNavigation – Null Reference on Sidebar

**File:** `js/app.js` (function `setupNavigation`, ~line 299)  
**Issue:** If `sidebar` or `mobileMenuToggle` is missing, `sidebar.classList.toggle` throws.

**Current code:**
```javascript
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}
```

**Fix:**
```javascript
if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}
```

---

### 🟡 MEDIUM: updateWhatsappMessage – Null DOM Elements

**File:** `js/app.js` (function `updateWhatsappMessage`)  
**Issue:** `document.getElementById('whatsappTemplate')`, `whatsappMessage`, `customMessageArea` can be `null` when the modal is not present. Accessing `.value` or `.style` throws.

**Fix:** Add null checks at the start:
```javascript
function updateWhatsappMessage() {
    const templateEl = document.getElementById('whatsappTemplate');
    const messageArea = document.getElementById('whatsappMessage');
    const customArea = document.getElementById('customMessageArea');
    if (!templateEl || !messageArea || !customArea) return;

    const template = templateEl.value;
    // ... rest of function
```

---

## Appendix: Additional Notes

1. **Hardcoded super_admin email**  
   `boaz65sa@gmail.com` appears in `auth.js`, `admin.html`, and `index.html`. Consider moving this to config or Supabase metadata.

2. **auth.js vs supabase-client.js**  
   Both define `initSupabase`, `getCurrentUser`, and `checkUserAccess`. Ensure loading order and responsibilities are clear to avoid subtle bugs.

3. **Admin panel access**  
   `admin.html` restricts access to `super_admin` only. If building admins (`role: 'admin'`) should access a limited admin view, a separate page or conditional UI is needed.

4. **Supabase RLS**  
   Ensure RLS policies on `user_profiles`, `payments`, and related tables enforce the intended access control; client checks are not sufficient on their own.

---

*Report generated by static analysis. Re-validate after applying fixes.*
