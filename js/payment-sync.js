/**
 * Payment sync — monthlyPayments is the source of truth for paid/unpaid months.
 * appState.payments holds history (receipts, annual lump sums, audit trail).
 */

function ensureTenantMonthlyPayments(tenant, year) {
    if (!tenant.monthlyPayments) tenant.monthlyPayments = {};
    if (!tenant.monthlyPayments[year]) tenant.monthlyPayments[year] = {};
}

function isMonthPaid(tenant, year, month) {
    return !!(tenant.monthlyPayments?.[year]?.[month]?.paid);
}

function getPaidMonthsCount(tenant, year) {
    let count = 0;
    const yearData = tenant.monthlyPayments?.[year] || {};
    for (let m = 1; m <= 12; m++) {
        if (yearData[m]?.paid) count++;
    }
    return count;
}

function findPaymentRecordForMonth(tenantId, year, month) {
    return appState.payments.find(p => {
        if (p.tenantId !== tenantId) return false;
        const paymentDate = new Date(p.date);
        return paymentDate.getFullYear() === year &&
            (paymentDate.getMonth() + 1) === month &&
            !p.isAnnual;
    });
}

/** Unified read — monthlyPayments first, then payment records */
function getPaymentForMonth(tenant, year, month) {
    if (tenant.monthlyPayments?.[year]?.[month]?.paid) {
        const monthlyData = tenant.monthlyPayments[year][month];
        return {
            amount: monthlyData.amount || tenant.monthlyAmount,
            date: monthlyData.date || `${year}-${String(month).padStart(2, '0')}-15`,
            tenantId: tenant.id,
            fromMonthly: true
        };
    }

    const payment = appState.payments.find(p => {
        if (p.tenantId !== tenant.id || p.isAnnual) return false;
        const paymentDate = new Date(p.date);
        return paymentDate.getFullYear() === year &&
            (paymentDate.getMonth() + 1) === month;
    });

    if (payment) {
        return {
            amount: payment.amount,
            date: payment.date,
            tenantId: tenant.id,
            paymentId: payment.id,
            fromMonthly: false
        };
    }

    return null;
}

function updateTenantStatusFromMonthly(tenant, year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year !== currentYear) return;

    const yearData = tenant.monthlyPayments?.[currentYear] || {};
    if (yearData[currentMonth]?.paid) {
        tenant.status = 'paid';
        tenant.lastPayment = yearData[currentMonth].date;
        return;
    }

    const paidCount = getPaidMonthsCount(tenant, currentYear);
    if (paidCount === 0) {
        tenant.status = 'pending';
    } else {
        const hasUnpaidPast = Object.keys(yearData).some(m => {
            const monthNum = parseInt(m, 10);
            return monthNum < currentMonth && !yearData[m]?.paid;
        });
        tenant.status = hasUnpaidPast ? 'overdue' : 'pending';
    }
}

function setMonthPaidStatus(tenantId, year, month, isPaid, options = {}) {
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (!tenant) return false;

    ensureTenantMonthlyPayments(tenant, year);

    if (isPaid) {
        const amount = options.amount ?? tenant.monthlyAmount;
        const date = options.date ?? new Date(year, month - 1, Math.min(15, 28)).toISOString();
        tenant.monthlyPayments[year][month] = {
            paid: true,
            amount,
            date: typeof date === 'string' ? date : new Date(date).toISOString()
        };

        if (!options.skipPaymentRecord) {
            let payment = findPaymentRecordForMonth(tenantId, year, month);
            if (!payment) {
                payment = {
                    id: typeof generateId === 'function' ? generateId() : 'p_' + Date.now(),
                    tenantId,
                    tenantName: tenant.name,
                    apartment: tenant.apartment,
                    amount,
                    date: tenant.monthlyPayments[year][month].date,
                    method: options.method || 'other',
                    notes: options.notes || 'סנכרון ממעקב חודשי',
                    syncedFromMonthly: true,
                    createdAt: new Date().toISOString()
                };
                appState.payments.push(payment);
            } else {
                payment.amount = amount;
                payment.date = tenant.monthlyPayments[year][month].date;
                if (options.method) payment.method = options.method;
            }
        }
    } else {
        delete tenant.monthlyPayments[year][month];
        const payment = findPaymentRecordForMonth(tenantId, year, month);
        if (payment && (payment.syncedFromMonthly || options.removePaymentRecord)) {
            appState.payments = appState.payments.filter(p => p.id !== payment.id);
        }
    }

    updateTenantStatusFromMonthly(tenant, year);
    return true;
}

