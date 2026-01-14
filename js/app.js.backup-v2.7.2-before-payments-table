/**
 * מערכת ניהול דיירים מתקדמת
 * Tenant Management System - Main Application
 * 
 * מפתח ובעלים: בועז סעדה
 * Copyright © 2024 בועז סעדה
 * All Rights Reserved
 * 
 * גרסה: 2.6.2
 * תאריך עדכון: 09/01/2026
 * 
 * Advanced JavaScript with ES6+ Features
 * Includes: CRUD Operations, LocalStorage, Charts, Validation, Export,
 *           WhatsApp Integration, Annual Payments, Receipts, Expenses
 */

// ===================================
// Application State & Configuration
// ===================================

const APP_CONFIG = {
    version: '2.7.2',
    author: 'בועז סעדה',
    copyright: '© 2024 בועז סעדה',
    lastUpdate: '13/01/2026',
    storageKey: 'tenantManagementData',
    backupKey: 'tenantManagementBackup',
    settingsKey: 'tenantManagementSettings',
    autoBackupInterval: 24 * 60 * 60 * 1000, // 24 hours
};

let appState = {
    tenants: [],
    payments: [],
    expenses: [],
    activities: [],
    settings: {
        buildingName: 'בניין הדוגמה',
        defaultAmount: 500,
        paymentDay: 1,
        chairpersonName: '',
        chairpersonPhone: '',
        treasurerName: '',
        treasurerPhone: '',
        whatsappNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        reminderDays: 3,
        autoMonthlyBilling: true,
        autoBackup: true,
    },
    currentEditId: null,
    currentTenantForWhatsapp: null,
    currentPaymentForReceipt: null,
    selectedTenants: new Set(),
    selectedPayments: new Set(),
    charts: {
        paymentStatus: null,
        monthlyRevenue: null,
    }
};

// ===================================
// Initialization & Setup
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadDataFromStorage();
    setupEventListeners();
    setupNavigation();
    renderDashboard();
    renderTenantsTable();
    populatePaymentTenantFilter();
    renderPaymentsTable();
    updateAllStatistics();
    checkAutoBackup();
    
    // Show loading animation
    showLoading();
    setTimeout(() => {
        hideLoading();
        
        // Check if this is a new version
        const lastSeenVersion = localStorage.getItem('lastSeenVersion');
        const currentVersion = APP_CONFIG.version;
        
        if (lastSeenVersion !== currentVersion) {
            // This is a new version or first time
            localStorage.setItem('lastSeenVersion', currentVersion);
            
            if (lastSeenVersion && (currentVersion === '2.4.7' || currentVersion === '2.4.8')) {
                // Show special message for new features
                const featureMessage = currentVersion === '2.4.8' ? 
                    'סנכרון אוטומטי בין דיירים ← → תשלומים!' :
                    'קבלות PDF מקצועיות זמינות עכשיו!';
                showToast(`🎉 עדכון חדש! גרסה ${currentVersion} - ${featureMessage}`, 'success', 5000);
                
                // Show detailed notification after 2 seconds
                setTimeout(() => {
                    showNewFeatureNotification();
                }, 2000);
            } else {
                showToast(`מערכת ניהול דיירים v${currentVersion} | ${APP_CONFIG.author}`, 'success');
            }
        } else {
            showToast(`מערכת ניהול דיירים v${currentVersion} | ${APP_CONFIG.author}`, 'success');
        }
    }, 1000);
}

// ===================================
// Data Management & Storage
// ===================================

function loadDataFromStorage() {
    try {
        const savedData = localStorage.getItem(APP_CONFIG.storageKey);
        const savedSettings = localStorage.getItem(APP_CONFIG.settingsKey);
        
        console.log('📥 טוען נתונים מ-LocalStorage...');
        console.log('📊 נתונים נמצאו:', !!savedData);
        
        if (savedData) {
            const parsed = JSON.parse(savedData);
            appState.tenants = parsed.tenants || [];
            appState.payments = parsed.payments || [];
            appState.expenses = parsed.expenses || [];
            appState.activities = parsed.activities || [];
            
            console.log('✅ נטענו:', appState.tenants.length, 'דיירים,', appState.payments.length, 'תשלומים');
            
            // Initialize monthlyPayments for existing tenants
            appState.tenants.forEach(tenant => {
                if (!tenant.monthlyPayments) {
                    tenant.monthlyPayments = {
                        [new Date().getFullYear()]: {}
                    };
                }
            });
        } else {
            console.log('ℹ️ אין נתונים שמורים, טוען נתוני demo');
            // Load demo data for first time users
            loadDemoData();
        }
        
        if (savedSettings) {
            appState.settings = { ...appState.settings, ...JSON.parse(savedSettings) };
            console.log('✅ הגדרות נטענו');
        }
        
        // Apply saved settings
        applySettings();
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showToast('שגיאה בטעינת נתונים', 'error');
    }
}

function saveDataToStorage() {
    try {
        const dataToSave = {
            tenants: appState.tenants,
            payments: appState.payments,
            expenses: appState.expenses,
            activities: appState.activities,
            lastSaved: new Date().toISOString(),
        };
        
        localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(dataToSave));
        localStorage.setItem(APP_CONFIG.settingsKey, JSON.stringify(appState.settings));
        
        console.log('💾 נתונים נשמרו:', appState.tenants.length, 'דיירים,', appState.payments.length, 'תשלומים');
        
        return true;
    } catch (error) {
        console.error('❌ Error saving data:', error);
        showToast('שגיאה בשמירת נתונים', 'error');
        return false;
    }
}

function loadDemoData() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    appState.tenants = [
        {
            id: generateId(),
            apartment: '1',
            name: 'משה כהן',
            phone: '050-1234567',
            email: 'moshe@example.com',
            monthlyAmount: 500,
            status: 'paid',
            lastPayment: new Date().toISOString(),
            notes: '',
            createdAt: new Date().toISOString(),
            monthlyPayments: {
                [currentYear]: {
                    1: { paid: true, date: '2024-01-05', amount: 500 },
                    2: { paid: true, date: '2024-02-05', amount: 500 },
                    3: { paid: true, date: '2024-03-05', amount: 500 },
                    [currentMonth]: { paid: true, date: new Date().toISOString(), amount: 500 }
                }
            }
        },
        {
            id: generateId(),
            apartment: '2',
            name: 'שרה לevi',
            phone: '052-9876543',
            email: 'sara@example.com',
            monthlyAmount: 500,
            status: 'pending',
            lastPayment: null,
            notes: '',
            createdAt: new Date().toISOString(),
            monthlyPayments: {
                [currentYear]: {}
            }
        },
        {
            id: generateId(),
            apartment: '3',
            name: 'דוד ישראלי',
            phone: '054-5555555',
            email: 'david@example.com',
            monthlyAmount: 600,
            status: 'overdue',
            lastPayment: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'חוב מחודש קודם',
            createdAt: new Date().toISOString(),
            monthlyPayments: {
                [currentYear]: {
                    1: { paid: true, date: '2024-01-10', amount: 600 },
                    2: { paid: true, date: '2024-02-10', amount: 600 }
                }
            }
        },
    ];
    
    appState.payments = [
        {
            id: generateId(),
            tenantId: appState.tenants[0].id,
            amount: 500,
            date: new Date().toISOString(),
            method: 'transfer',
            notes: 'תשלום דרך העברה בנקאית',
        }
    ];
    
    addActivity('המערכת אותחלה עם נתוני דמו', 'info');
    saveDataToStorage();
}

// ===================================
// Navigation & UI Management
// ===================================

function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // Show target section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${targetSection}Section`).classList.add('active');
            
            // Render section-specific content
            renderSectionContent(targetSection);
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function renderSectionContent(section) {
    switch(section) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'tenants':
            renderTenantsTable();
            break;
        case 'payments':
            renderPaymentsTable();
            break;
        case 'expenses':
            renderExpensesTable();
            break;
        case 'notices':
            renderNoticesHistory();
            break;
        case 'reports':
            renderReports();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ===================================
// Dashboard Rendering
// ===================================

function renderDashboard() {
    updateStatistics();
    renderCharts();
    renderRecentActivity();
}

function updateStatistics() {
    const totalTenants = appState.tenants.length;
    const paidTenants = appState.tenants.filter(t => t.status === 'paid').length;
    const pendingTenants = appState.tenants.filter(t => t.status === 'pending' || t.status === 'overdue').length;
    const totalRevenue = appState.payments
        .filter(p => isCurrentMonth(p.date))
        .reduce((sum, p) => sum + p.amount, 0);
    
    document.getElementById('totalTenants').textContent = totalTenants;
    document.getElementById('paidTenants').textContent = paidTenants;
    document.getElementById('pendingTenants').textContent = pendingTenants;
    document.getElementById('totalRevenue').textContent = `₪${totalRevenue.toLocaleString()}`;
}

function updateAllStatistics() {
    updateStatistics();
    updatePaymentSummary();
    updateTenantsStatusFromMonthlyPayments();
}

function updateTenantsStatusFromMonthlyPayments() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    appState.tenants.forEach(tenant => {
        if (tenant.monthlyPayments && tenant.monthlyPayments[currentYear]) {
            const monthData = tenant.monthlyPayments[currentYear][currentMonth];
            if (monthData?.paid) {
                tenant.status = 'paid';
                tenant.lastPayment = monthData.date;
            } else {
                // Check if overdue (previous months not paid)
                let hasUnpaidPreviousMonths = false;
                for (let m = 1; m < currentMonth; m++) {
                    if (!tenant.monthlyPayments[currentYear][m]?.paid) {
                        hasUnpaidPreviousMonths = true;
                        break;
                    }
                }
                tenant.status = hasUnpaidPreviousMonths ? 'overdue' : 'pending';
            }
        }
    });
}

function renderCharts() {
    renderPaymentStatusChart();
    renderMonthlyRevenueChart();
}

function renderPaymentStatusChart() {
    const canvas = document.getElementById('paymentStatusChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (appState.charts.paymentStatus) {
        appState.charts.paymentStatus.destroy();
    }
    
    const paidCount = appState.tenants.filter(t => t.status === 'paid').length;
    const pendingCount = appState.tenants.filter(t => t.status === 'pending').length;
    const overdueCount = appState.tenants.filter(t => t.status === 'overdue').length;
    
    appState.charts.paymentStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['שולם', 'ממתין', 'באיחור'],
            datasets: [{
                data: [paidCount, pendingCount, overdueCount],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    rtl: true,
                    labels: {
                        font: { family: 'Heebo', size: 12 },
                        padding: 15,
                    }
                }
            }
        }
    });
}

function renderMonthlyRevenueChart() {
    const canvas = document.getElementById('monthlyRevenueChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (appState.charts.monthlyRevenue) {
        appState.charts.monthlyRevenue.destroy();
    }
    
    // Calculate last 6 months revenue
    const monthsData = getLast6MonthsRevenue();
    
    appState.charts.monthlyRevenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthsData.labels,
            datasets: [{
                label: 'הכנסות (₪)',
                data: monthsData.values,
                backgroundColor: '#2563eb',
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Heebo' },
                        callback: (value) => `₪${value}`
                    }
                },
                x: {
                    ticks: {
                        font: { family: 'Heebo' }
                    }
                }
            }
        }
    });
}

