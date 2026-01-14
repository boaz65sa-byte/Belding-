// ===================================
// Annual Payments Table
// Tenant Management System
// מפתח ובעלים: בועז סעדה
// ===================================

// Switch between tenant tabs
function switchTenantTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tenant-tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tenant-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (selectedTab) {
        selectedTab.style.display = 'block';
        selectedTab.classList.add('active');
    }
    
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Initialize payments table if switching to it
    if (tabName === 'paymentsTable') {
        initializePaymentsTableDates();
    }
}

// Initialize date inputs with current year
function initializePaymentsTableDates() {
    const year = new Date().getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    document.getElementById('paymentsTableStartDate').value = startDate;
    document.getElementById('paymentsTableEndDate').value = endDate;
}

// Render payments table
function renderPaymentsTable() {
    const container = document.getElementById('paymentsTableContainer');
    if (!container) return;
    
    const startDateStr = document.getElementById('paymentsTableStartDate').value;
    const endDateStr = document.getElementById('paymentsTableEndDate').value;
    
    if (!startDateStr || !endDateStr) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">נא לבחור טווח תאריכים</p>';
        return;
    }
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Generate months array
    const months = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        months.push({
            year: current.getFullYear(),
            month: current.getMonth() + 1,
            label: current.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })
        });
        current.setMonth(current.getMonth() + 1);
    }
    
    if (months.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">לא נמצאו חודשים בטווח שנבחר</p>';
        return;
    }
    
    // Build table HTML
    let html = '<table class="annual-payments-table"><thead><tr>';
    html += '<th>דייר / חודש</th>';
    months.forEach(m => {
        html += `<th>${m.label}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Sort tenants by apartment number
    const sortedTenants = [...appState.tenants].sort((a, b) => {
        return parseInt(a.apartment) - parseInt(b.apartment);
    });
    
    // Build rows for each tenant
    sortedTenants.forEach(tenant => {
        html += '<tr>';
        html += `<td><strong>${tenant.name}</strong><br><small>דירה ${tenant.apartment}</small></td>`;
        
        months.forEach(m => {
            // Find payment for this tenant and month
            const payment = appState.payments.find(p => {
                if (p.tenantId !== tenant.id) return false;
                const paymentDate = new Date(p.date);
                return paymentDate.getFullYear() === m.year && 
                       (paymentDate.getMonth() + 1) === m.month;
            });
            
            if (payment) {
                // Paid - show checkmark, amount, and date
                const paymentDate = new Date(payment.date);
                const dateStr = `${paymentDate.getDate()}/${paymentDate.getMonth() + 1}`;
                html += `<td><div class="payment-cell paid">
                    <span class="check-mark">✅</span>
                    <span class="amount">₪${payment.amount}</span>
                    <span class="date">${dateStr}</span>
                </div></td>`;
            } else {
                // Not paid - empty with red background
                html += '<td><div class="payment-cell unpaid"></div></td>';
            }
        });
        
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Print payments table
function printPaymentsTable() {
    window.print();
}

// Export to Excel
function exportPaymentsTableToExcel() {
    try {
        const startDateStr = document.getElementById('paymentsTableStartDate').value;
        const endDateStr = document.getElementById('paymentsTableEndDate').value;
        
        if (!startDateStr || !endDateStr) {
            showToast('נא לבחור טווח תאריכים', 'warning');
            return;
        }
        
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        // Generate months
        const months = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            months.push({
                year: current.getFullYear(),
                month: current.getMonth() + 1,
                label: current.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })
            });
            current.setMonth(current.getMonth() + 1);
        }
        
        // Build CSV
        let csv = 'דייר / חודש';
        months.forEach(m => csv += `,${m.label}`);
        csv += '\\n';
        
        // Sort tenants
        const sortedTenants = [...appState.tenants].sort((a, b) => {
            return parseInt(a.apartment) - parseInt(b.apartment);
        });
        
        // Add data rows
        sortedTenants.forEach(tenant => {
            csv += `${tenant.name} (דירה ${tenant.apartment})`;
            
            months.forEach(m => {
                const payment = appState.payments.find(p => {
                    if (p.tenantId !== tenant.id) return false;
                    const paymentDate = new Date(p.date);
                    return paymentDate.getFullYear() === m.year && 
                           (paymentDate.getMonth() + 1) === m.month;
                });
                
                if (payment) {
                    const paymentDate = new Date(payment.date);
                    const dateStr = `${paymentDate.getDate()}/${paymentDate.getMonth() + 1}`;
                    csv += `,✅ ₪${payment.amount} (${dateStr})`;
                } else {
                    csv += `,`;
                }
            });
            
            csv += '\\n';
        });
        
        // Download with BOM for Hebrew support
        const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `טבלת_תשלומים_${startDate.getFullYear()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Excel יוצא בהצלחה!', 'success');
        
    } catch (error) {
        console.error('שגיאה ביצירת Excel:', error);
        showToast('שגיאה ביצירת Excel', 'error');
    }
}

// Export to PDF
function exportPaymentsTableToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        const startDateStr = document.getElementById('paymentsTableStartDate').value;
        const endDateStr = document.getElementById('paymentsTableEndDate').value;
        
        if (!startDateStr || !endDateStr) {
            showToast('נא לבחור טווח תאריכים', 'warning');
            return;
        }
        
        // Add title
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('טבלת תשלומים שנתית', 148, 15, { align: 'center' });
        
        // Add date range
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`תקופה: ${startDateStr} עד ${endDateStr}`, 148, 23, { align: 'center' });
        
        // Note about implementation
        doc.setFontSize(9);
        doc.text('הטבלה המלאה תוצג בהדפסה רגילה', 148, 30, { align: 'center' });
        doc.text('לחץ על "הדפסה" לקבלת טבלה מלאה', 148, 37, { align: 'center' });
        
        // Add footer
        doc.setFontSize(8);
        doc.text('מערכת ניהול דיירים - בועז סעדה', 148, 200, { align: 'center' });
        
        doc.save(`טבלת_תשלומים_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF יוצא בהצלחה! (להדפסה מלאה השתמש בכפתור "הדפסה")', 'success');
        
    } catch (error) {
        console.error('שגיאה ביצירת PDF:', error);
        showToast('שגיאה ביצירת PDF', 'error');
    }
}
