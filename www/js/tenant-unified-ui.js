/**
 * Payments under tenants: nav cleanup (content is in index.html).
 */
function unifyPaymentsUnderTenants() {
    document.querySelectorAll('.menu-item[data-section="payments"]').forEach(function (el) {
        el.remove();
    });

    const mobilePay = document.querySelector('.mobile-bottom-nav .nav-item[data-tab="payments"]');
    if (mobilePay) {
        mobilePay.setAttribute('data-tab', 'notices');
        mobilePay.onclick = function () { showTab('notices'); };
        mobilePay.innerHTML = '<i class="fas fa-bullhorn"></i><span>הודעות</span>';
    }

    const tenantsTitle = document.querySelector('#tenantsSection h1');
    if (tenantsTitle && tenantsTitle.textContent.indexOf('ותשלומים') === -1) {
        tenantsTitle.innerHTML = '<i class="fas fa-users text-blue-600"></i> דיירים ותשלומים';
    }

    const goPaymentsBtn = document.querySelector('#tenantsSection button[onclick*="switchTab(\'payments\')"]');
    if (goPaymentsBtn) goPaymentsBtn.remove();

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