function getLast6MonthsRevenue() {
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const labels = [];
    const values = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = months[date.getMonth()];
        labels.push(monthName);
        
        const revenue = appState.payments
            .filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate.getMonth() === date.getMonth() && 
                       paymentDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, p) => sum + p.amount, 0);
        
        values.push(revenue);
    }
    
    return { labels, values };
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const recentActivities = appState.activities.slice(-10).reverse();
    
    if (recentActivities.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>אין פעילות אחרונה</p></div>';
        return;
    }
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.message}</div>
                <div class="activity-time">${formatRelativeTime(activity.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

// ===================================
// Tenants Management
// ===================================

function renderTenantsTable() {
    const tbody = document.getElementById('tenantsTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const sortBy = document.getElementById('sortBy')?.value || 'apartment';
    
    let filteredTenants = appState.tenants.filter(tenant => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchTerm) ||
                             tenant.apartment.toLowerCase().includes(searchTerm) ||
                             tenant.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // Sort tenants
    filteredTenants.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name, 'he');
            case 'amount':
                return b.monthlyAmount - a.monthlyAmount;
            case 'status':
                return a.status.localeCompare(b.status);
            default: // apartment
                return parseInt(a.apartment) - parseInt(b.apartment);
        }
    });
    
    if (filteredTenants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                    <p>לא נמצאו דיירים</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredTenants.map(tenant => {
        const paidMonths = appState.payments.filter(p => 
            p.tenantId === tenant.id && 
            p.year === new Date().getFullYear()
        ).length;
        const totalMonths = 12;
        const statusIcon = tenant.status === 'active' ? '💚' : 
                          tenant.status === 'debt' ? '⚠️' : '✅';
        
        return `
        <tr>
            <td><input type="checkbox" class="tenant-checkbox" data-id="${tenant.id}" ${appState.selectedTenants.has(tenant.id) ? 'checked' : ''}></td>
            <td>${tenant.apartment}</td>
            <td><strong>${tenant.name}</strong></td>
            <td>₪${tenant.monthlyAmount}</td>
            <td>${paidMonths}/${totalMonths}</td>
            <td style="text-align: center; font-size: 1.5rem;">${statusIcon}</td>
            <td style="text-align: center;">
                <div class="tenant-actions-wrapper" style="position: relative; display: inline-block;">
                    <button class="tenant-actions-btn" onclick="toggleTenantActions('${tenant.id}', event)" title="פעולות">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="tenant-actions-menu" id="tenantActions-${tenant.id}" style="display: none;">
                        <button onclick="editTenant('${tenant.id}'); closeTenantActions();">
                            <i class="fas fa-edit"></i>
                            <span>ערוך דייר</span>
                        </button>
                        <button onclick="navigateToPayments('${tenant.id}'); closeTenantActions();">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>רשום תשלום</span>
                        </button>
                        <button onclick="openMonthlyTracking('${tenant.id}'); closeTenantActions();">
                            <i class="fas fa-calendar-check"></i>
                            <span>מעקב חודשי</span>
                        </button>
                        <button onclick="openAnnualPaymentForTenant('${tenant.id}'); closeTenantActions();">
                            <i class="fas fa-calendar-alt"></i>
                            <span>תשלום שנתי</span>
                        </button>
                        <button onclick="viewTenantReports('${tenant.id}'); closeTenantActions();">
                            <i class="fas fa-chart-bar"></i>
                            <span>דוחות</span>
                        </button>
                        <button onclick="openWhatsappForTenant('${tenant.id}'); closeTenantActions();">
                            <i class="fab fa-whatsapp"></i>
                            <span>WhatsApp</span>
                        </button>
                        <button onclick="deleteTenant('${tenant.id}'); closeTenantActions();" style="color: #ef4444;">
                            <i class="fas fa-trash"></i>
                            <span>מחק</span>
                        </button>
                    </div>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    // Update checkbox listeners
    updateCheckboxListeners();
}

function addTenant() {
    appState.currentEditId = null;
    document.getElementById('modalTitle').textContent = 'הוסף דייר חדש';
    document.getElementById('tenantForm').reset();
    document.getElementById('tenantId').value = '';
    showModal('tenantModal');
}

function editTenant(id) {
    const tenant = appState.tenants.find(t => t.id === id);
    if (!tenant) return;
    
    appState.currentEditId = id;
    document.getElementById('modalTitle').textContent = 'ערוך דייר';
    document.getElementById('tenantId').value = tenant.id;
    document.getElementById('apartment').value = tenant.apartment;
    document.getElementById('tenantName').value = tenant.name;
    document.getElementById('phone').value = tenant.phone;
    document.getElementById('email').value = tenant.email || '';
    document.getElementById('monthlyAmount').value = tenant.monthlyAmount;
    document.getElementById('paymentStatus').value = tenant.status;
    document.getElementById('notes').value = tenant.notes || '';
    
    showModal('tenantModal');
}

function saveTenant(formData) {
    const tenantData = {
        apartment: formData.get('apartment'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        monthlyAmount: parseFloat(formData.get('monthlyAmount')),
        status: formData.get('status'),
        notes: formData.get('notes') || '',
    };
    
    let shouldCreatePayment = false;
    let oldStatus = null;
    
    if (appState.currentEditId) {
        // Update existing tenant
        const index = appState.tenants.findIndex(t => t.id === appState.currentEditId);
        if (index !== -1) {
            oldStatus = appState.tenants[index].status;
            
            // בדיקה אם השתנה הסטטוס ל"שולם"
            if (oldStatus !== 'paid' && tenantData.status === 'paid') {
                shouldCreatePayment = true;
                tenantData.lastPayment = new Date().toISOString();
            }
            
            appState.tenants[index] = {
                ...appState.tenants[index],
                ...tenantData,
                updatedAt: new Date().toISOString(),
            };
            addActivity(`עודכן דייר: ${tenantData.name} (דירה ${tenantData.apartment})`, 'edit');
            
            // יצירת תשלום אם הסטטוס שונה ל"שולם"
            if (shouldCreatePayment) {
                const payment = {
                    id: generateId(),
                    tenantId: appState.currentEditId,
                    tenantName: tenantData.name,
                    apartment: tenantData.apartment,
                    amount: tenantData.monthlyAmount,
                    date: new Date().toISOString(),
                    method: 'other',
                    notes: 'תשלום מעריכת דייר - סטטוס שונה לשולם',
                    createdAt: new Date().toISOString()
                };
                appState.payments.push(payment);
                addActivity(`תשלום נרשם אוטומטית עבור ${tenantData.name} - ₪${tenantData.monthlyAmount}`, 'payment');
            }
        }
    } else {
        // Add new tenant
        const newTenant = {
            id: generateId(),
            ...tenantData,
            lastPayment: tenantData.status === 'paid' ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
        };
        appState.tenants.push(newTenant);
        addActivity(`נוסף דייר חדש: ${tenantData.name} (דירה ${tenantData.apartment})`, 'add');
        
        // אם הדייר החדש מסומן כשולם, צור תשלום
        if (tenantData.status === 'paid') {
            const payment = {
                id: generateId(),
                tenantId: newTenant.id,
                tenantName: tenantData.name,
                apartment: tenantData.apartment,
                amount: tenantData.monthlyAmount,
                date: new Date().toISOString(),
                method: 'other',
                notes: 'תשלום ראשוני - דייר חדש שסומן כשולם',
                createdAt: new Date().toISOString()
            };
            appState.payments.push(payment);
            addActivity(`תשלום נרשם אוטומטית עבור דייר חדש ${tenantData.name} - ₪${tenantData.monthlyAmount}`, 'payment');
        }
    }
    
    saveDataToStorage();
    renderTenantsTable();
    renderPaymentsTable(); // ⭐ עדכון גם טבלת תשלומים
    updateAllStatistics();
    renderDashboard();
    hideModal('tenantModal');
    
    const message = shouldCreatePayment ? 
        'הדייר נשמר ותשלום נרשם בהצלחה!' : 
        'הדייר נשמר בהצלחה!';
    showToast(message, 'success');
}

function deleteTenant(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק דייר זה?')) return;
    
    const tenant = appState.tenants.find(t => t.id === id);
    if (tenant) {
        appState.tenants = appState.tenants.filter(t => t.id !== id);
        addActivity(`נמחק דייר: ${tenant.name} (דירה ${tenant.apartment})`, 'delete');
        saveDataToStorage();
        renderTenantsTable();
        updateAllStatistics();
        renderDashboard();
        showToast('הדייר נמחק בהצלחה', 'success');
    }
}

function viewTenant(id) {
    const tenant = appState.tenants.find(t => t.id === id);
    if (!tenant) return;
    
    const tenantPayments = appState.payments.filter(p => p.tenantId === id);
    const totalPaid = tenantPayments.reduce((sum, p) => sum + p.amount, 0);
    
    alert(`
פרטי דייר:
-----------
דירה: ${tenant.apartment}
שם: ${tenant.name}
טלפון: ${tenant.phone}
אימייל: ${tenant.email || 'לא צוין'}
סכום חודשי: ₪${tenant.monthlyAmount}
סטטוס: ${getStatusText(tenant.status)}
תשלום אחרון: ${tenant.lastPayment ? formatDate(tenant.lastPayment) : 'אין'}
סה"כ שולם: ₪${totalPaid}
הערות: ${tenant.notes || 'אין'}
    `);
}

// ===================================
// Payments Management
// ===================================

function renderPaymentsTable(tenantId = null) {
    updatePaymentSummary();
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    
    // Filter by tenant if specified
    let filteredPayments = tenantId && tenantId !== 'all' 
        ? appState.payments.filter(p => p.tenantId === tenantId)
        : appState.payments;
    
    // Filter by status if specified
    const statusFilter = document.getElementById('paymentStatusFilter')?.value || 'all';
    if (statusFilter !== 'all') {
        filteredPayments = filteredPayments.filter(payment => {
            const status = getPaymentStatus(payment);
            return status === statusFilter;
        });
    }
    
    const sortedPayments = [...filteredPayments].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    if (sortedPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-money-bill-wave" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                    <p>אין תשלומים רשומים</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sortedPayments.map(payment => {
        const tenant = appState.tenants.find(t => t.id === payment.tenantId);
        const paymentStatus = getPaymentStatus(payment);
        return `
            <tr>
                <td><input type="checkbox" class="payment-checkbox" data-id="${payment.id}" ${appState.selectedPayments.has(payment.id) ? 'checked' : ''}></td>
                <td>${formatDate(payment.date)}</td>
                <td>${tenant ? tenant.apartment : '-'}</td>
                <td>${tenant ? tenant.name : 'דייר לא נמצא'}</td>
                <td><strong>₪${payment.amount}</strong></td>
                <td>${getPaymentMethodText(payment.method)}</td>
                <td><span class="status-badge status-${paymentStatus}">${getStatusText(paymentStatus)}</span></td>
                <td>${payment.notes || '-'}</td>
                <td>
                    <button class="action-btn delete" onclick="deletePayment('${payment.id}')" title="מחק">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update checkbox listeners for payments
    updatePaymentCheckboxListeners();
}

function updatePaymentSummary() {
    const expectedTotal = appState.tenants.reduce((sum, t) => sum + t.monthlyAmount, 0);
    const receivedTotal = appState.payments
        .filter(p => isCurrentMonth(p.date))
        .reduce((sum, p) => sum + p.amount, 0);
    const debtTotal = expectedTotal - receivedTotal;
    
    document.getElementById('expectedTotal').textContent = `₪${expectedTotal.toLocaleString()}`;
    document.getElementById('receivedTotal').textContent = `₪${receivedTotal.toLocaleString()}`;
    document.getElementById('debtTotal').textContent = `₪${Math.max(0, debtTotal).toLocaleString()}`;
}

function getPaymentStatus(payment) {
    // Check if payment is for current month
    if (isCurrentMonth(payment.date)) {
        return 'paid';
    }
    return 'pending';
}

function populatePaymentTenantFilter() {
    const select = document.getElementById('paymentTenantFilter');
    if (!select) return;
    
    select.innerHTML = '<option value="all">כל הדיירים</option>' +
        appState.tenants
            .sort((a, b) => parseInt(a.apartment) - parseInt(b.apartment))
            .map(t => `
                <option value="${t.id}">${t.name} (דירה ${t.apartment})</option>
            `).join('');
}

function filterPaymentsByTenant(tenantId) {
    renderPaymentsTable(tenantId);
}

function filterPaymentsByStatus() {
    const tenantFilter = document.getElementById('paymentTenantFilter')?.value || 'all';
    renderPaymentsTable(tenantFilter);
}

// ===================================
// Navigation: Quick Jump Between Tabs
// ===================================

function switchTab(tabName) {
    // Find the menu item for this tab
    const menuItem = document.querySelector(`.menu-item[data-section="${tabName}"]`);
    
    if (menuItem) {
        // Update active menu items (sidebar)
        document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
        menuItem.classList.add('active');
        
        // Update active nav items (bottom mobile nav)
        document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(ni => ni.classList.remove('active'));
        const bottomNavItem = document.querySelector(`.mobile-bottom-nav .nav-item[data-tab="${tabName}"]`);
        if (bottomNavItem) {
            bottomNavItem.classList.add('active');
        }
        
        // Show target section
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(`${tabName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Render section content
        renderSectionContent(tabName);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Alias for mobile bottom navigation
function showTab(tabName) {
    switchTab(tabName);
}
window.showTab = showTab;

function navigateToPayments(tenantId) {
    // 1. Switch to payments tab
    switchTab('payments');
    
    // 2. Set the tenant filter
    setTimeout(() => {
        const filterSelect = document.getElementById('paymentTenantFilter');
        if (filterSelect) {
            filterSelect.value = tenantId;
        }
        
        // 3. Filter payments for this tenant
        renderPaymentsTable(tenantId);
        
        // 4. Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 5. Show toast message
        const tenant = appState.tenants.find(t => t.id === tenantId);
        if (tenant) {
            showToast(`מציג תשלומים של ${tenant.name}`, 'info');
        }
    }, 100); // Small delay to ensure the tab is switched
}

// Make it globally accessible
window.navigateToPayments = navigateToPayments;

function recordPayment() {
    // Populate tenant dropdown
    const select = document.getElementById('paymentTenant');
    select.innerHTML = '<option value="">-- בחר דייר --</option>' + 
        appState.tenants.map(t => `
            <option value="${t.id}">${t.name} (דירה ${t.apartment})</option>
        `).join('');
    
    // Set today's date
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('paymentForm').reset();
    
    showModal('paymentModal');
}

function savePayment(formData) {
    const tenantId = formData.get('tenantId');
    const tenant = appState.tenants.find(t => t.id === tenantId);
    
    if (!tenant) {
        showToast('שגיאה: דייר לא נמצא', 'error');
        return;
    }
    
    const payment = {
        id: generateId(),
        tenantId: tenantId,
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        method: formData.get('method'),
        notes: formData.get('notes') || '',
        createdAt: new Date().toISOString(),
    };
    
    appState.payments.push(payment);
    
    // Update tenant status and last payment
    tenant.lastPayment = payment.date;
    tenant.status = 'paid';
    
    addActivity(`נרשם תשלום: ${tenant.name} - ₪${payment.amount}`, 'payment');
    
    saveDataToStorage();
    renderPaymentsTable();
    renderTenantsTable();
    updateAllStatistics();
    renderDashboard();
    hideModal('paymentModal');
    
    // Set current payment for receipt
    appState.currentPaymentForReceipt = { tenant, payment };
    console.log('💾 Set currentPaymentForReceipt in savePayment:', {
        tenant: tenant.name,
        payment: payment
    });
    
    // Ask if user wants to generate receipt
    setTimeout(() => {
        if (confirm('התשלום נרשם בהצלחה!\n\nהאם ברצונך ליצור קבלה?')) {
            console.log('✅ User confirmed receipt generation');
            generateReceipt(tenant, payment);
        } else {
            console.log('❌ User cancelled receipt generation');
        }
    }, 300);
    
    showToast('התשלום נרשם בהצלחה!', 'success');
}

function deletePayment(id, skipConfirmation = false) {
    if (!skipConfirmation && !confirm('האם אתה בטוח שברצונך למחוק תשלום זה?')) return;
    
    // מצא את התשלום לפני המחיקה
    const payment = appState.payments.find(p => p.id === id);
    
    if (payment) {
        // מחק את התשלום
        appState.payments = appState.payments.filter(p => p.id !== id);
        addActivity(`נמחק תשלום של ${payment.tenantName} - ₪${payment.amount}`, 'delete');
        
        // עדכן את סטטוס הדייר
        const tenant = appState.tenants.find(t => t.id === payment.tenantId);
        if (tenant) {
            // בדוק אם יש עוד תשלומים לדייר זה החודש
            const tenantPaymentsThisMonth = appState.payments.filter(p => 
                p.tenantId === payment.tenantId && 
                isCurrentMonth(p.date)
            );
            
            if (tenantPaymentsThisMonth.length === 0) {
                // אם אין יותר תשלומים, שנה סטטוס ל"ממתין"
                tenant.status = 'pending';
                tenant.lastPayment = null;
                addActivity(`סטטוס ${tenant.name} שונה ל"ממתין" לאחר מחיקת תשלום`, 'edit');
            }
        }
        
        saveDataToStorage();
        renderTenantsTable(); // ⭐ עדכון טבלת דיירים
        renderPaymentsTable();
        updateAllStatistics();
        renderDashboard();
        showToast('התשלום נמחק והסטטוס עודכן', 'success');
    }
}

// ===================================
// Reports & Statistics
// ===================================

function renderReports() {
    renderDebtorList();
}

function renderDebtorList() {
    const container = document.getElementById('debtorList');
    if (!container) return;
    
    const debtors = appState.tenants.filter(t => t.status === 'overdue' || t.status === 'pending');
    
    if (debtors.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>אין חייבים כרגע! 🎉</p></div>';
        return;
    }
    
    container.innerHTML = debtors.map(debtor => `
        <div class="debtor-item">
            <div class="debtor-info">
                <div class="debtor-name">${debtor.name}</div>
                <div class="debtor-apartment">דירה ${debtor.apartment} • ${debtor.phone}</div>
            </div>
            <div class="debtor-amount">₪${debtor.monthlyAmount}</div>
        </div>
    `).join('');
}

function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showToast('נא לבחור טווח תאריכים', 'warning');
        return;
    }
    
    const filteredPayments = appState.payments.filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
    });
    
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;
    
    const reportDisplay = document.getElementById('reportDisplay');
    reportDisplay.innerHTML = `
        <h2>דוח תקופתי</h2>
        <p><strong>תקופה:</strong> ${formatDate(startDate)} - ${formatDate(endDate)}</p>
        <div class="stats-grid" style="margin-top: 2rem;">
            <div class="stat-card card-info">
                <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                <div class="stat-info">
                    <h3>${filteredPayments.length}</h3>
                    <p>תשלומים</p>
                </div>
            </div>
            <div class="stat-card card-success">
                <div class="stat-icon"><i class="fas fa-shekel-sign"></i></div>
                <div class="stat-info">
                    <h3>₪${totalRevenue.toLocaleString()}</h3>
                    <p>סה"כ הכנסות</p>
                </div>
            </div>
            <div class="stat-card card-primary">
                <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                <div class="stat-info">
                    <h3>₪${Math.round(averagePayment).toLocaleString()}</h3>
                    <p>ממוצע תשלום</p>
                </div>
            </div>
        </div>
    `;
    
    addActivity(`נוצר דוח לתקופה ${formatDate(startDate)} - ${formatDate(endDate)}`, 'report');
}

function exportToPDF() {
    showToast('ייצוא PDF בפיתוח - בקרוב!', 'info');
    // TODO: Implement PDF export using jsPDF library
}

function exportToExcel() {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `דיירים_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('הקובץ יוצא בהצלחה!', 'success');
    addActivity('יוצא קובץ Excel', 'export');
}

function generateCSV() {
    const headers = ['דירה', 'שם', 'טלפון', 'אימייל', 'סכום חודשי', 'סטטוס', 'תשלום אחרון'];
    const rows = appState.tenants.map(t => [
        t.apartment,
        t.name,
        t.phone,
        t.email || '',
        t.monthlyAmount,
        getStatusText(t.status),
        t.lastPayment ? formatDate(t.lastPayment) : ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// ===================================
// Import Data Management
// ===================================

let importData = {
    csv: [],
    json: null,
    validRows: [],
    errorRows: []
};

function openImportDataModal() {
    // Reset import data
    importData = {
        csv: [],
        json: null,
        validRows: [],
        errorRows: []
    };
    
    // Reset UI
    document.getElementById('csvFileInput').value = '';
    document.getElementById('jsonFileInput').value = '';
    document.getElementById('csvFileInfo').style.display = 'none';
    document.getElementById('jsonFileInfo').style.display = 'none';
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('jsonPreview').style.display = 'none';
    document.getElementById('executeImportBtn').disabled = true;
    
    // Set default method
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.method-btn[data-method="csv"]').classList.add('active');
    document.getElementById('csvImportSection').style.display = 'block';
    document.getElementById('jsonImportSection').style.display = 'none';
    
    showModal('importDataModal');
}

function downloadTemplate() {
    const template = [
        ['דירה', 'שם', 'טלפון', 'אימייל', 'סכום חודשי'],
        ['1', 'דוגמה דייר', '050-1234567', 'example@email.com', '500'],
        ['2', 'דוגמה שנייה', '052-9876543', 'tenant2@email.com', '600']
    ];
    
    const csvContent = '\uFEFF' + template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'תבנית_דיירים.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('התבנית הורדה בהצלחה!', 'success');
}

function handleCSVFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show file info
    document.getElementById('csvFileInfo').style.display = 'flex';
    document.getElementById('csvFileInfo').innerHTML = `
        <div>
            <i class="fas fa-file-csv"></i>
            <strong>${file.name}</strong> (${(file.size / 1024).toFixed(2)} KB)
        </div>
    `;
    
    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file, 'UTF-8');
}

function parseCSV(text) {
    // Remove BOM if present
    text = text.replace(/^\uFEFF/, '');
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        showToast('הקובץ ריק או לא תקין', 'error');
        return;
    }
    
    // Skip header
    const dataLines = lines.slice(1);
    importData.csv = [];
    importData.validRows = [];
    importData.errorRows = [];
    
    dataLines.forEach((line, index) => {
        const values = line.split(',').map(v => v.trim());
        if (values.length < 3) return; // Need at least apartment, name, phone
        
        const row = {
            apartment: values[0],
            name: values[1],
            phone: values[2],
            email: values[3] || '',
            monthlyAmount: parseFloat(values[4]) || appState.settings.defaultAmount,
            lineNumber: index + 2
        };
        
        // Validate
        const errors = validateTenantRow(row);
        if (errors.length === 0) {
            importData.validRows.push(row);
        } else {
            row.errors = errors;
            importData.errorRows.push(row);
        }
        
        importData.csv.push(row);
    });
    
    displayCSVPreview();
}

function validateTenantRow(row) {
    const errors = [];
    
    if (!row.apartment || row.apartment.length === 0) {
        errors.push('מספר דירה חסר');
    }
    
    if (!row.name || row.name.length < 2) {
        errors.push('שם לא תקין');
    }
    
    if (!row.phone || !/^[\d\-]{9,}$/.test(row.phone.replace(/\s/g, ''))) {
        errors.push('טלפון לא תקין');
    }
    
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('אימייל לא תקין');
    }
    
    // Check if apartment already exists
    const existing = appState.tenants.find(t => t.apartment === row.apartment);
    if (existing) {
        errors.push('דירה כבר קיימת');
    }
    
    return errors;
}

function displayCSVPreview() {
    document.getElementById('csvPreview').style.display = 'block';
    document.getElementById('csvTotalRows').textContent = importData.csv.length;
    document.getElementById('csvValidRows').textContent = importData.validRows.length;
    document.getElementById('csvErrorRows').textContent = importData.errorRows.length;
    
    // Build preview table
    let tableHTML = `
        <thead>
            <tr>
                <th>שורה</th>
                <th>דירה</th>
                <th>שם</th>
                <th>טלפון</th>
                <th>אימייל</th>
                <th>סכום</th>
                <th>סטטוס</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    importData.csv.forEach(row => {
        const isError = row.errors && row.errors.length > 0;
        tableHTML += `
            <tr class="${isError ? 'error' : ''}">
                <td>${row.lineNumber}</td>
                <td>${row.apartment}</td>
                <td>${row.name}</td>
                <td>${row.phone}</td>
                <td>${row.email}</td>
                <td>₪${row.monthlyAmount}</td>
                <td>${isError ? row.errors.join(', ') : '✓ תקין'}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody>';
    document.getElementById('csvPreviewTable').innerHTML = tableHTML;
    
    // Enable/disable import button
    document.getElementById('executeImportBtn').disabled = importData.validRows.length === 0;
}

function handleJSONFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show file info
    document.getElementById('jsonFileInfo').style.display = 'flex';
    document.getElementById('jsonFileInfo').innerHTML = `
        <div>
            <i class="fas fa-file-code"></i>
            <strong>${file.name}</strong> (${(file.size / 1024).toFixed(2)} KB)
        </div>
    `;
    
    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            importData.json = json;
            displayJSONPreview(json);
        } catch (error) {
            showToast('הקובץ לא תקין - JSON לא חוקי', 'error');
            document.getElementById('jsonFileInfo').style.display = 'none';
        }
    };
    reader.readAsText(file);
}

