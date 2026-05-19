/**
 * Tenant Hub — single panel per tenant: payments, messages, details.
 */

let currentHubTenant = null;
let currentHubYear = new Date().getFullYear();

const HUB_MONTHS_HE = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

function openTenantHub(tenantId) {
    const tenant = appState.tenants.find(function (t) { return t.id === tenantId; });
    if (!tenant) return;

    currentHubTenant = tenant;
    currentHubYear = new Date().getFullYear();
    renderTenantHub();
    showModal('tenantHubModal');
}

function renderTenantHub() {
    const tenant = currentHubTenant;
    if (!tenant) return;

    const badgeClass = typeof getTenantStatusBadgeClass === 'function'
        ? getTenantStatusBadgeClass(tenant.status) : 'pending';
    const statusLabel = typeof getStatusText === 'function'
        ? getStatusText(tenant.status) : tenant.status;

    const nameEl = document.getElementById('hubTenantName');
    const aptEl = document.getElementById('hubApartment');
    const badgeEl = document.getElementById('hubStatusBadge');
    if (nameEl) nameEl.textContent = tenant.name;
    if (aptEl) aptEl.textContent = tenant.apartment;
    if (badgeEl) {
        badgeEl.textContent = statusLabel;
        badgeEl.className = 'status-badge status-' + badgeClass;
    }

    const contact = document.getElementById('hubContactStrip');
    if (contact) {
        contact.innerHTML =
            '<span><i class="fas fa-phone"></i> ' + (tenant.phone || '—') + '</span>' +
            '<span><i class="fas fa-envelope"></i> ' + (tenant.email || '—') + '</span>' +
            (tenant.notes ? '<span class="hub-notes"><i class="fas fa-sticky-note"></i> ' + tenant.notes + '</span>' : '');
    }

    const paidMonths = typeof getPaidMonthsCount === 'function'
        ? getPaidMonthsCount(tenant, currentHubYear) : 0;
    const debt = Math.max(0, (12 - paidMonths) * tenant.monthlyAmount);

    const paidEl = document.getElementById('hubPaidMonths');
    const debtEl = document.getElementById('hubDebt');
    const amountEl = document.getElementById('hubMonthlyAmount');
    const yearEl = document.getElementById('hubYear');
    if (paidEl) paidEl.textContent = paidMonths + '/12';
    if (debtEl) debtEl.textContent = '₪' + debt.toLocaleString();
    if (amountEl) amountEl.textContent = '₪' + Number(tenant.monthlyAmount).toLocaleString();
    if (yearEl) yearEl.textContent = String(currentHubYear);

    renderHubMonthlyStrip();
    renderHubPaymentsList();
}

function renderHubMonthlyStrip() {
    const strip = document.getElementById('hubMonthlyStrip');
    const tenant = currentHubTenant;
    if (!strip || !tenant) return;

    strip.innerHTML = '';
    for (let month = 1; month <= 12; month++) {
        const paid = typeof isMonthPaid === 'function'
            ? isMonthPaid(tenant, currentHubYear, month) : false;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hub-month-pill' + (paid ? ' paid' : ' unpaid');
        btn.title = HUB_MONTHS_HE[month - 1] + ' ' + currentHubYear + (paid ? ' — שולם' : ' — לא שולם');
        btn.textContent = HUB_MONTHS_HE[month - 1];
        btn.onclick = function () { hubToggleMonth(month); };
        strip.appendChild(btn);
    }
}

function hubToggleMonth(month) {
    const tenant = currentHubTenant;
    if (!tenant || typeof setMonthPaidStatus !== 'function') return;

    const paid = isMonthPaid(tenant, currentHubYear, month);
    setMonthPaidStatus(tenant.id, currentHubYear, month, !paid, {
        notes: paid ? '' : 'עודכן ממרכז הדייר'
    });
    saveDataToStorage();
    renderTenantHub();
    if (typeof renderTenantsTable === 'function') renderTenantsTable();
    if (typeof renderAnnualPaymentsMatrix === 'function') renderAnnualPaymentsMatrix();
    if (typeof updateAllStatistics === 'function') updateAllStatistics();
}

function renderHubPaymentsList() {
    const list = document.getElementById('hubPaymentsList');
    const tenant = currentHubTenant;
    if (!list || !tenant) return;

    const payments = appState.payments
        .filter(function (p) { return p.tenantId === tenant.id; })
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
        .slice(0, 8);

    if (payments.length === 0) {
        list.innerHTML = '<p class="hub-empty">אין תשלומים רשומים</p>';
        return;
    }

    list.innerHTML = payments.map(function (p) {
        const label = p.isAnnual ? 'שנתי' : 'חודשי';
        return '<div class="hub-payment-row">' +
            '<span>' + (typeof formatDate === 'function' ? formatDate(p.date) : p.date) + '</span>' +
            '<span>₪' + p.amount + '</span>' +
            '<span class="hub-pay-type">' + label + '</span>' +
            '</div>';
    }).join('');
}

function setupTenantHubListeners() {
    document.getElementById('closeTenantHubModal')?.addEventListener('click', function () {
        hideModal('tenantHubModal');
    });
    document.getElementById('hubMonthlyBtn')?.addEventListener('click', function () {
        if (!currentHubTenant) return;
        hideModal('tenantHubModal');
        openMonthlyTracking(currentHubTenant.id);
    });
    document.getElementById('hubAnnualBtn')?.addEventListener('click', function () {
        if (!currentHubTenant) return;
        hideModal('tenantHubModal');
        openAnnualPaymentForTenant(currentHubTenant.id);
    });
    document.getElementById('hubWhatsappBtn')?.addEventListener('click', function () {
        if (!currentHubTenant) return;
        hideModal('tenantHubModal');
        openWhatsappModal(currentHubTenant, 'billing');
    });
    document.getElementById('hubEditBtn')?.addEventListener('click', function () {
        if (!currentHubTenant) return;
        hideModal('tenantHubModal');
        editTenant(currentHubTenant.id);
    });
    document.getElementById('hubPrevYear')?.addEventListener('click', function () {
        currentHubYear--;
        renderTenantHub();
    });
    document.getElementById('hubNextYear')?.addEventListener('click', function () {
        currentHubYear++;
        renderTenantHub();
    });
}

window.openTenantHub = openTenantHub;
window.renderTenantHub = renderTenantHub;