function applyAnnualPayment(tenantId, paymentDate, method, notes) {
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (!tenant) return null;

    const dateObj = new Date(paymentDate);
    const year = dateObj.getFullYear();
    const annualAmount = tenant.monthlyAmount * 12;

    for (let month = 1; month <= 12; month++) {
        setMonthPaidStatus(tenantId, year, month, true, {
            amount: tenant.monthlyAmount,
            date: new Date(year, month - 1, 1).toISOString(),
            method,
            skipPaymentRecord: true
        });
    }

    const payment = {
        id: typeof generateId === 'function' ? generateId() : 'a_' + Date.now(),
        tenantId,
        tenantName: tenant.name,
        apartment: tenant.apartment,
        amount: annualAmount,
        date: paymentDate,
        method: method || 'other',
        notes: `תשלום שנתי (12 חודשים) - ${notes || ''}`.trim(),
        isAnnual: true,
        monthsCovered: 12,
        yearCovered: year,
        createdAt: new Date().toISOString()
    };

    appState.payments.push(payment);
    tenant.status = 'paid';
    tenant.lastPayment = paymentDate;
    const untilDate = new Date(paymentDate);
    untilDate.setFullYear(untilDate.getFullYear() + 1);
    tenant.annualPaymentUntil = untilDate.toISOString();

    return payment;
}

function syncMonthlyPaymentsFromPaymentRecords() {
    appState.tenants.forEach(tenant => {
        appState.payments.forEach(payment => {
            if (payment.tenantId !== tenant.id) return;

            if (payment.isAnnual && payment.yearCovered) {
                const year = payment.yearCovered;
                ensureTenantMonthlyPayments(tenant, year);
                for (let m = 1; m <= 12; m++) {
                    if (!isMonthPaid(tenant, year, m)) {
                        tenant.monthlyPayments[year][m] = {
                            paid: true,
                            amount: tenant.monthlyAmount,
                            date: payment.date
                        };
                    }
                }
                return;
            }

            const d = new Date(payment.date);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            if (!isMonthPaid(tenant, year, month)) {
                ensureTenantMonthlyPayments(tenant, year);
                tenant.monthlyPayments[year][month] = {
                    paid: true,
                    amount: payment.amount,
                    date: payment.date
                };
            }
        });
        updateTenantStatusFromMonthly(tenant, new Date().getFullYear());
    });
}

function toggleAnnualMatrixCell(tenantId, year, month) {
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const currentlyPaid = isMonthPaid(tenant, year, month);
    setMonthPaidStatus(tenantId, year, month, !currentlyPaid, {
        notes: currentlyPaid ? '' : 'עודכן מטבלת תשלומים שנתית'
    });

    saveDataToStorage();
    if (typeof renderAnnualPaymentsMatrix === 'function') {
        renderAnnualPaymentsMatrix();
    }
    if (typeof renderTenantsTable === 'function') renderTenantsTable();
    if (typeof renderPaymentsTable === 'function') renderPaymentsTable();
    if (typeof updateAllStatistics === 'function') updateAllStatistics();
}

window.getPaymentForMonth = getPaymentForMonth;
window.setMonthPaidStatus = setMonthPaidStatus;
window.toggleAnnualMatrixCell = toggleAnnualMatrixCell;
window.applyAnnualPayment = applyAnnualPayment;
window.getPaidMonthsCount = getPaidMonthsCount;
window.isMonthPaid = isMonthPaid;
window.findPaymentRecordForMonth = findPaymentRecordForMonth;
window.ensureTenantMonthlyPayments = ensureTenantMonthlyPayments;
window.updateTenantStatusFromMonthly = updateTenantStatusFromMonthly;
window.syncMonthlyPaymentsFromPaymentRecords = syncMonthlyPaymentsFromPaymentRecords;