function displayJSONPreview(data) {
    document.getElementById('jsonPreview').style.display = 'block';
    
    const tenants = data.tenants || [];
    const payments = data.payments || [];
    const expenses = data.expenses || [];
    
    document.getElementById('jsonTotalRows').textContent = tenants.length;
    document.getElementById('jsonPayments').textContent = payments.length;
    document.getElementById('jsonExpenses').textContent = expenses.length;
    
    let summaryHTML = '<h4>סיכום נתונים:</h4>';
    summaryHTML += `<p><strong>דיירים:</strong> ${tenants.length}</p>`;
    summaryHTML += `<p><strong>תשלומים:</strong> ${payments.length}</p>`;
    summaryHTML += `<p><strong>הוצאות:</strong> ${expenses.length}</p>`;
    
    if (data.settings) {
        summaryHTML += '<p><strong>הגדרות:</strong> כן</p>';
    }
    
    document.getElementById('jsonSummary').innerHTML = summaryHTML;
    
    // Enable import button
    document.getElementById('executeImportBtn').disabled = tenants.length === 0;
}

function executeImport() {
    const activeMethod = document.querySelector('.method-btn.active').dataset.method;
    
    if (activeMethod === 'csv') {
        importFromCSV();
    } else if (activeMethod === 'json') {
        importFromJSON();
    }
}

function importFromCSV() {
    if (importData.validRows.length === 0) {
        showToast('אין שורות תקינות לייבוא', 'warning');
        return;
    }
    
    let imported = 0;
    let skipped = 0;
    
    importData.validRows.forEach(row => {
        // Check again if apartment exists (in case data changed)
        const existing = appState.tenants.find(t => t.apartment === row.apartment);
        if (existing) {
            skipped++;
            return;
        }
        
        const tenant = {
            id: generateId(),
            apartment: row.apartment,
            name: row.name,
            phone: row.phone,
            email: row.email,
            monthlyAmount: row.monthlyAmount,
            status: 'pending',
            lastPayment: null,
            monthlyPayments: {}
        };
        
        appState.tenants.push(tenant);
        imported++;
    });
    
    saveDataToStorage();
    renderTenantsTable();
    updateAllStatistics();
    
    hideModal('importDataModal');
    
    let message = `ייבוא הושלם! ${imported} דיירים נוספו`;
    if (skipped > 0) {
        message += `, ${skipped} דוּלגו (כבר קיימים)`;
    }
    showToast(message, 'success');
    addActivity(`יובאו ${imported} דיירים מקובץ CSV`, 'import');
}

function importFromJSON() {
    if (!importData.json) {
        showToast('אין נתונים לייבוא', 'warning');
        return;
    }
    
    const data = importData.json;
    let imported = 0;
    let skipped = 0;
    
    // Import tenants
    if (data.tenants && Array.isArray(data.tenants)) {
        data.tenants.forEach(tenant => {
            const existing = appState.tenants.find(t => t.apartment === tenant.apartment);
            if (existing) {
                skipped++;
                return;
            }
            
            // Ensure tenant has required fields
            if (!tenant.id) tenant.id = generateId();
            if (!tenant.monthlyPayments) tenant.monthlyPayments = {};
            
            appState.tenants.push(tenant);
            imported++;
        });
    }
    
    // Import payments
    let importedPayments = 0;
    if (data.payments && Array.isArray(data.payments)) {
        data.payments.forEach(payment => {
            if (!payment.id) payment.id = generateId();
            appState.payments.push(payment);
            importedPayments++;
        });
    }
    
    // Import expenses
    let importedExpenses = 0;
    if (data.expenses && Array.isArray(data.expenses)) {
        data.expenses.forEach(expense => {
            if (!expense.id) expense.id = generateId();
            appState.expenses.push(expense);
            importedExpenses++;
        });
    }
    
    // Optionally import settings (skip for now to preserve existing settings)
    
    saveDataToStorage();
    renderTenantsTable();
    updateAllStatistics();
    
    hideModal('importDataModal');
    
    let message = `ייבוא הושלם! ${imported} דיירים, ${importedPayments} תשלומים, ${importedExpenses} הוצאות נוספו`;
    if (skipped > 0) {
        message += ` (${skipped} דיירים דולגו - כבר קיימים)`;
    }
    showToast(message, 'success');
    addActivity(`יובאו נתונים מקובץ JSON: ${imported} דיירים`, 'import');
}

// ===================================
// Settings Management
// ===================================

function loadSettings() {
    document.getElementById('buildingName').value = appState.settings.buildingName;
    document.getElementById('defaultAmount').value = appState.settings.defaultAmount;
    document.getElementById('paymentDay').value = appState.settings.paymentDay;
    document.getElementById('chairpersonName').value = appState.settings.chairpersonName || '';
    document.getElementById('chairpersonPhone').value = appState.settings.chairpersonPhone || '';
    document.getElementById('treasurerName').value = appState.settings.treasurerName || '';
    document.getElementById('treasurerPhone').value = appState.settings.treasurerPhone || '';
    document.getElementById('whatsappNotifications').checked = appState.settings.whatsappNotifications;
    document.getElementById('emailNotifications').checked = appState.settings.emailNotifications;
    document.getElementById('smsNotifications').checked = appState.settings.smsNotifications;
    document.getElementById('reminderDays').value = appState.settings.reminderDays;
    document.getElementById('autoMonthlyBilling').checked = appState.settings.autoMonthlyBilling;
    document.getElementById('autoBackup').checked = appState.settings.autoBackup;
    
    const lastBackup = localStorage.getItem('lastBackupDate');
    document.getElementById('lastBackupDate').textContent = lastBackup ? 
        formatDate(lastBackup) : 'אף פעם';
    
    // Update signature preview
    updateSignaturePreview();
}

function saveGeneralSettings() {
    appState.settings.buildingName = document.getElementById('buildingName').value;
    appState.settings.defaultAmount = parseFloat(document.getElementById('defaultAmount').value);
    appState.settings.paymentDay = parseInt(document.getElementById('paymentDay').value);
    
    saveDataToStorage();
    showToast('ההגדרות נשמרו בהצלחה!', 'success');
}

function saveNotificationSettings() {
    appState.settings.whatsappNotifications = document.getElementById('whatsappNotifications').checked;
    appState.settings.emailNotifications = document.getElementById('emailNotifications').checked;
    appState.settings.smsNotifications = document.getElementById('smsNotifications').checked;
    appState.settings.reminderDays = parseInt(document.getElementById('reminderDays').value);
    appState.settings.autoMonthlyBilling = document.getElementById('autoMonthlyBilling').checked;
    
    saveDataToStorage();
    showToast('הגדרות ההתראות נשמרו!', 'success');
}

function applySettings() {
    // Apply theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerHTML = isDark ? 
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    showToast(`מצב ${isDark ? 'כהה' : 'בהיר'} הופעל`, 'info');
}

// ===================================
// Backup & Restore
// ===================================

function checkAutoBackup() {
    if (!appState.settings.autoBackup) return;
    
    const lastBackup = localStorage.getItem('lastBackupDate');
    if (!lastBackup || Date.now() - new Date(lastBackup).getTime() > APP_CONFIG.autoBackupInterval) {
        createBackup();
    }
}

function createBackup() {
    const backup = {
        version: APP_CONFIG.version,
        timestamp: new Date().toISOString(),
        data: {
            tenants: appState.tenants,
            payments: appState.payments,
            expenses: appState.expenses,
            activities: appState.activities,
            settings: appState.settings,
        }
    };
    
    localStorage.setItem(APP_CONFIG.backupKey, JSON.stringify(backup));
    localStorage.setItem('lastBackupDate', backup.timestamp);
    
    return backup;
}

function downloadBackup() {
    const backup = createBackup();
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `גיבוי_דיירים_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('הגיבוי הורד בהצלחה!', 'success');
    addActivity('נוצר גיבוי', 'backup');
    hideModal('backupModal');
}

function uploadBackup() {
    const input = document.getElementById('backupFileInput');
    input.click();
}

function quickBackup() {
    showLoading();
    
    // Create backup
    const backup = createBackup();
    
    // Download immediately
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `גיבוי_דיירים_${dateStr}_${timeStr}.json`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    setTimeout(() => {
        hideLoading();
        
        // Show detailed success message with location info
        const fileSize = (new Blob([dataStr]).size / 1024).toFixed(2);
        const message = `
            <div style="text-align: right; line-height: 1.8;">
                <div style="font-size: 1.2rem; margin-bottom: 10px;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <strong>הגיבוי הורד בהצלחה!</strong>
                </div>
                <div style="background: ${isDarkMode ? '#064e3b' : '#f0fdf4'}; padding: 15px; border-radius: 8px; margin: 10px 0; color: ${isDarkMode ? '#d1fae5' : 'inherit'};">
                    <div style="margin: 5px 0;"><strong>📁 שם הקובץ:</strong><br>${fileName}</div>
                    <div style="margin: 5px 0;"><strong>💾 גודל:</strong> ${fileSize} KB</div>
                    <div style="margin: 5px 0;"><strong>📊 נתונים:</strong> ${appState.tenants.length} דיירים, ${appState.payments.length} תשלומים</div>
                </div>
                <div style="background: ${isDarkMode ? '#78350f' : '#fff7ed'}; padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 0.95rem; color: ${isDarkMode ? '#fef3c7' : 'inherit'};">
                    <strong>📂 איפה הקובץ?</strong><br>
                    • <strong>במחשב:</strong> תיקיית Downloads<br>
                    • <strong>בטלפון:</strong> תיקיית הורדות / Files<br>
                    <div style="margin-top: 8px; color: ${isDarkMode ? '#fbbf24' : '#92400e'};">
                        💡 <strong>טיפ:</strong> שמור את הקובץ במקום בטוח (Google Drive, Dropbox וכו')
                    </div>
                </div>
            </div>
        `;
        
        // Create custom modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s;
        `;
        
        const content = document.createElement('div');
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        content.style.cssText = `
            background: ${isDarkMode ? '#1f2937' : 'white'};
            color: ${isDarkMode ? '#f3f4f6' : '#1f2937'};
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideIn 0.3s;
        `;
        content.innerHTML = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-check"></i> הבנתי, תודה!';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-top: 15px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            font-weight: 600;
        `;
        closeBtn.onclick = () => {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        };
        
        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes slideIn {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        addActivity(`נוצר גיבוי מהיר - ${appState.tenants.length} דיירים, ${appState.payments.length} תשלומים`, 'backup');
    }, 500);
}

async function downloadFullApp() {
    showLoading();
    
    try {
        // Check if JSZip is loaded
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded');
        }
        
        const zip = new JSZip();
        
        // Add HTML file
        const htmlResponse = await fetch('index.html');
        const htmlContent = await htmlResponse.text();
        zip.file('index.html', htmlContent);
        
        // Add install.html
        const installResponse = await fetch('install.html');
        const installContent = await installResponse.text();
        zip.file('install.html', installContent);
        
        // Add CSS files
        const cssFolder = zip.folder('css');
        const cssResponse = await fetch('css/style.css');
        const cssContent = await cssResponse.text();
        cssFolder.file('style.css', cssContent);
        
        // Add JS files
        const jsFolder = zip.folder('js');
        const jsResponse = await fetch('js/app.js');
        const jsContent = await jsResponse.text();
        jsFolder.file('app.js', jsContent);
        
        // Add icon
        const iconResponse = await fetch('icon-512.png');
        const iconBlob = await iconResponse.blob();
        zip.file('icon-512.png', iconBlob);
        
        // Add manifest.json
        const manifestResponse = await fetch('manifest.json');
        const manifestContent = await manifestResponse.text();
        zip.file('manifest.json', manifestContent);
        
        // Add service worker
        const swResponse = await fetch('sw.js');
        const swContent = await swResponse.text();
        zip.file('sw.js', swContent);
        
        // Add documentation files
        const readmeResponse = await fetch('README.md');
        const readmeContent = await readmeResponse.text();
        zip.file('README.md', readmeContent);
        
        const changelogResponse = await fetch('CHANGELOG.md');
        const changelogContent = await changelogResponse.text();
        zip.file('CHANGELOG.md', changelogContent);
        
        const licenseResponse = await fetch('LICENSE.md');
        const licenseContent = await licenseResponse.text();
        zip.file('LICENSE.md', licenseContent);
        
        // Add PWA installation guide
        try {
            const pwaGuideResponse = await fetch('PWA-INSTALL-GUIDE.md');
            const pwaGuideContent = await pwaGuideResponse.text();
            zip.file('PWA-INSTALL-GUIDE.md', pwaGuideContent);
        } catch (e) {
            console.log('PWA-INSTALL-GUIDE.md not found, skipping...');
        }
        
        // Generate ZIP file
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        
        // Create download link
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        link.href = url;
        link.download = `מערכת-ניהול-דיירים-${dateStr}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        hideLoading();
        
        // Show success message
        const fileSize = (zipBlob.size / 1024).toFixed(2);
        const message = `
            <div style="text-align: right; line-height: 1.8;">
                <div style="font-size: 1.2rem; margin-bottom: 10px;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <strong>המערכת הורדה בהצלחה!</strong>
                </div>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <div style="margin: 5px 0;"><strong>📦 שם הקובץ:</strong><br>מערכת-ניהול-דיירים-${dateStr}.zip</div>
                    <div style="margin: 5px 0;"><strong>💾 גודל:</strong> ${fileSize} KB</div>
                    <div style="margin: 5px 0;"><strong>📄 קבצים:</strong> כל קבצי המערכת</div>
                </div>
                <div style="background: #fff7ed; padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 0.95rem;">
                    <strong>📂 מה בקובץ?</strong><br>
                    • index.html - הדף הראשי<br>
                    • install.html - דף ההתקנה<br>
                    • css/ - עיצוב<br>
                    • js/ - קוד JavaScript<br>
                    • icon-512.png - אייקון<br>
                    • manifest.json, sw.js - PWA<br>
                    • README.md, CHANGELOG.md - תיעוד<br>
                    <div style="margin-top: 8px; color: #92400e;">
                        💡 <strong>איך להשתמש:</strong> חלץ את הקובץ ופתח את index.html בדפדפן
                    </div>
                </div>
            </div>
        `;
        
        // Create custom modal
        const modal = document.createElement('div');
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: ${isDarkMode ? '#1f2937' : 'white'};
            color: ${isDarkMode ? '#f3f4f6' : '#1f2937'};
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideIn 0.3s;
        `;
        content.innerHTML = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-check"></i> הבנתי, תודה!';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-top: 15px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            font-weight: 600;
        `;
        closeBtn.onclick = () => {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        };
        
        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        addActivity('הורדה מלאה של המערכת כקובץ ZIP', 'download');
        
    } catch (error) {
        hideLoading();
        console.error('Error downloading full app:', error);
        showToast('שגיאה בהורדת המערכת. נסה שוב.', 'error');
    }
}

function restoreFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.data || !backup.data.tenants) {
                throw new Error('Invalid backup file');
            }
            
            if (confirm('האם אתה בטוח? פעולה זו תחליף את כל הנתונים הקיימים!')) {
                appState.tenants = backup.data.tenants;
                appState.payments = backup.data.payments || [];
                appState.activities = backup.data.activities || [];
                appState.settings = { ...appState.settings, ...backup.data.settings };
                
                saveDataToStorage();
                renderTenantsTable();
                updateAllStatistics();
                renderDashboard();
                
                showToast('הנתונים שוחזרו בהצלחה!', 'success');
                addActivity('שוחזרו נתונים מגיבוי', 'restore');
                hideModal('backupModal');
            }
        } catch (error) {
            showToast('שגיאה בשחזור הגיבוי', 'error');
            console.error(error);
        }
    };
    reader.readAsText(file);
}

function clearPaymentsHistory() {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל היסטוריית התשלומים?')) return;
    
    appState.payments = [];
    saveDataToStorage();
    renderPaymentsTable();
    updateAllStatistics();
    
    showToast('היסטוריית התשלומים נמחקה', 'warning');
    addActivity('נמחקה היסטוריית תשלומים', 'delete');
}

function clearAllData() {
    if (!confirm('אזהרה! פעולה זו תמחק את כל הנתונים! האם להמשיך?')) return;
    if (!confirm('האם אתה בטוח לחלוטין? לא ניתן לשחזר את הנתונים!')) return;
    
    appState.tenants = [];
    appState.payments = [];
    appState.activities = [];
    
    saveDataToStorage();
    renderTenantsTable();
    renderPaymentsTable();
    updateAllStatistics();
    renderDashboard();
    
    showToast('כל הנתונים נמחקו', 'warning');
}

// ===================================
// Bulk Actions
// ===================================

function updateCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.tenant-checkbox');
    const selectAll = document.getElementById('selectAll');
    const bulkActions = document.getElementById('bulkActions');
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const tenantId = e.target.dataset.id;
            if (e.target.checked) {
                appState.selectedTenants.add(tenantId);
            } else {
                appState.selectedTenants.delete(tenantId);
            }
            updateBulkActionsUI();
        });
    });
    
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const tenantId = cb.dataset.id;
                if (e.target.checked) {
                    appState.selectedTenants.add(tenantId);
                } else {
                    appState.selectedTenants.delete(tenantId);
                }
            });
            updateBulkActionsUI();
        });
    }
}

function updateBulkActionsUI() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (appState.selectedTenants.size > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = `${appState.selectedTenants.size} נבחרו`;
    } else {
        bulkActions.style.display = 'none';
    }
}

function updatePaymentCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.payment-checkbox');
    const selectAllPayments = document.getElementById('selectAllPayments');
    const bulkPaymentActions = document.getElementById('bulkPaymentActions');
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const paymentId = e.target.dataset.id;
            if (e.target.checked) {
                appState.selectedPayments.add(paymentId);
            } else {
                appState.selectedPayments.delete(paymentId);
            }
            updateBulkPaymentActionsUI();
        });
    });
    
    if (selectAllPayments) {
        selectAllPayments.addEventListener('change', (e) => {
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const paymentId = cb.dataset.id;
                if (e.target.checked) {
                    appState.selectedPayments.add(paymentId);
                } else {
                    appState.selectedPayments.delete(paymentId);
                }
            });
            updateBulkPaymentActionsUI();
        });
    }
}

function updateBulkPaymentActionsUI() {
    const bulkPaymentActions = document.getElementById('bulkPaymentActions');
    const selectedPaymentCount = document.getElementById('selectedPaymentCount');
    
    if (appState.selectedPayments.size > 0) {
        if (bulkPaymentActions) bulkPaymentActions.style.display = 'flex';
        if (selectedPaymentCount) selectedPaymentCount.textContent = `${appState.selectedPayments.size} נבחרו`;
    } else {
        if (bulkPaymentActions) bulkPaymentActions.style.display = 'none';
    }
}

function bulkMarkPaid() {
    if (appState.selectedTenants.size === 0) return;
    
    if (!confirm(`האם לסמן ${appState.selectedTenants.size} דיירים כשילמו?`)) return;
    
    const paymentDate = new Date().toISOString();
    let successCount = 0;
    
    appState.selectedTenants.forEach(id => {
        const tenant = appState.tenants.find(t => t.id === id);
        if (tenant) {
            // עדכון סטטוס הדייר
            tenant.status = 'paid';
            tenant.lastPayment = paymentDate;
            
            // יצירת רשומת תשלום חדשה בלשונית תשלומים
            const payment = {
                id: generateId(),
                tenantId: tenant.id,
                tenantName: tenant.name,
                apartment: tenant.apartment,
                amount: tenant.monthlyAmount,
                date: paymentDate,
                method: 'other', // ברירת מחדל
                notes: 'תשלום שסומן מלשונית דיירים',
                createdAt: paymentDate
            };
            
            appState.payments.push(payment);
            successCount++;
            
            addActivity(`תשלום נרשם עבור ${tenant.name} - ₪${tenant.monthlyAmount}`, 'payment');
        }
    });
    
    appState.selectedTenants.clear();
    saveDataToStorage();
    renderTenantsTable();
    renderPaymentsTable(); // ⭐ עדכון גם טבלת תשלומים
    updateAllStatistics();
    renderDashboard();
    showToast(`${successCount} דיירים סומנו כשילמו ונרשמו בלשונית תשלומים!`, 'success');
}

function bulkSendReminder() {
    if (appState.selectedTenants.size === 0) return;
    
    showToast(`נשלחו תזכורות ל-${appState.selectedTenants.size} דיירים (סימולציה)`, 'info');
    addActivity(`נשלחו תזכורות ל-${appState.selectedTenants.size} דיירים`, 'notification');
}

function bulkDelete() {
    if (appState.selectedTenants.size === 0) return;
    
    if (!confirm(`האם למחוק ${appState.selectedTenants.size} דיירים?`)) return;
    
    appState.tenants = appState.tenants.filter(t => !appState.selectedTenants.has(t.id));
    appState.selectedTenants.clear();
    
    saveDataToStorage();
    renderTenantsTable();
    updateAllStatistics();
    showToast('הדיירים נמחקו בהצלחה', 'success');
}

// ===================================
// Event Listeners Setup
// ===================================

function setupEventListeners() {
    // Tenant Management
    document.getElementById('addTenantBtn')?.addEventListener('click', addTenant);
    document.getElementById('tenantForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = new FormData();
        data.append('apartment', document.getElementById('apartment').value);
        data.append('name', document.getElementById('tenantName').value);
        data.append('phone', document.getElementById('phone').value);
        data.append('email', document.getElementById('email').value);
        data.append('monthlyAmount', document.getElementById('monthlyAmount').value);
        data.append('status', document.getElementById('paymentStatus').value);
        data.append('notes', document.getElementById('notes').value);
        saveTenant(data);
    });
    
    // Payment Management
    document.getElementById('recordPaymentBtn')?.addEventListener('click', recordPayment);
    document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('tenantId', document.getElementById('paymentTenant').value);
        formData.append('amount', document.getElementById('paymentAmount').value);
        formData.append('date', document.getElementById('paymentDate').value);
        formData.append('method', document.getElementById('paymentMethod').value);
        formData.append('notes', document.getElementById('paymentNotes').value);
        savePayment(formData);
    });
    
    // Search and Filter (Tenants)
    document.getElementById('searchInput')?.addEventListener('input', renderTenantsTable);
    document.getElementById('sortBy')?.addEventListener('change', renderTenantsTable);
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        renderTenantsTable();
        showToast('הנתונים רוענו', 'success');
    });
    
    // Payment Filters
    document.getElementById('paymentTenantFilter')?.addEventListener('change', (e) => {
        filterPaymentsByTenant(e.target.value);
    });
    document.getElementById('paymentStatusFilter')?.addEventListener('change', filterPaymentsByStatus);
    
    // Bulk Actions for Payments
    document.getElementById('bulkSendReceiptBtn')?.addEventListener('click', bulkSendReceipts);
    document.getElementById('bulkSendWhatsappPaymentsBtn')?.addEventListener('click', bulkSendWhatsappPayments);
    document.getElementById('bulkMarkPaidPaymentsBtn')?.addEventListener('click', bulkMarkPaidPayments);
    document.getElementById('bulkDeletePaymentsBtn')?.addEventListener('click', bulkDeletePayments);
    
    // Reports
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
    document.getElementById('exportPdfBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
    
    // Expenses Management
    document.getElementById('addExpenseBtn')?.addEventListener('click', addExpense);
    document.getElementById('expenseForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('date', document.getElementById('expenseDate').value);
        formData.append('category', document.getElementById('expenseCategory').value);
        formData.append('description', document.getElementById('expenseDescription').value);
        formData.append('amount', document.getElementById('expenseAmount').value);
        formData.append('paidBy', document.getElementById('expensePaidBy').value);
        formData.append('notes', document.getElementById('expenseNotes').value);
        saveExpense(formData);
    });
    document.getElementById('expenseSearchInput')?.addEventListener('input', renderExpensesTable);
    document.getElementById('expenseCategoryFilter')?.addEventListener('change', renderExpensesTable);
    document.getElementById('refreshExpensesBtn')?.addEventListener('click', () => {
        renderExpensesTable();
        showToast('הנתונים רוענו', 'success');
    });
    document.getElementById('closeExpenseModal')?.addEventListener('click', () => hideModal('expenseModal'));
    document.getElementById('cancelExpenseBtn')?.addEventListener('click', () => hideModal('expenseModal'));
    
    // Annual Payment
    document.getElementById('recordAnnualPaymentBtn')?.addEventListener('click', openAnnualPaymentModal);
    document.getElementById('annualPaymentTenant')?.addEventListener('change', updateAnnualPaymentInfo);
    document.getElementById('annualPaymentForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('tenantId', document.getElementById('annualPaymentTenant').value);
        formData.append('date', document.getElementById('annualPaymentDate').value);
        formData.append('method', document.getElementById('annualPaymentMethod').value);
        formData.append('notes', document.getElementById('annualPaymentNotes').value);
        saveAnnualPayment(formData);
    });
    document.getElementById('closeAnnualPaymentModal')?.addEventListener('click', () => hideModal('annualPaymentModal'));
    document.getElementById('cancelAnnualPaymentBtn')?.addEventListener('click', () => hideModal('annualPaymentModal'));
    
    // WhatsApp Integration
    document.getElementById('bulkSendWhatsappBtn')?.addEventListener('click', bulkSendWhatsapp);
    document.getElementById('whatsappTemplate')?.addEventListener('change', updateWhatsappMessage);
    document.getElementById('sendWhatsappBtn')?.addEventListener('click', sendWhatsapp);
    document.getElementById('closeWhatsappModal')?.addEventListener('click', () => hideModal('whatsappModal'));
    
    // Receipt Modal
    document.getElementById('sendReceiptWhatsappBtn')?.addEventListener('click', sendReceiptWhatsapp);
    document.getElementById('downloadReceiptBtn')?.addEventListener('click', downloadReceipt);
    document.getElementById('printReceiptBtn')?.addEventListener('click', printReceipt);
    document.getElementById('closeReceiptModal')?.addEventListener('click', () => hideModal('receiptModal'));
    
    // Monthly Tracking
    document.getElementById('prevYearBtn')?.addEventListener('click', () => changeTrackingYear(-1));
    document.getElementById('nextYearBtn')?.addEventListener('click', () => changeTrackingYear(1));
    document.getElementById('saveMonthlyChangesBtn')?.addEventListener('click', saveMonthlyChanges);
    document.getElementById('generateMonthlyReceiptBtn')?.addEventListener('click', generateMonthlyReceipt);
    document.getElementById('closeMonthlyTrackingModal')?.addEventListener('click', () => hideModal('monthlyTrackingModal'));
    document.getElementById('closeTrackingBtn')?.addEventListener('click', () => hideModal('monthlyTrackingModal'));
    
    // Category Expenses Modal
    document.getElementById('closeCategoryExpensesModal')?.addEventListener('click', () => hideModal('categoryExpensesModal'));
    
    // Settings
    document.getElementById('saveGeneralSettings')?.addEventListener('click', saveGeneralSettings);
    document.getElementById('saveCommitteeSettings')?.addEventListener('click', saveCommitteeSettings);
    document.getElementById('saveNotificationSettings')?.addEventListener('click', saveNotificationSettings);
    document.getElementById('clearPaymentsBtn')?.addEventListener('click', clearPaymentsHistory);
    document.getElementById('clearAllDataBtn')?.addEventListener('click', clearAllData);
    
    // Digital Signature
    document.getElementById('openSignatureModalBtn')?.addEventListener('click', openSignatureModal);
    document.getElementById('clearSignatureBtn')?.addEventListener('click', clearSignature);
    document.getElementById('saveSignatureBtn')?.addEventListener('click', saveSignature);
    document.getElementById('clearSignaturePadBtn')?.addEventListener('click', clearSignaturePad);
    document.getElementById('closeSignatureModal')?.addEventListener('click', () => hideModal('signatureModal'));
    document.getElementById('cancelSignatureBtn')?.addEventListener('click', () => hideModal('signatureModal'));
    
    // Theme Toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    
    // Mobile Menu Auto Close
    setupMobileMenuAutoClose();
    
    // Backup & Restore
    document.getElementById('backupBtn')?.addEventListener('click', () => showModal('backupModal'));
    document.getElementById('createBackupBtn')?.addEventListener('click', () => showModal('backupModal'));
    document.getElementById('restoreBackupBtn')?.addEventListener('click', () => showModal('backupModal'));
    document.getElementById('downloadBackupBtn')?.addEventListener('click', downloadBackup);
    document.getElementById('uploadBackupBtn')?.addEventListener('click', uploadBackup);
    document.getElementById('quickBackupBtn')?.addEventListener('click', quickBackup);
    document.getElementById('backupFileInput')?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            restoreFromFile(e.target.files[0]);
        }
    });
    
    // Download Full App
    document.getElementById('downloadFullAppBtn')?.addEventListener('click', downloadFullApp);
    
    // Modal Controls
    document.getElementById('closeTenantModal')?.addEventListener('click', () => hideModal('tenantModal'));
    document.getElementById('cancelTenantBtn')?.addEventListener('click', () => hideModal('tenantModal'));
    document.getElementById('closePaymentModal')?.addEventListener('click', () => hideModal('paymentModal'));
    document.getElementById('cancelPaymentBtn')?.addEventListener('click', () => hideModal('paymentModal'));
    document.getElementById('closeBackupModal')?.addEventListener('click', () => hideModal('backupModal'));
    
    // Import Data
    document.getElementById('importDataBtn')?.addEventListener('click', openImportDataModal);
    document.getElementById('closeImportDataModal')?.addEventListener('click', () => hideModal('importDataModal'));
    document.getElementById('cancelImportBtn')?.addEventListener('click', () => hideModal('importDataModal'));
    document.getElementById('executeImportBtn')?.addEventListener('click', executeImport);
    document.getElementById('downloadTemplateBtn')?.addEventListener('click', downloadTemplate);
    
    // Import Method Selection
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const method = btn.dataset.method;
            document.getElementById('csvImportSection').style.display = method === 'csv' ? 'block' : 'none';
            document.getElementById('jsonImportSection').style.display = method === 'json' ? 'block' : 'none';
        });
    });
    
    // CSV File Upload
    document.getElementById('csvFileUploadArea')?.addEventListener('click', () => {
        document.getElementById('csvFileInput')?.click();
    });
    document.getElementById('csvFileInput')?.addEventListener('change', handleCSVFileSelect);
    
    // JSON File Upload
    document.getElementById('jsonFileUploadArea')?.addEventListener('click', () => {
        document.getElementById('jsonFileInput')?.click();
    });
    document.getElementById('jsonFileInput')?.addEventListener('change', handleJSONFileSelect);
    
    // Drag and Drop Support for CSV
    const csvUploadArea = document.getElementById('csvFileUploadArea');
    if (csvUploadArea) {
        csvUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            csvUploadArea.style.borderColor = 'var(--primary-color)';
            csvUploadArea.style.background = 'var(--bg-primary)';
        });
        
        csvUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            csvUploadArea.style.borderColor = 'var(--border-color)';
            csvUploadArea.style.background = 'var(--bg-secondary)';
        });
        
        csvUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            csvUploadArea.style.borderColor = 'var(--border-color)';
            csvUploadArea.style.background = 'var(--bg-secondary)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('csvFileInput').files = files;
                handleCSVFileSelect({ target: { files: files } });
            }
        });
    }
    
    // Drag and Drop Support for JSON
    const jsonUploadArea = document.getElementById('jsonFileUploadArea');
    if (jsonUploadArea) {
        jsonUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            jsonUploadArea.style.borderColor = 'var(--primary-color)';
            jsonUploadArea.style.background = 'var(--bg-primary)';
        });
        
        jsonUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            jsonUploadArea.style.borderColor = 'var(--border-color)';
            jsonUploadArea.style.background = 'var(--bg-secondary)';
        });
        
        jsonUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            jsonUploadArea.style.borderColor = 'var(--border-color)';
            jsonUploadArea.style.background = 'var(--bg-secondary)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('jsonFileInput').files = files;
                handleJSONFileSelect({ target: { files: files } });
            }
        });
    }
}

