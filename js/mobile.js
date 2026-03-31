/**
 * Tenant Management Pro - Mobile Native UI Enhancements
 * Adds FAB functionality, Bottom Sheets, and Mobile Cards for remaining sections.
 */

document.addEventListener('DOMContentLoaded', () => {
    initFabLogic();
    initMobileOverrides();
});

function initFabLogic() {
    const fabBtn = document.getElementById('fabBtn');
    if (!fabBtn) return;

    // Listen to changes in the active section to update the FAB
    const updateFab = () => {
        const activeSection = document.querySelector('.content-section.active');
        if (!activeSection) return;

        const sectionId = activeSection.id;
        const icon = fabBtn.querySelector('i');
        
        // Remove old click listeners safely
        const newFabBtn = fabBtn.cloneNode(true);
        fabBtn.parentNode.replaceChild(newFabBtn, fabBtn);
        const currentFab = document.getElementById('fabBtn');
        const currentIcon = currentFab.querySelector('i');

        currentFab.style.display = 'flex'; // show by default

        switch (sectionId) {
            case 'dashboardSection':
                currentFab.style.display = 'none'; // Maybe no FAB for dashboard
                break;
            case 'tenantsSection':
                currentIcon.className = 'fas fa-user-plus';
                currentFab.onclick = () => {
                    if (typeof addTenant === 'function') addTenant();
                };
                break;
            case 'paymentsSection':
                currentIcon.className = 'fas fa-hand-holding-usd';
                currentFab.onclick = () => {
                    document.getElementById('recordPaymentBtn')?.click();
                };
                break;
            case 'expensesSection':
                currentIcon.className = 'fas fa-file-invoice-dollar';
                currentFab.onclick = () => {
                    document.getElementById('addExpenseBtn')?.click();
                };
                break;
            case 'noticesSection':
                currentIcon.className = 'fas fa-bullhorn';
                currentFab.onclick = () => {
                    // Scroll to form or show form modal
                    document.getElementById('noticeSubject')?.focus();
                };
                break;
            default:
                currentFab.style.display = 'none';
        }
    };

    // Initial update
    updateFab();

    // Hook into tab switching by observing the mobile nav clicks
    const bottomNavItems = document.querySelectorAll('.mobile-bottom-nav .nav-item, nav.fixed.bottom-0 .menu-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(updateFab, 50); // wait for section content to switch
        });
    });
    
    // Also observe the sidebar menu items (if used on desktop but resized)
    const sidebarItems = document.querySelectorAll('.sidebar .menu-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(updateFab, 50);
        });
    });
}

function initMobileOverrides() {
    // Override renderPaymentsTable
    if (typeof window.renderPaymentsTable === 'function') {
        const origRenderPayments = window.renderPaymentsTable;
        window.renderPaymentsTable = function(tenantId) {
            origRenderPayments(tenantId);
            renderMobilePaymentsCards(tenantId);
        };
    }
    
    // Override renderExpensesTable
    if (typeof window.renderExpensesTable === 'function') {
        const origRenderExpenses = window.renderExpensesTable;
        window.renderExpensesTable = function(category) {
            origRenderExpenses(category);
            renderMobileExpensesCards(category);
        };
    }

    // Inject container containers for cards if they don't exist
    injectCardContainers();
}

function injectCardContainers() {
    // Payments
    const paymentsSection = document.getElementById('paymentsSection');
    if (paymentsSection && !document.getElementById('paymentsCardsContainer')) {
        const container = document.createElement('div');
        container.id = 'paymentsCardsContainer';
        container.className = 'mobile-cards-container md:hidden';
        
        // Find the table container and insert after it
        const tableContainer = paymentsSection.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(container, tableContainer.nextSibling);
        }
    }

    // Expenses
    const expensesSection = document.getElementById('expensesSection');
    if (expensesSection && !document.getElementById('expensesCardsContainer')) {
        const container = document.createElement('div');
        container.id = 'expensesCardsContainer';
        container.className = 'mobile-cards-container md:hidden';
        
        const tableContainer = expensesSection.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(container, tableContainer.nextSibling);
        }
    }
}

