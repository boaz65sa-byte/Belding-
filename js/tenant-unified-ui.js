/**
 * Payments under tenants: nav cleanup (content is in index.html).
 */
function unifyPaymentsUnderTenants() {
    document.querySelectorAll('.menu-item[data-section="payments"]').forEach(function (el) {
        el.remove();
    });

    var historyTab = document.getElementById('paymentsHistoryTab');
    var tableTab = document.getElementById('paymentsTableTab');
    if (historyTab && !historyTab.classList.contains('active')) {
        historyTab.classList.add('hidden');
    }
    if (tableTab && !tableTab.classList.contains('active')) {
        tableTab.classList.add('hidden');
    }
}

window.unifyPaymentsUnderTenants = unifyPaymentsUnderTenants;