// ===================================
// Utility Functions
// ===================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'עכשיו';
    if (minutes < 60) return `לפני ${minutes} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    return `לפני ${days} ימים`;
}

function isCurrentMonth(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function getStatusText(status) {
    const statusMap = {
        paid: 'שולם',
        pending: 'ממתין',
        overdue: 'באיחור'
    };
    return statusMap[status] || status;
}

function getPaymentMethodText(method) {
    const methodMap = {
        cash: 'מזומן',
        check: "צ'ק",
        transfer: 'העברה',
        credit: 'אשראי'
    };
    return methodMap[method] || method;
}

function getActivityIcon(type) {
    const iconMap = {
        add: 'plus',
        edit: 'edit',
        delete: 'trash',
        payment: 'money-bill-wave',
        notification: 'bell',
        report: 'file-alt',
        backup: 'database',
        restore: 'upload',
        export: 'download',
        info: 'info-circle'
    };
    return iconMap[type] || 'circle';
}

function addActivity(message, type = 'info') {
    appState.activities.push({
        id: generateId(),
        message,
        type,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 activities
    if (appState.activities.length > 100) {
        appState.activities = appState.activities.slice(-100);
    }
    
    saveDataToStorage();
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-times-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };
    
    toast.className = `toast ${type}`;
    toastIcon.innerHTML = icons[type];
    toastMessage.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function showNewFeatureNotification() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: ${isDarkMode ? '#1f2937' : 'white'};
        color: ${isDarkMode ? '#f3f4f6' : '#1f2937'};
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: slideIn 0.3s;
        text-align: center;
    `;
    
    content.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">🔄✨</div>
        <h2 style="color: ${isDarkMode ? '#a78bfa' : '#8b5cf6'}; margin: 0 0 15px 0; font-size: 1.8rem;">
            🎉 תכונה חדשה!
        </h2>
        <h3 style="margin: 0 0 20px 0; font-size: 1.4rem;">
            סנכרון אוטומטי בין דיירים ← → תשלומים
        </h3>
        <div style="text-align: right; background: ${isDarkMode ? '#374151' : '#f3f4f6'}; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 10px 0; font-size: 1.1rem;"><strong>✅ מה חדש?</strong></p>
            <ul style="margin: 15px 0; padding-right: 25px; line-height: 1.8;">
                <li><strong>סמן "שולם"</strong> → נרשם בלשונית תשלומים אוטומטית!</li>
                <li><strong>מחק תשלום</strong> → הסטטוס מתעדכן ל"ממתין"</li>
                <li><strong>עריכת דייר</strong> → שינוי ל"שולם" יוצר תשלום</li>
                <li>כל שינוי מסונכרן <strong>מיידית</strong> בשתי הלשוניות</li>
                <li>אין צורך בעבודה כפולה יותר!</li>
            </ul>
            <p style="margin: 10px 0; font-size: 1rem; color: ${isDarkMode ? '#a78bfa' : '#8b5cf6'};"><strong>💡 איך זה עובד?</strong></p>
            <ol style="margin: 10px 0; padding-right: 25px; line-height: 1.6;">
                <li>לך ללשונית <strong>"דיירים"</strong></li>
                <li>בחר דייר/ים וסמן <strong>"שולם"</strong></li>
                <li>עבור ללשונית <strong>"תשלומים"</strong></li>
                <li>בום! 💥 התשלום כבר שם!</li>
                <li>הכל מסונכרן אוטומטית ✅</li>
            </ol>
        </div>
        <div style="margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 10px; color: white;">
            <strong style="font-size: 1.2rem;">🔄 גרסה 2.4.8</strong><br>
            <span style="font-size: 0.9rem;">עדכון: 05/12/2024</span>
        </div>
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-check"></i> הבנתי, תודה!';
    closeBtn.style.cssText = `
        width: 100%;
        padding: 15px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    `;
    closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.05)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';
    closeBtn.onclick = () => {
        modal.style.animation = 'fadeOut 0.3s';
        setTimeout(() => modal.remove(), 300);
    };
    
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Log the notification
    addActivity('צפה בהודעה על תכונת קבלות PDF החדשה', 'info');
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ===================================
// Expenses Management
// ===================================

function renderExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('expenseSearchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('expenseCategoryFilter')?.value || 'all';
    
    let filteredExpenses = appState.expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredExpenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">אין הוצאות רשומות</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filteredExpenses.map(expense => `
        <tr>
            <td>${formatDate(expense.date)}</td>
            <td>${getCategoryNameHe(expense.category)}</td>
            <td>${expense.description}</td>
            <td><strong>₪${expense.amount}</strong></td>
            <td>${expense.paidBy || '-'}</td>
            <td>
                ${expense.receiptImage ? `
                    <button class="action-btn" style="background: #10b981; color: white;" onclick="viewExpenseReceipt('${expense.id}')" title="צפה בקבלה">
                        <i class="fas fa-image"></i>
                    </button>
                ` : '<span style="color: #9ca3af;">-</span>'}
            </td>
            <td>${expense.notes || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" onclick="editExpense('${expense.id}')" title="ערוך">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteExpense('${expense.id}')" title="מחק">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    updateExpenseSummary();
}

function updateExpenseSummary() {
    const categories = ['electricity', 'elevator', 'cleaning', 'gardening', 'maintenance', 'antenna', 'water', 'other'];
    
    categories.forEach(cat => {
        const total = appState.expenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + e.amount, 0);
        const elem = document.getElementById(`${cat}Total`);
        if (elem) elem.textContent = `₪${total.toLocaleString()}`;
    });
    
    const monthlyTotal = appState.expenses
        .filter(e => isCurrentMonth(e.date))
        .reduce((sum, e) => sum + e.amount, 0);
    
    const yearlyTotal = appState.expenses
        .filter(e => isCurrentYear(e.date))
        .reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById('monthlyExpenseTotal').textContent = `₪${monthlyTotal.toLocaleString()}`;
    document.getElementById('yearlyExpenseTotal').textContent = `₪${yearlyTotal.toLocaleString()}`;
}

function addExpense() {
    document.getElementById('expenseModalTitle').textContent = 'הוסף הוצאה חדשה';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseDate').valueAsDate = new Date();
    removeReceipt();
    showModal('expenseModal');
}

function editExpense(id) {
    const expense = appState.expenses.find(e => e.id === id);
    if (!expense) return;
    
    document.getElementById('expenseModalTitle').textContent = 'ערוך הוצאה';
    document.getElementById('expenseId').value = expense.id;
    document.getElementById('expenseDate').value = expense.date.split('T')[0];
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expensePaidBy').value = expense.paidBy || '';
    document.getElementById('expenseNotes').value = expense.notes || '';
    
    // Load existing receipt if available
    if (expense.receiptImage) {
        currentReceiptImage = expense.receiptImage;
        const fileName = document.getElementById('receiptFileName');
        if (fileName) {
            fileName.textContent = 'קבלה קיימת';
        }
        const preview = document.getElementById('receiptPreview');
        const previewImg = document.getElementById('receiptPreviewImg');
        if (preview && previewImg) {
            previewImg.src = expense.receiptImage;
            preview.style.display = 'block';
        }
    } else {
        removeReceipt();
    }
    
    showModal('expenseModal');
}

