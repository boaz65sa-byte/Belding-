/**
 * Moves payments UI under tenants section and adds history sub-tab.
 */
function unifyPaymentsUnderTenants() {
    if (document.getElementById('paymentsHistoryTab')) return;

    const paymentsSection = document.getElementById('paymentsSection');
    if (!paymentsSection) return;

    const historyTab = document.createElement('div');
    historyTab.id = 'paymentsHistoryTab';
    historyTab.className = 'tenant-tab-content hidden';

    const backBtn = paymentsSection.querySelector('button[onclick*="switchTab(\'tenants\')"]');
    if (backBtn) backBtn.remove();

    const title = paymentsSection.querySelector('h1');
    if (title) {
        const h2 = document.createElement('h2');
        h2.className = 'text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2';
        h2.innerHTML = title.innerHTML.replace('ניהול תשלומים', 'היסטוריית תשלומים');
        title.replaceWith(h2);
    }

    while (paymentsSection.firstChild) {
        historyTab.appendChild(paymentsSection.firstChild);
    }
    paymentsSection.remove();

    const tableTab = document.getElementById('paymentsTableTab');
    if (tableTab && tableTab.parentNode) {
        tableTab.parentNode.insertBefore(historyTab, tableTab.nextSibling);
    }

    if (!document.querySelector('.tenant-tab[data-tab="paymentsHistory"]')) {
        const tabBar = document.querySelector('.tenant-tab[data-tab="paymentsTable"]')?.parentElement;
        if (tabBar) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tenant-tab flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg font-semibold whitespace-nowrap';
            btn.dataset.tab = 'paymentsHistory';
            btn.onclick = function () { switchTenantTab('paymentsHistory'); };
            btn.innerHTML = '<i class="fas fa-money-bill-wave"></i> היסטוריית תשלומים';
            tabBar.appendChild(btn);
        }
    }

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
    if (tenantsTitle) {
        tenantsTitle.innerHTML = '<i class="fas fa-users text-blue-600"></i> דיירים ותשלומים';
    }

    const goPaymentsBtn = document.querySelector('#tenantsSection button[onclick*="switchTab(\'payments\')"]');
    if (goPaymentsBtn) goPaymentsBtn.remove();
}

window.unifyPaymentsUnderTenants = unifyPaymentsUnderTenants;