function renderMobilePaymentsCards(tenantId = null) {
    const container = document.getElementById('paymentsCardsContainer');
    if (!container || !appState || !appState.payments) return;
    
    let filteredPayments = tenantId && tenantId !== 'all' 
        ? appState.payments.filter(p => p.tenantId === tenantId)
        : appState.payments;
    
    const statusFilter = document.getElementById('paymentStatusFilter')?.value || 'all';
    if (statusFilter !== 'all') {
        filteredPayments = filteredPayments.filter(payment => getPaymentStatus(payment) === statusFilter);
    }
    
    const sortedPayments = [...filteredPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedPayments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary); background: white; border-radius: 16px;">
                <i class="fas fa-money-bill-wave" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                <p>אין תשלומים רשומים</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sortedPayments.map(payment => {
        const tenant = appState.tenants.find(t => t.id === payment.tenantId);
        const paymentStatus = getPaymentStatus(payment);
        const tenantName = tenant ? tenant.name : 'דייר לא נמצא';
        
        return `
            <div class="mobile-card">
                <div class="mobile-card-header">
                    <div class="mobile-card-title">
                        <i class="fas fa-file-invoice-dollar text-primary"></i>
                        ₪${payment.amount}
                    </div>
                    <span class="status-badge status-${paymentStatus}">${getStatusText(paymentStatus)}</span>
                </div>
                <div class="mobile-card-body">
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">דייר:</span>
                        <span class="mobile-card-value">${tenantName} ${tenant ? '(דירה ' + tenant.apartment + ')' : ''}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">תאריך:</span>
                        <span class="mobile-card-value">${formatDate(payment.date)}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">אמצעי תשלום:</span>
                        <span class="mobile-card-value">${getPaymentMethodText(payment.method)}</span>
                    </div>
                    ${payment.notes ? `
                    <div class="mobile-card-row" style="flex-direction: column; align-items: flex-start;">
                        <span class="mobile-card-label">הערות:</span>
                        <span class="mobile-card-value" style="margin-top: 4px; font-weight: 400;">${payment.notes}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="mobile-card-actions">
                    <button class="btn btn-sm btn-danger" onclick="deletePayment('${payment.id}')">
                        <i class="fas fa-trash"></i> מחק
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderMobileExpensesCards(category = null) {
    const container = document.getElementById('expensesCardsContainer');
    if (!container || !appState || !appState.expenses) return;
    
    const searchTerm = document.getElementById('expenseSearchInput')?.value.toLowerCase() || '';
    const categoryFilter = category || document.getElementById('expenseCategoryFilter')?.value || 'all';
    
    let filteredExpenses = appState.expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm) ||
                             (expense.notes && expense.notes.toLowerCase().includes(searchTerm));
        const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedExpenses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary); background: white; border-radius: 16px;">
                <i class="fas fa-receipt" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                <p>לא נמצאו הוצאות</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sortedExpenses.map(expense => {
        const catInfo = getCategoryInfo(expense.category);
        const hasReceipt = expense.receiptUrl ? true : false;
        
        return `
            <div class="mobile-card">
                <div class="mobile-card-header">
                    <div class="mobile-card-title truncate max-w-[70%]">
                        <div style="width: 24px; height: 24px; border-radius: 6px; background: ${catInfo.color}; color: white; display: inline-flex; justify-content: center; align-items: center; margin-left: 6px; font-size: 10px;">
                            <i class="${catInfo.icon}"></i>
                        </div>
                        ₪${expense.amount}
                    </div>
                    <span class="text-xs text-gray-500">${formatDate(expense.date)}</span>
                </div>
                <div class="mobile-card-body">
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">תיאור:</span>
                        <span class="mobile-card-value">${expense.description}</span>
                    </div>
                    ${expense.paidBy ? `
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">שולם ע"י:</span>
                        <span class="mobile-card-value">${expense.paidBy}</span>
                    </div>
                    ` : ''}
                    ${expense.notes ? `
                    <div class="mobile-card-row" style="flex-direction: column; align-items: flex-start;">
                        <span class="mobile-card-label">הערות:</span>
                        <span class="mobile-card-value" style="margin-top: 4px; font-weight: 400; text-wrap: wrap;">${expense.notes}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="mobile-card-actions">
                    ${hasReceipt ? `
                    <button class="btn btn-sm btn-secondary" onclick="viewReceipt('${expense.id}')">
                        <i class="fas fa-file-image"></i> קבלה
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-primary" onclick="editExpense('${expense.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