function saveExpense(formData) {
    const expenseData = {
        date: formData.get('date'),
        category: formData.get('category'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        paidBy: formData.get('paidBy'),
        notes: formData.get('notes'),
    };
    
    // Add receipt image if exists
    if (currentReceiptImage) {
        expenseData.receiptImage = currentReceiptImage;
    }
    
    const expenseId = document.getElementById('expenseId').value;
    
    if (expenseId) {
        const index = appState.expenses.findIndex(e => e.id === expenseId);
        if (index !== -1) {
            appState.expenses[index] = { ...appState.expenses[index], ...expenseData };
            addActivity(`עודכנה הוצאה: ${expenseData.description}`, 'edit');
        }
    } else {
        const newExpense = {
            id: generateId(),
            ...expenseData,
            createdAt: new Date().toISOString(),
        };
        appState.expenses.push(newExpense);
        addActivity(`נוספה הוצאה: ${expenseData.description} - ₪${expenseData.amount}`, 'add');
    }
    
    // Clear current receipt image
    currentReceiptImage = null;
    removeReceipt();
    
    saveDataToStorage();
    renderExpensesTable();
    hideModal('expenseModal');
    showToast('ההוצאה נשמרה בהצלחה!', 'success');
}

function deleteExpense(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return;
    
    const expense = appState.expenses.find(e => e.id === id);
    if (expense) {
        appState.expenses = appState.expenses.filter(e => e.id !== id);
        addActivity(`נמחקה הוצאה: ${expense.description}`, 'delete');
        saveDataToStorage();
        renderExpensesTable();
        showToast('ההוצאה נמחקה בהצלחה', 'success');
    }
}

// ===================================
// Edit Expenses by Category
// ===================================

function editExpensesByCategory(category) {
    const categoryExpenses = appState.expenses.filter(e => e.category === category);
    const categoryNameHe = getCategoryNameHe(category);
    
    // Update modal title
    document.getElementById('categoryExpensesTitle').textContent = categoryNameHe;
    
    // Render expenses in the modal table
    const tableBody = document.getElementById('categoryExpensesTableBody');
    
    if (categoryExpenses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <p style="color: #6b7280;">אין הוצאות בקטגוריה זו</p>
                    <button class="btn btn-primary" onclick="addExpenseInCategory('${category}')" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> הוסף הוצאה חדשה
                    </button>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = categoryExpenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(expense => `
                <tr>
                    <td>${formatDate(expense.date)}</td>
                    <td>${expense.description || '-'}</td>
                    <td style="font-weight: 600;">₪${expense.amount}</td>
                    <td>${expense.paidBy || '-'}</td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${expense.notes || '-'}</td>
                    <td>
                        ${expense.receiptImage 
                            ? `<button class="btn-icon btn-success" onclick="viewExpenseReceipt('${expense.id}')" title="צפה בקבלה">
                                <i class="fas fa-camera"></i>
                            </button>`
                            : '<span style="color: #9ca3af;">-</span>'
                        }
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon btn-primary" onclick="editExpense('${expense.id}')" title="ערוך">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="deleteExpenseFromCategory('${expense.id}', '${category}')" title="מחק">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
    }
    
    // Show the modal
    showModal('categoryExpensesModal');
}
window.editExpensesByCategory = editExpensesByCategory;

function addExpenseInCategory(category) {
    // Close the category modal
    hideModal('categoryExpensesModal');
    
    // Open the add expense modal with the category pre-selected
    addExpense();
    
    // Set the category after a small delay to ensure the modal is open
    setTimeout(() => {
        const categorySelect = document.getElementById('expenseCategory');
        if (categorySelect) {
            categorySelect.value = category;
        }
    }, 100);
}
window.addExpenseInCategory = addExpenseInCategory;

function deleteExpenseFromCategory(id, category) {
    if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return;
    
    const expense = appState.expenses.find(e => e.id === id);
    if (expense) {
        appState.expenses = appState.expenses.filter(e => e.id !== id);
        addActivity(`נמחקה הוצאה: ${expense.description}`, 'delete');
        saveDataToStorage();
        
        // Refresh both the category modal and the main expenses table
        editExpensesByCategory(category);
        renderExpensesTable();
        
        showToast('ההוצאה נמחקה בהצלחה', 'success');
    }
}
window.deleteExpenseFromCategory = deleteExpenseFromCategory;

// ===================================
// Expense Receipt Functions
// ===================================

let currentReceiptImage = null;

function captureReceiptPhoto() {
    const input = document.getElementById('expenseReceiptFile');
    // Trigger camera on mobile devices
    input.setAttribute('capture', 'environment');
    input.click();
}
window.captureReceiptPhoto = captureReceiptPhoto;

// Handle file selection
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('expenseReceiptFile');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleReceiptFile(file);
            }
        });
    }
});

function handleReceiptFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showToast('נא להעלות קובץ תמונה (JPG, PNG) או PDF בלבד', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('גודל הקובץ חייב להיות עד 5MB', 'error');
        return;
    }
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        currentReceiptImage = e.target.result;
        
        // Show file name
        const fileName = document.getElementById('receiptFileName');
        if (fileName) {
            fileName.textContent = file.name;
        }
        
        // Show preview for images
        if (file.type.startsWith('image/')) {
            const preview = document.getElementById('receiptPreview');
            const previewImg = document.getElementById('receiptPreviewImg');
            if (preview && previewImg) {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            }
        }
        
        showToast('הקבלה צורפה בהצלחה!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeReceipt() {
    currentReceiptImage = null;
    
    // Clear file input
    const fileInput = document.getElementById('expenseReceiptFile');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Clear file name
    const fileName = document.getElementById('receiptFileName');
    if (fileName) {
        fileName.textContent = '';
    }
    
    // Hide preview
    const preview = document.getElementById('receiptPreview');
    if (preview) {
        preview.style.display = 'none';
    }
    
    showToast('הקבלה הוסרה', 'info');
}
window.removeReceipt = removeReceipt;

function viewExpenseReceipt(expenseId) {
    const expense = appState.expenses.find(e => e.id === expenseId);
    if (!expense || !expense.receiptImage) {
        showToast('לא נמצאה קבלה להוצאה זו', 'error');
        return;
    }
    
    // Create modal to display receipt
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2><i class="fas fa-image"></i> קבלה - ${expense.description}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <img src="${expense.receiptImage}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="downloadExpenseReceipt('${expenseId}')">
                        <i class="fas fa-download"></i> הורד קבלה
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> סגור
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
window.viewExpenseReceipt = viewExpenseReceipt;

function downloadExpenseReceipt(expenseId) {
    const expense = appState.expenses.find(e => e.id === expenseId);
    if (!expense || !expense.receiptImage) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = expense.receiptImage;
    link.download = `קבלה_${expense.description}_${formatDate(expense.date)}.jpg`;
    link.click();
    
    showToast('הקבלה הורדה בהצלחה!', 'success');
}
window.downloadExpenseReceipt = downloadExpenseReceipt;

function getCategoryNameHe(category) {
    const names = {
        electricity: 'חשמל',
        elevator: 'מעלית',
        cleaning: 'ניקיון',
        gardening: 'גינון',
        maintenance: 'תחזוקה',
        antenna: 'קולטים',
        water: 'מים',
        other: 'אחר'
    };
    return names[category] || category;
}

// ===================================
// Mobile Bottom Navigation Init
// ===================================

// Initialize mobile bottom nav on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set first tab (dashboard) as active on mobile nav
    const firstNavItem = document.querySelector('.mobile-bottom-nav .nav-item[data-tab="dashboard"]');
    if (firstNavItem) {
        firstNavItem.classList.add('active');
    }
});

// ===================================
// PWA Installation
// ===================================

let deferredPrompt;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install card
    const installCard = document.getElementById('pwaInstallCard');
    if (installCard) {
        installCard.style.display = 'block';
    }
});

// Install button click handler
document.addEventListener('DOMContentLoaded', function() {
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                showToast('האפליקציה כבר מותקנת או שהדפדפן לא תומך בהתקנה', 'info');
                return;
            }
            
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                showToast('🎉 האפליקציה מותקנת! תמצא אותה במסך הבית', 'success');
                // Hide the install card
                const installCard = document.getElementById('pwaInstallCard');
                if (installCard) {
                    installCard.style.display = 'none';
                }
            } else {
                showToast('ההתקנה בוטלה', 'info');
            }
            
            // Clear the deferredPrompt
            deferredPrompt = null;
        });
    }
});

// Listen for successful installation
window.addEventListener('appinstalled', () => {
    showToast('🎉 האפליקציה הותקנה בהצלחה!', 'success');
    // Hide the install card
    const installCard = document.getElementById('pwaInstallCard');
    if (installCard) {
        installCard.style.display = 'none';
    }
    deferredPrompt = null;
});

function isCurrentYear(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date.getFullYear() === now.getFullYear();
}

// ===================================
// Notices (הודעות לדיירים)
// ===================================

// Preview notice
function previewNotice() {
    const type = document.getElementById('noticeType').value;
    const subject = document.getElementById('noticeSubject').value;
    const content = document.getElementById('noticeContent').value;
    const includeSignature = document.getElementById('noticeIncludeSignature').checked;
    const includeDate = document.getElementById('noticeIncludeDate').checked;
    
    if (!type || !subject || !content) {
        showToast('נא למלא את כל שדות החובה', 'error');
        return;
    }
    
    const preview = document.getElementById('noticePreview');
    const previewCard = document.getElementById('noticePreviewCard');
    
    // Get notice type in Hebrew
    const typeNames = {
        payment: 'הודעת תשלום',
        general: 'הודעה כללית',
        maintenance: 'הודעת תחזוקה',
        meeting: 'הודעת אסיפה',
        urgent: 'הודעה דחופה'
    };
    
    let html = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="color: var(--primary-color); font-size: 2rem; margin-bottom: 0.5rem;">
                ${typeNames[type] || type}
            </h1>
            ${includeDate ? `<p style="color: #6b7280; font-size: 0.9rem;">תאריך: ${formatDate(new Date().toISOString())}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.5rem; color: #111827; margin-bottom: 1rem; text-align: center;">
                ${subject}
            </h2>
        </div>
        
        <div style="line-height: 1.8; font-size: 1.1rem; color: #374151; white-space: pre-wrap; text-align: right;">
            ${content}
        </div>
    `;
    
    // Add signature if requested
    if (includeSignature) {
        const settings = appState.settings || {};
        const chairperson = settings.chairpersonName || '';
        const chairpersonPhone = settings.chairpersonPhone || '';
        const treasurer = settings.treasurerName || '';
        const signature = settings.signature || '';
        
        html += `
            <div style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #e5e7eb;">
                <p style="font-weight: 600; margin-bottom: 1rem;">בכבוד רב,</p>
                ${chairperson ? `<p><strong>יו"ר הועד:</strong> ${chairperson}</p>` : ''}
                ${chairpersonPhone ? `<p><strong>טלפון:</strong> ${chairpersonPhone}</p>` : ''}
                ${treasurer ? `<p style="margin-top: 0.5rem;"><strong>גזבר:</strong> ${treasurer}</p>` : ''}
                ${signature ? `<div style="margin-top: 1rem;"><img src="${signature}" style="max-width: 200px; height: auto;" alt="חתימה"></div>` : ''}
            </div>
        `;
    }
    
    preview.innerHTML = html;
    previewCard.style.display = 'block';
    
    // Scroll to preview
    previewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Generate PDF
async function generateNoticePdf() {
    const type = document.getElementById('noticeType').value;
    const subject = document.getElementById('noticeSubject').value;
    const content = document.getElementById('noticeContent').value;
    
    if (!type || !subject || !content) {
        showToast('נא למלא את כל שדות החובה', 'error');
        return;
    }
    
    // First preview the notice
    previewNotice();
    
    // Wait a moment for render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const element = document.getElementById('noticePreview');
    
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        const fileName = `הודעה_${subject.replace(/\s+/g, '_')}_${formatDate(new Date().toISOString())}.pdf`;
        pdf.save(fileName);
        
        showToast('PDF הורד בהצלחה!', 'success');
        
        // Save to history
        saveNoticeToHistory(type, subject, content);
        
    } catch (error) {
        console.error('שגיאה ביצירת PDF:', error);
        showToast('שגיאה ביצירת PDF', 'error');
    }
}

// Print notice
function printNotice() {
    const type = document.getElementById('noticeType').value;
    const subject = document.getElementById('noticeSubject').value;
    const content = document.getElementById('noticeContent').value;
    
    if (!type || !subject || !content) {
        showToast('נא למלא את כל שדות החובה', 'error');
        return;
    }
    
    // First preview the notice
    previewNotice();
    
    // Wait a moment
    setTimeout(() => {
        const printWindow = window.open('', '', 'width=800,height=600');
        const previewContent = document.getElementById('noticePreview').innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <title>${subject}</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        padding: 2cm;
                        direction: rtl;
                    }
                    @media print {
                        body { margin: 0; padding: 2cm; }
                    }
                </style>
            </head>
            <body>
                ${previewContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
        
        // Save to history
        saveNoticeToHistory(type, subject, content);
        
    }, 100);
}

// Save notice to history
function saveNoticeToHistory(type, subject, content) {
    if (!appState.notices) {
        appState.notices = [];
    }
    
    const notice = {
        id: generateId(),
        type,
        subject,
        content,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    appState.notices.unshift(notice);
    saveDataToStorage();
    renderNoticesHistory();
    
    showToast('ההודעה נשמרה בהיסטוריה', 'success');
}

// Render notices history
function renderNoticesHistory() {
    const tbody = document.getElementById('noticesHistoryTableBody');
    
    if (!appState.notices || appState.notices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">
                    אין הודעות קודמות
                </td>
            </tr>
        `;
        return;
    }
    
    const typeNames = {
        payment: 'תשלום',
        general: 'כללית',
        maintenance: 'תחזוקה',
        meeting: 'אסיפה',
        urgent: 'דחופה'
    };
    
    tbody.innerHTML = appState.notices.map(notice => `
        <tr>
            <td>${formatDate(notice.date)}</td>
            <td><span class="badge badge-primary">${typeNames[notice.type] || notice.type}</span></td>
            <td style="font-weight: 600;">${notice.subject}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-primary" onclick="viewNotice('${notice.id}')" title="צפה">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteNotice('${notice.id}')" title="מחק">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// View saved notice
function viewNotice(id) {
    const notice = appState.notices.find(n => n.id === id);
    if (!notice) return;
    
    // Fill form with saved notice
    document.getElementById('noticeType').value = notice.type;
    document.getElementById('noticeSubject').value = notice.subject;
    document.getElementById('noticeContent').value = notice.content;
    
    // Preview
    previewNotice();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete notice
function deleteNotice(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק הודעה זו?')) return;
    
    appState.notices = appState.notices.filter(n => n.id !== id);
    saveDataToStorage();
    renderNoticesHistory();
    showToast('ההודעה נמחקה', 'success');
}

// ===================================
// More Menu - Mobile Bottom Navigation
// ===================================

function openMoreMenu() {
    const overlay = document.getElementById('moreMenuOverlay');
    const menu = document.getElementById('moreMenu');
    
    if (overlay && menu) {
        overlay.classList.add('active');
        menu.classList.add('active');
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
    }
}

function closeMoreMenu() {
    const overlay = document.getElementById('moreMenuOverlay');
    const menu = document.getElementById('moreMenu');
    
    if (overlay && menu) {
        overlay.classList.remove('active');
        menu.classList.remove('active');
        // Re-enable body scroll
        document.body.style.overflow = '';
    }
}

// ===================================
// Tenant Actions Menu
// ===================================

let currentOpenActionsMenu = null;

function toggleTenantActions(tenantId, event) {
    event.stopPropagation();
    
    const menu = document.getElementById(`tenantActions-${tenantId}`);
    if (!menu) return;
    
    // Close any other open menus
    if (currentOpenActionsMenu && currentOpenActionsMenu !== menu) {
        currentOpenActionsMenu.style.display = 'none';
    }
    
    // Toggle current menu
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
        currentOpenActionsMenu = menu;
    } else {
        menu.style.display = 'none';
        currentOpenActionsMenu = null;
    }
}

function closeTenantActions() {
    if (currentOpenActionsMenu) {
        currentOpenActionsMenu.style.display = 'none';
        currentOpenActionsMenu = null;
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    if (currentOpenActionsMenu && !event.target.closest('.tenant-actions-wrapper')) {
        closeTenantActions();
    }
});

// Helper function for annual payment for specific tenant
function openAnnualPaymentForTenant(tenantId) {
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    // Open annual payment modal with pre-selected tenant
    openAnnualPaymentModal();
    // You can add logic to pre-select this tenant if needed
}

// Helper function for tenant reports
function viewTenantReports(tenantId) {
    // Navigate to reports section and filter by tenant
    showTab('reports');
    // Add filtering logic if needed
}

// Helper function for WhatsApp with tenant
function openWhatsappForTenant(tenantId) {
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    openWhatsappModal(tenant, 'billing');
}

// Event listeners for notices
document.addEventListener('DOMContentLoaded', function() {
    const previewBtn = document.getElementById('previewNoticeBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewNotice);
    }
    
    const generatePdfBtn = document.getElementById('generateNoticePdfBtn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generateNoticePdf);
    }
    
    const printBtn = document.getElementById('printNoticeBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printNotice);
    }
});

// ===================================
// WhatsApp Integration
// ===================================

function openWhatsappModal(tenant, messageType = 'billing') {
    appState.currentTenantForWhatsapp = tenant;
    
    document.getElementById('whatsappTemplate').value = messageType;
    updateWhatsappMessage();
    
    showModal('whatsappModal');
}

function updateWhatsappMessage() {
    const template = document.getElementById('whatsappTemplate').value;
    const messageArea = document.getElementById('whatsappMessage');
    const customArea = document.getElementById('customMessageArea');
    
    if (template === 'custom') {
        customArea.style.display = 'block';
        messageArea.style.display = 'none';
        return;
    }
    
    customArea.style.display = 'none';
    messageArea.style.display = 'block';
    
    const tenant = appState.currentTenantForWhatsapp;
    if (!tenant) return;
    
    const messages = {
        billing: generateBillingMessage(tenant),
        reminder: generateReminderMessage(tenant),
        receipt: generateReceiptMessage(tenant)
    };
    
    messageArea.value = messages[template] || '';
}

function generateBillingMessage(tenant) {
    const buildingName = appState.settings.buildingName || 'בניין';
    const paymentDay = appState.settings.paymentDay || 1;
    const currentMonth = new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    
    return `שלום ${tenant.name},

הודעת חיוב עבור ${currentMonth}

${buildingName}
דירה: ${tenant.apartment}
סכום לתשלום: ₪${tenant.monthlyAmount}

תאריך תשלום: ${paymentDay} לחודש

ניתן לשלם באמצעות:
💰 מזומן
🏦 העברה בנקאית
💳 כרטיס אשראי

תודה!
${appState.settings.treasurerName || 'גזבר הועד'}
${appState.settings.treasurerPhone || ''}`;
}

function generateReminderMessage(tenant) {
    return `שלום ${tenant.name},

תזכורת ידידותית לתשלום ועד הבית
דירה: ${tenant.apartment}
סכום: ₪${tenant.monthlyAmount}

נשמח אם תוכל לסדר את התשלום בהקדם.

תודה,
${appState.settings.treasurerName || 'גזבר הועד'}`;
}

function generateReceiptMessage(tenant) {
    const lastPayment = appState.payments
        .filter(p => p.tenantId === tenant.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (!lastPayment) return 'אין תשלום רשום';
    
    return `🧾 קבלה על תשלום

${appState.settings.buildingName || 'בניין'}
דירה: ${tenant.apartment}
שם: ${tenant.name}

תאריך תשלום: ${formatDate(lastPayment.date)}
סכום: ₪${lastPayment.amount}
אמצעי תשלום: ${getPaymentMethodText(lastPayment.method)}

תודה על התשלום!
${appState.settings.treasurerName || 'גזבר הועד'}`;
}

function sendWhatsapp() {
    const template = document.getElementById('whatsappTemplate').value;
    let message;
    
    if (template === 'custom') {
        message = document.getElementById('customWhatsappMessage').value;
    } else {
        message = document.getElementById('whatsappMessage').value;
    }
    
    const tenant = appState.currentTenantForWhatsapp;
    if (!tenant || !tenant.phone) {
        showToast('לא נמצא מספר טלפון לדייר', 'error');
        return;
    }
    
    const phone = tenant.phone.replace(/\D/g, '');
    const phoneWithPrefix = phone.startsWith('972') ? phone : '972' + phone.substring(1);
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneWithPrefix}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    addActivity(`נשלחה הודעת WhatsApp ל-${tenant.name}`, 'notification');
    hideModal('whatsappModal');
    showToast('נפתח WhatsApp...', 'success');
}

function bulkSendWhatsapp() {
    if (appState.selectedTenants.size === 0) {
        showToast('נא לבחור דיירים', 'warning');
        return;
    }
    
    let count = 0;
    appState.selectedTenants.forEach(tenantId => {
        const tenant = appState.tenants.find(t => t.id === tenantId);
        if (tenant && tenant.phone) {
            setTimeout(() => {
                openWhatsappModal(tenant, 'billing');
            }, count * 1000);
            count++;
        }
    });
    
    showToast(`מכין לשלוח ל-${count} דיירים...`, 'info');
}

// ===================================
// Bulk Actions for Payments
// ===================================

function bulkSendReceipts() {
    if (appState.selectedPayments.size === 0) {
        showToast('נא לבחור תשלומים', 'warning');
        return;
    }
    
    if (!confirm(`האם להפיק ${appState.selectedPayments.size} קבלות?`)) return;
    
    let count = 0;
    appState.selectedPayments.forEach(paymentId => {
        const payment = appState.payments.find(p => p.id === paymentId);
        if (payment) {
            setTimeout(() => {
                generateReceipt(payment);
            }, count * 500);
            count++;
        }
    });
    
    showToast(`מפיק ${count} קבלות...`, 'success');
    appState.selectedPayments.clear();
    renderPaymentsTable();
}

function bulkSendWhatsappPayments() {
    if (appState.selectedPayments.size === 0) {
        showToast('נא לבחור תשלומים', 'warning');
        return;
    }
    
    let count = 0;
    appState.selectedPayments.forEach(paymentId => {
        const payment = appState.payments.find(p => p.id === paymentId);
        const tenant = appState.tenants.find(t => t.id === payment?.tenantId);
        
        if (payment && tenant && tenant.phone) {
            setTimeout(() => {
                sendReceiptViaWhatsapp(payment, tenant);
            }, count * 1000);
            count++;
        }
    });
    
    showToast(`מכין לשלוח ל-${count} דיירים...`, 'info');
    appState.selectedPayments.clear();
    renderPaymentsTable();
}

function bulkMarkPaidPayments() {
    if (appState.selectedPayments.size === 0) {
        showToast('נא לבחור תשלומים', 'warning');
        return;
    }
    
    showToast('התשלומים כבר מסומנים כשולמו', 'info');
    appState.selectedPayments.clear();
    renderPaymentsTable();
}

function bulkDeletePayments() {
    if (appState.selectedPayments.size === 0) {
        showToast('נא לבחור תשלומים למחיקה', 'warning');
        return;
    }
    
    if (!confirm(`האם למחוק ${appState.selectedPayments.size} תשלומים? פעולה זו אינה ניתנת לביטול.`)) return;
    
    const selectedIds = Array.from(appState.selectedPayments);
    selectedIds.forEach(paymentId => {
        deletePayment(paymentId, true); // Pass true to skip confirmation
    });
    
    appState.selectedPayments.clear();
    showToast(`${selectedIds.length} תשלומים נמחקו`, 'success');
    renderPaymentsTable();
}

// ===================================
// Annual Payment
// ===================================

function openAnnualPaymentModal() {
    const select = document.getElementById('annualPaymentTenant');
    select.innerHTML = '<option value="">-- בחר דייר --</option>' + 
        appState.tenants.map(t => `
            <option value="${t.id}">${t.name} (דירה ${t.apartment})</option>
        `).join('');
    
    document.getElementById('annualPaymentDate').valueAsDate = new Date();
    document.getElementById('annualPaymentForm').reset();
    document.getElementById('annualPaymentInfo').style.display = 'none';
    
    showModal('annualPaymentModal');
}

function updateAnnualPaymentInfo() {
    const tenantId = document.getElementById('annualPaymentTenant').value;
    const infoDiv = document.getElementById('annualPaymentInfo');
    
    if (!tenantId) {
        infoDiv.style.display = 'none';
        return;
    }
    
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    const monthlyAmount = tenant.monthlyAmount;
    const annualAmount = monthlyAmount * 12;
    
    document.getElementById('annualMonthlyAmount').textContent = `₪${monthlyAmount}`;
    document.getElementById('annualTotalAmount').textContent = `₪${annualAmount.toLocaleString()}`;
    
    infoDiv.style.display = 'block';
}

function saveAnnualPayment(formData) {
    const tenantId = formData.get('tenantId');
    const tenant = appState.tenants.find(t => t.id === tenantId);
    
    if (!tenant) {
        showToast('שגיאה: דייר לא נמצא', 'error');
        return;
    }
    
    const annualAmount = tenant.monthlyAmount * 12;
    const paymentDate = formData.get('date');
    
    // Create payment record
    const payment = {
        id: generateId(),
        tenantId: tenantId,
        amount: annualAmount,
        date: paymentDate,
        method: formData.get('method'),
        notes: `תשלום שנתי (12 חודשים) - ${formData.get('notes') || ''}`,
        isAnnual: true,
        monthsCovered: 12,
        createdAt: new Date().toISOString(),
    };
    
    appState.payments.push(payment);
    
    // Update tenant status
    tenant.lastPayment = paymentDate;
    tenant.status = 'paid';
    tenant.annualPaymentUntil = new Date(new Date(paymentDate).setFullYear(new Date(paymentDate).getFullYear() + 1)).toISOString();
    
    addActivity(`נרשם תשלום שנתי: ${tenant.name} - ₪${annualAmount}`, 'payment');
    
    saveDataToStorage();
    renderPaymentsTable();
    renderTenantsTable();
    updateAllStatistics();
    renderDashboard();
    hideModal('annualPaymentModal');
    
    // Generate and show receipt
    appState.currentPaymentForReceipt = { tenant, payment };
    setTimeout(() => {
        if (confirm('האם ברצונך ליצור קבלה?')) {
            generateReceipt(tenant, payment);
        }
    }, 500);
    
    showToast('התשלום השנתי נרשם בהצלחה!', 'success');
}

// ===================================
// Receipt Generation
// ===================================

function generateReceipt(tenant, payment) {
    // Set current payment for receipt (in case it's called directly)
    appState.currentPaymentForReceipt = { tenant, payment };
    
    // Also save to sessionStorage as backup
    try {
        sessionStorage.setItem('currentPaymentForReceipt', JSON.stringify({ tenant, payment }));
        console.log('💾 Saved to sessionStorage:', { tenant: tenant.name, amount: payment.amount });
    } catch (e) {
        console.error('❌ Failed to save to sessionStorage:', e);
    }
    
    const receiptContent = document.getElementById('receiptContent');
    const currentDate = new Date().toLocaleDateString('he-IL');
    const receiptNumber = `${Date.now()}`.slice(-8);
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>${appState.settings.buildingName || 'ועד הבית'}</h2>
            <p>קבלה מס': ${receiptNumber}</p>
            <p>${currentDate}</p>
        </div>
        
        <div class="receipt-body">
            <div class="receipt-row">
                <strong>שם:</strong>
                <span>${tenant.name}</span>
            </div>
            <div class="receipt-row">
                <strong>דירה:</strong>
                <span>${tenant.apartment}</span>
            </div>
            <div class="receipt-row">
                <strong>תאריך תשלום:</strong>
                <span>${formatDate(payment.date)}</span>
            </div>
            <div class="receipt-row">
                <strong>אמצעי תשלום:</strong>
                <span>${getPaymentMethodText(payment.method)}</span>
            </div>
            ${payment.isAnnual ? `
            <div class="receipt-row">
                <strong>תקופה:</strong>
                <span>תשלום שנתי (12 חודשים)</span>
            </div>
            ` : ''}
            <hr style="margin: 1rem 0;">
            <div class="receipt-row" style="font-size: 1.2rem;">
                <strong>סכום:</strong>
                <strong>₪${payment.amount.toLocaleString()}</strong>
            </div>
        </div>
        
        <div class="receipt-footer">
            ${appState.settings.digitalSignature ? `
                <div style="text-align: center; margin-bottom: 1rem;">
                    <img src="${appState.settings.digitalSignature}" alt="חתימה" style="max-width: 200px; height: 60px; object-fit: contain;">
                </div>
            ` : `
                <p><strong>חתימה:</strong> _________________</p>
            `}
            <p>${appState.settings.treasurerName || 'גזבר הועד'}</p>
            <p>${appState.settings.treasurerPhone || ''}</p>
            <br>
            <p style="font-size: 0.8rem;">תודה על התשלום!</p>
        </div>
    `;
    
    console.log('🧾 generateReceipt completed');
    console.log('📊 currentPaymentForReceipt set to:', appState.currentPaymentForReceipt);
    console.log('👤 Tenant:', tenant.name);
    console.log('💰 Payment:', payment.amount);
    
    showModal('receiptModal');
}

async function sendReceiptWhatsapp() {
    console.log('🔍 sendReceiptWhatsapp called - Creating PDF');
    console.log('📊 currentPaymentForReceipt:', appState.currentPaymentForReceipt);
    
    // Try to restore from sessionStorage if empty
    if (!appState.currentPaymentForReceipt) {
        console.warn('⚠️ currentPaymentForReceipt is empty, trying to restore from sessionStorage...');
        try {
            const stored = sessionStorage.getItem('currentPaymentForReceipt');
            if (stored) {
                appState.currentPaymentForReceipt = JSON.parse(stored);
                console.log('✅ Restored from sessionStorage:', appState.currentPaymentForReceipt);
            } else {
                console.error('❌ No data in sessionStorage either!');
            }
        } catch (e) {
            console.error('❌ Failed to restore from sessionStorage:', e);
        }
    }
    
    if (!appState.currentPaymentForReceipt) {
        console.error('❌ currentPaymentForReceipt is still empty!');
        showToast('שגיאה: אין נתוני קבלה. אנא צור קבלה מחדש.', 'error');
        return;
    }
    
    console.log('✅ currentPaymentForReceipt exists:', appState.currentPaymentForReceipt);
    
    showLoading();
    
    try {
        const { tenant, payment } = appState.currentPaymentForReceipt;
        console.log('👤 Tenant:', tenant?.name);
        console.log('💰 Payment:', payment?.amount);
        const receiptElement = document.getElementById('receiptContent');
        
        if (!receiptElement) {
            throw new Error('Receipt element not found');
        }
        
        // Check if html2canvas and jsPDF are loaded
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas not loaded');
        }
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF not loaded');
        }
        
        // Create screenshot of receipt
        const canvas = await html2canvas(receiptElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        // Convert canvas to PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Calculate dimensions to fit A4
        const imgWidth = 190; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const fileName = `קבלה_${tenant.name.replace(/\s+/g, '_')}_${date}.pdf`;
        
        // Convert PDF to blob for sharing
        const pdfBlob = pdf.output('blob');
        
        // Save PDF to downloads
        pdf.save(fileName);
        
        hideLoading();
        
        // Check if Web Share API is supported
        const canShare = navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] });
        
        // Show success message with instructions
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: ${isDarkMode ? '#1f2937' : 'white'};
            color: ${isDarkMode ? '#f3f4f6' : '#1f2937'};
            padding: 20px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideIn 0.3s;
        `;
        
        content.innerHTML = `
            <div style="text-align: right; line-height: 1.6;">
                <div style="font-size: 1.2rem; margin-bottom: 12px;">
                    <i class="fas fa-check-circle" style="color: #10b981; font-size: 1.8rem;"></i>
                    <br>
                    <strong>קבלה ב-PDF נוצרה!</strong>
                </div>
                <div style="background: ${isDarkMode ? '#064e3b' : '#f0fdf4'}; padding: 12px; border-radius: 8px; margin: 12px 0; font-size: 0.9rem; color: ${isDarkMode ? '#d1fae5' : 'inherit'};">
                    <div style="margin: 4px 0;"><strong>📄 קובץ:</strong> ${fileName}</div>
                    <div style="margin: 4px 0;"><strong>📂 מיקום:</strong> Downloads</div>
                    <div style="margin: 4px 0;"><strong>👤 דייר:</strong> ${tenant.name}</div>
                    <div style="margin: 4px 0;"><strong>💰 סכום:</strong> ₪${payment.amount.toLocaleString()}</div>
                </div>
                <div style="background: ${isDarkMode ? '#78350f' : '#fff7ed'}; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 0.9rem; color: ${isDarkMode ? '#fef3c7' : 'inherit'};">
                    <strong>📱 לשליחה ב-WhatsApp:</strong><br>
                    ${canShare ? 
                        `<p style="margin: 8px 0;">לחץ על "שתף ב-WhatsApp" והקובץ יצורף אוטומטית! 🎉</p>` :
                        `<ol style="margin: 8px 0; padding-right: 18px; line-height: 1.5;">
                            <li style="margin: 5px 0;">לחץ "פתח WhatsApp" 👇</li>
                            <li style="margin: 5px 0;">לחץ 📎 → בחר "מסמך"</li>
                            <li style="margin: 5px 0;">בחר את הקובץ מ-Downloads</li>
                            <li style="margin: 5px 0;">שלח! ✅</li>
                        </ol>`
                    }
                </div>
            </div>
        `;
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 15px;';
        
        if (canShare) {
            // Share button (modern browsers with Share API)
            const shareBtn = document.createElement('button');
            shareBtn.innerHTML = '<i class="fab fa-whatsapp"></i> שתף ב-WhatsApp (מהיר!)';
            shareBtn.style.cssText = `
                width: 100%;
                padding: 14px;
                background: #25d366;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            `;
            shareBtn.onmouseover = () => shareBtn.style.background = '#20ba56';
            shareBtn.onmouseout = () => shareBtn.style.background = '#25d366';
            shareBtn.onclick = async () => {
                try {
                    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                    const message = `קבלה - ${tenant.name}\nסכום: ₪${payment.amount.toLocaleString()}\nתאריך: ${formatDate(payment.date)}`;
                    
                    await navigator.share({
                        title: `קבלה - ${tenant.name}`,
                        text: message,
                        files: [file]
                    });
                    
                    modal.remove();
                    showToast('✅ הקובץ שותף בהצלחה!', 'success');
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Share error:', err);
                        showToast('שגיאה בשיתוף. נסה שוב.', 'error');
                    }
                }
            };
            buttonsContainer.appendChild(shareBtn);
        }
        
        // Regular WhatsApp button
        const whatsappBtn = document.createElement('button');
        whatsappBtn.innerHTML = `<i class="fab fa-whatsapp"></i> ${canShare ? 'פתח WhatsApp (ללא קובץ)' : 'פתח WhatsApp'}`;
        whatsappBtn.style.cssText = `
            width: 100%;
            padding: 14px;
            background: ${canShare ? '#059669' : '#25d366'};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        `;
        whatsappBtn.onmouseover = () => whatsappBtn.style.background = canShare ? '#047857' : '#20ba56';
        whatsappBtn.onmouseout = () => whatsappBtn.style.background = canShare ? '#059669' : '#25d366';
        whatsappBtn.onclick = () => {
            const phone = tenant.phone.replace(/\D/g, '');
            const phoneWithPrefix = phone.startsWith('972') ? phone : '972' + phone.substring(1);
            const message = `שלום ${tenant.name},\n\nמצורף קובץ PDF עם קבלה רשמית על תשלום ועד הבית.\n\nסכום: ₪${payment.amount.toLocaleString()}\nתאריך: ${formatDate(payment.date)}\n\nתודה רבה!`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phoneWithPrefix}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
            modal.remove();
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i> סגור';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 14px;
            background: ${isDarkMode ? '#374151' : '#6b7280'};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = isDarkMode ? '#4b5563' : '#9ca3af';
        closeBtn.onmouseout = () => closeBtn.style.background = isDarkMode ? '#374151' : '#6b7280';
        closeBtn.onclick = () => {
            modal.style.animation = 'fadeOut 0.3s';
            setTimeout(() => modal.remove(), 300);
        };
        
        buttonsContainer.appendChild(whatsappBtn);
        buttonsContainer.appendChild(closeBtn);
        content.appendChild(buttonsContainer);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        addActivity(`נוצרה קבלה PDF ל-WhatsApp עבור ${tenant.name} - ₪${payment.amount.toLocaleString()}`, 'notification');
        console.log('✅ PDF created successfully:', fileName);
        
    } catch (error) {
        hideLoading();
        console.error('Error in sendReceiptWhatsapp:', error);
        showToast('שגיאה ביצירת קבלת ה-PDF: ' + error.message, 'error');
    }
}

async function downloadReceipt() {
    console.log('📥 downloadReceipt called - Creating PDF');
    
    if (!appState.currentPaymentForReceipt) {
        console.error('❌ currentPaymentForReceipt is empty!');
        showToast('שגיאה: אין נתוני קבלה', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const { tenant, payment } = appState.currentPaymentForReceipt;
        const receiptElement = document.getElementById('receiptContent');
        
        if (!receiptElement) {
            throw new Error('Receipt element not found');
        }
        
        // Check if html2canvas and jsPDF are loaded
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas not loaded');
        }
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF not loaded');
        }
        
        // Create screenshot of receipt
        const canvas = await html2canvas(receiptElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        // Convert canvas to PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Calculate dimensions to fit A4
        const imgWidth = 190; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const fileName = `קבלה_${tenant.name.replace(/\s+/g, '_')}_${date}.pdf`;
        
        // Download PDF
        pdf.save(fileName);
        
        hideLoading();
        showToast('✅ קבלה הורדה בהצלחה!', 'success');
        
    } catch (error) {
        console.error('❌ Error creating PDF:', error);
        hideLoading();
        showToast('שגיאה ביצירת PDF: ' + error.message, 'error');
    }
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '', 'width=400,height=600');
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>קבלה</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px; 
                }
                .receipt-header { 
                    text-align: center; 
                    border-bottom: 2px dashed #000; 
                    padding-bottom: 10px; 
                    margin-bottom: 10px; 
                }
                .receipt-row { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 5px 0; 
                }
                .receipt-footer { 
                    text-align: center; 
                    border-top: 2px dashed #000; 
                    padding-top: 10px; 
                    margin-top: 10px; 
                }
                .no-print {
                    text-align: center;
                    margin-top: 20px;
                    padding: 20px;
                    background: #f3f4f6;
                    border-radius: 8px;
                }
                .no-print button {
                    padding: 12px 24px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    margin: 0 5px;
                    font-weight: 600;
                }
                .no-print button:hover {
                    background: #1d4ed8;
                }
                .no-print button.close {
                    background: #6b7280;
                }
                .no-print button.close:hover {
                    background: #4b5563;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${receiptContent}
            <div class="no-print">
                <button onclick="window.print()">
                    🖨️ הדפס
                </button>
                <button class="close" onclick="window.close()">
                    ✖️ סגור
                </button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Auto-print when page loads
    printWindow.onload = function() {
        printWindow.print();
    };
    
    // Close window after printing (if user cancels or completes)
    printWindow.onafterprint = function() {
        printWindow.close();
        // Also close the original receipt modal
        hideModal('receiptModal');
    };
}

// ===================================
// Auto Close Mobile Menu
// ===================================

function setupMobileMenuAutoClose() {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.querySelector('.content-area');
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Close menu when clicking on menu item (mobile only)
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Close menu when clicking outside (mobile only)
    contentArea?.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('active');
        }
    });
}

// ===================================
// Committee Settings
// ===================================

function saveCommitteeSettings() {
    appState.settings.chairpersonName = document.getElementById('chairpersonName').value;
    appState.settings.chairpersonPhone = document.getElementById('chairpersonPhone').value;
    appState.settings.treasurerName = document.getElementById('treasurerName').value;
    appState.settings.treasurerPhone = document.getElementById('treasurerPhone').value;
    
    saveDataToStorage();
    showToast('פרטי הועד נשמרו בהצלחה!', 'success');
}

// ===================================
// Digital Signature
// ===================================

let signaturePad = null;
let isDrawing = false;

function initSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let lastX = 0;
    let lastY = 0;
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    });
    
    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDrawing = false;
    });
}

function openSignatureModal() {
    showModal('signatureModal');
    setTimeout(() => {
        initSignaturePad();
        clearSignaturePad();
    }, 100);
}

function clearSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveSignature() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return;
    
    // Check if canvas is empty
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let isEmpty = true;
    
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0) {
            isEmpty = false;
            break;
        }
    }
    
    if (isEmpty) {
        showToast('נא לחתום לפני השמירה', 'warning');
        return;
    }
    
    // Save signature as base64
    const signatureData = canvas.toDataURL('image/png');
    appState.settings.digitalSignature = signatureData;
    
    saveDataToStorage();
    updateSignaturePreview();
    hideModal('signatureModal');
    
    showToast('החתימה נשמרה בהצלחה!', 'success');
    addActivity('נשמרה חתימה דיגיטלית', 'edit');
}

function updateSignaturePreview() {
    const preview = document.getElementById('signaturePreview');
    const clearBtn = document.getElementById('clearSignatureBtn');
    
    if (!preview) return;
    
    if (appState.settings.digitalSignature) {
        preview.innerHTML = `<img src="${appState.settings.digitalSignature}" alt="חתימה">`;
        if (clearBtn) clearBtn.style.display = 'inline-flex';
    } else {
        preview.innerHTML = '<p class="no-signature">אין חתימה</p>';
        if (clearBtn) clearBtn.style.display = 'none';
    }
}

function clearSignature() {
    if (!confirm('האם אתה בטוח שברצונך למחוק את החתימה?')) return;
    
    delete appState.settings.digitalSignature;
    saveDataToStorage();
    updateSignaturePreview();
    
    showToast('החתימה נמחקה', 'info');
    addActivity('נמחקה חתימה דיגיטלית', 'delete');
}

// ===================================
// Monthly Tracking System
// ===================================

let currentTrackingTenant = null;
let currentTrackingYear = new Date().getFullYear();

function openMonthlyTracking(tenantId) {
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    currentTrackingTenant = tenant;
    currentTrackingYear = new Date().getFullYear();
    
    // Initialize monthlyPayments if not exists
    if (!tenant.monthlyPayments) {
        tenant.monthlyPayments = {};
    }
    if (!tenant.monthlyPayments[currentTrackingYear]) {
        tenant.monthlyPayments[currentTrackingYear] = {};
    }
    
    renderMonthlyTracking();
    showModal('monthlyTrackingModal');
}

function renderMonthlyTracking() {
    if (!currentTrackingTenant) return;
    
    const tenant = currentTrackingTenant;
    
    // Update header info
    document.getElementById('trackingTenantName').textContent = tenant.name;
    document.getElementById('trackingApartment').textContent = tenant.apartment;
    document.getElementById('trackingMonthlyAmount').textContent = `₪${tenant.monthlyAmount}`;
    document.getElementById('trackingModalTitle').textContent = `מעקב חודשי - ${tenant.name}`;
    document.getElementById('currentTrackingYear').textContent = currentTrackingYear;
    
    // Calculate totals
    const yearData = tenant.monthlyPayments[currentTrackingYear] || {};
    let paidTotal = 0;
    let paidMonths = 0;
    
    for (let month = 1; month <= 12; month++) {
        if (yearData[month]?.paid) {
            paidTotal += yearData[month].amount || tenant.monthlyAmount;
            paidMonths++;
        }
    }
    
    const expectedTotal = tenant.monthlyAmount * 12;
    const debtTotal = expectedTotal - paidTotal;
    const balance = paidTotal - expectedTotal;
    
    document.getElementById('trackingPaidTotal').textContent = `₪${paidTotal.toLocaleString()}`;
    document.getElementById('trackingDebtTotal').textContent = `₪${Math.max(0, debtTotal).toLocaleString()}`;
    
    const balanceElem = document.getElementById('trackingBalance');
    balanceElem.textContent = `₪${Math.abs(balance).toLocaleString()}`;
    balanceElem.className = 'summary-value ' + (balance >= 0 ? 'success' : 'danger');
    
    // Render monthly grid
    renderMonthlyGrid();
    
    // Render history
    renderTrackingHistory();
}

function renderMonthlyGrid() {
    const tenant = currentTrackingTenant;
    const yearData = tenant.monthlyPayments[currentTrackingYear] || {};
    const monthsHe = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                     'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const grid = document.getElementById('monthlyGrid');
    grid.innerHTML = '';
    
    for (let month = 1; month <= 12; month++) {
        const monthData = yearData[month];
        const isPaid = monthData?.paid || false;
        const isCurrent = month === currentMonth && currentTrackingYear === currentYear;
        
        const card = document.createElement('div');
        card.className = `month-card ${isPaid ? 'paid' : 'unpaid'} ${isCurrent ? 'current' : ''}`;
        card.dataset.month = month;
        
        card.innerHTML = `
            <input type="checkbox" class="month-checkbox" ${isPaid ? 'checked' : ''} 
                   onchange="toggleMonth(${month}, this.checked)">
            <div class="month-name">${monthsHe[month - 1]}</div>
            <div class="month-status">
                <i class="fas ${isPaid ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <span>${isPaid ? 'שולם' : 'לא שולם'}</span>
            </div>
            ${isPaid ? `
                <div class="month-amount">₪${monthData.amount || tenant.monthlyAmount}</div>
                <div class="month-date">${formatDate(monthData.date)}</div>
            ` : `
                <div class="month-amount">₪${tenant.monthlyAmount}</div>
            `}
        `;
        
        grid.appendChild(card);
    }
}

function toggleMonth(month, isPaid) {
    const tenant = currentTrackingTenant;
    if (!tenant.monthlyPayments[currentTrackingYear]) {
        tenant.monthlyPayments[currentTrackingYear] = {};
    }
    
    if (isPaid) {
        tenant.monthlyPayments[currentTrackingYear][month] = {
            paid: true,
            date: new Date().toISOString(),
            amount: tenant.monthlyAmount
        };
    } else {
        delete tenant.monthlyPayments[currentTrackingYear][month];
    }
    
    renderMonthlyTracking();
}

function renderTrackingHistory() {
    const tenant = currentTrackingTenant;
    const yearData = tenant.monthlyPayments[currentTrackingYear] || {};
    const monthsHe = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                     'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    
    const historyList = document.getElementById('trackingHistoryList');
    const paidMonths = [];
    
    for (let month = 1; month <= 12; month++) {
        if (yearData[month]?.paid) {
            paidMonths.push({
                month,
                ...yearData[month]
            });
        }
    }
    
    if (paidMonths.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">אין תשלומים רשומים לשנה זו</p>';
        return;
    }
    
    paidMonths.sort((a, b) => b.month - a.month);
    
    historyList.innerHTML = paidMonths.map(item => `
        <div class="history-item">
            <div class="history-month">${monthsHe[item.month - 1]} ${currentTrackingYear}</div>
            <div class="history-details">
                <div class="history-amount">₪${item.amount}</div>
                <div class="history-date">${formatDate(item.date)}</div>
            </div>
        </div>
    `).join('');
}

function changeTrackingYear(direction) {
    currentTrackingYear += direction;
    
    // Initialize year if not exists
    if (!currentTrackingTenant.monthlyPayments[currentTrackingYear]) {
        currentTrackingTenant.monthlyPayments[currentTrackingYear] = {};
    }
    
    renderMonthlyTracking();
}

function saveMonthlyChanges() {
    if (!currentTrackingTenant) return;
    
    // Update tenant in appState
    const index = appState.tenants.findIndex(t => t.id === currentTrackingTenant.id);
    if (index !== -1) {
        appState.tenants[index] = currentTrackingTenant;
    }
    
    // Update status based on current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    if (currentTrackingYear === currentYear) {
        const monthData = currentTrackingTenant.monthlyPayments[currentYear]?.[currentMonth];
        if (monthData?.paid) {
            currentTrackingTenant.status = 'paid';
            currentTrackingTenant.lastPayment = monthData.date;
        } else {
            currentTrackingTenant.status = 'pending';
        }
    }
    
    saveDataToStorage();
    renderTenantsTable();
    updateAllStatistics();
    
    addActivity(`עודכן מעקב חודשי: ${currentTrackingTenant.name}`, 'edit');
    showToast('השינויים נשמרו בהצלחה!', 'success');
}

function generateMonthlyReceipt() {
    if (!currentTrackingTenant) return;
    
    const tenant = currentTrackingTenant;
    const yearData = tenant.monthlyPayments[currentTrackingYear] || {};
    
    // Get all paid months for this year
    const paidMonths = [];
    let totalAmount = 0;
    
    for (let month = 1; month <= 12; month++) {
        if (yearData[month]?.paid) {
            paidMonths.push({
                month,
                ...yearData[month]
            });
            totalAmount += yearData[month].amount || tenant.monthlyAmount;
        }
    }
    
    if (paidMonths.length === 0) {
        showToast('אין חודשים ששולמו ליצירת קבלה', 'warning');
        return;
    }
    
    // Generate receipt with all paid months
    const monthsHe = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                     'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    
    const receiptContent = document.getElementById('receiptContent');
    const currentDate = new Date().toLocaleDateString('he-IL');
    const receiptNumber = `${Date.now()}`.slice(-8);
    
    const monthsList = paidMonths
        .sort((a, b) => a.month - b.month)
        .map(m => monthsHe[m.month - 1])
        .join(', ');
    
    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h2>${appState.settings.buildingName || 'ועד הבית'}</h2>
            <p>קבלה מס': ${receiptNumber}</p>
            <p>${currentDate}</p>
        </div>
        
        <div class="receipt-body">
            <div class="receipt-row">
                <strong>שם:</strong>
                <span>${tenant.name}</span>
            </div>
            <div class="receipt-row">
                <strong>דירה:</strong>
                <span>${tenant.apartment}</span>
            </div>
            <div class="receipt-row">
                <strong>שנה:</strong>
                <span>${currentTrackingYear}</span>
            </div>
            <div class="receipt-row">
                <strong>חודשים ששולמו:</strong>
                <span>${monthsList}</span>
            </div>
            <div class="receipt-row">
                <strong>מספר חודשים:</strong>
                <span>${paidMonths.length}</span>
            </div>
            <hr style="margin: 1rem 0;">
            <div class="receipt-row" style="font-size: 1.2rem;">
                <strong>סה"כ:</strong>
                <strong>₪${totalAmount.toLocaleString()}</strong>
            </div>
        </div>
        
        <div class="receipt-footer">
            ${appState.settings.digitalSignature ? `
                <div style="text-align: center; margin-bottom: 1rem;">
                    <img src="${appState.settings.digitalSignature}" alt="חתימה" style="max-width: 200px; height: 60px; object-fit: contain;">
                </div>
            ` : `
                <p><strong>חתימה:</strong> _________________</p>
            `}
            <p>${appState.settings.treasurerName || 'גזבר הועד'}</p>
            <p>${appState.settings.treasurerPhone || ''}</p>
            <br>
            <p style="font-size: 0.8rem;">תודה על התשלום!</p>
        </div>
    `;
    
    appState.currentPaymentForReceipt = { tenant, payment: { amount: totalAmount } };
    hideModal('monthlyTrackingModal');
    showModal('receiptModal');
}

// ===================================
// Global Functions (for inline onclick)
// ===================================

window.editTenant = editTenant;
window.deleteTenant = deleteTenant;
window.viewTenant = viewTenant;
window.deletePayment = deletePayment;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.hideModal = hideModal;
window.sendWhatsappToTenant = function(tenantId) {
    const tenant = appState.tenants.find(t => t.id === tenantId);
    if (tenant) {
        openWhatsappModal(tenant, 'billing');
    }
};
window.openMonthlyTracking = openMonthlyTracking;
window.toggleMonth = toggleMonth;