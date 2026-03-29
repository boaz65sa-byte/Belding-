/**
 * Tiles App - ועד 2025
 * פונקציות משותפות לכל דפי הקוביות
 * גרסה: 1.0.0
 * תאריך: 2026-02-03
 */

// ===== Global State =====
window.TilesApp = {
    user: null,
    profile: null,
    supabase: null,
    
    // Initialize
    async init() {
        try {
            // Get Supabase client
            this.supabase = await getSupabase();
            
            if (!this.supabase) {
                throw new Error('Supabase לא מאותחל');
            }
            
            // Check authentication
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error || !session) {
                console.log('לא מחובר, מפנה ל-login');
                window.location.href = 'login.html';
                return false;
            }
            
            this.user = session.user;
            console.log('✅ משתמש מחובר:', this.user.email);
            
            // Get profile
            const { data: profile, error: profileError } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', this.user.id)
                .single();
            
            if (profile) {
                this.profile = profile;
                console.log('✅ פרופיל נטען:', profile);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ שגיאה באתחול:', error);
            this.showToast('שגיאה באתחול המערכת', 'error');
            return false;
        }
    },
    
    // Get display name
    getDisplayName() {
        return this.profile?.full_name || this.user?.email?.split('@')[0] || 'משתמש';
    },
    
    // Get display email
    getDisplayEmail() {
        return this.user?.email || '';
    },
    
    // Get initial letter for avatar
    getInitial() {
        const name = this.getDisplayName();
        return name.charAt(0).toUpperCase();
    },
    
    // Check if user is admin
    isAdmin() {
        return this.profile?.role === 'admin';
    },
    
    // Logout
    async logout() {
        if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
            try {
                if (this.supabase) {
                    await this.supabase.auth.signOut();
                }
                window.location.href = 'login.html';
            } catch (error) {
                console.error('שגיאה בהתנתקות:', error);
                this.showToast('שגיאה בהתנתקות', 'error');
            }
        }
    },
    
    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    
    // Show loading
    showLoading(message = 'טוען...') {
        const loading = document.getElementById('loadingState');
        if (loading) {
            loading.style.display = 'block';
            const text = loading.querySelector('p');
            if (text) text.textContent = message;
        }
    },
    
    // Hide loading
    hideLoading() {
        const loading = document.getElementById('loadingState');
        if (loading) {
            loading.style.display = 'none';
        }
        
        const content = document.getElementById('mainContent');
        if (content) {
            content.style.display = 'block';
        }
    },
    
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },
    
    // Format date
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    },
    
    // Format date with time
    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },
    
    // Open modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    // Confirm dialog
    async confirm(message) {
        return confirm(message);
    },
    
    // Validate phone
    validatePhone(phone) {
        const phoneRegex = /^0\d{1,2}-?\d{7}$/;
        return phoneRegex.test(phone);
    },
    
    // Validate email
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Get status badge HTML
    getStatusBadge(status) {
        const statusMap = {
            'active': { text: 'פעיל', class: 'badge-success' },
            'pending': { text: 'ממתין', class: 'badge-warning' },
            'paid': { text: 'שולם', class: 'badge-success' },
            'unpaid': { text: 'לא שולם', class: 'badge-danger' },
            'overdue': { text: 'באיחור', class: 'badge-danger' },
            'trial': { text: 'ניסיון', class: 'badge-info' },
            'expired': { text: 'פג תוקף', class: 'badge-danger' },
            'blocked': { text: 'חסום', class: 'badge-danger' }
        };
        
        const badge = statusMap[status] || { text: status, class: 'badge-info' };
        return `<span class="badge ${badge.class}">${badge.text}</span>`;
    },
    
    // Export to CSV
    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showToast('אין נתונים לייצוא', 'warning');
            return;
        }
        
        // Get headers
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return `"${value}"`;
            });
            csv += values.join(',') + '\n';
        });
        
        // Add BOM for Hebrew support
        const BOM = '\uFEFF';
        csv = BOM + csv;
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showToast('הקובץ יוצא בהצלחה', 'success');
    },
    
    // Print page
    print() {
        window.print();
    },
    
    // Generate random ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Handle errors
    handleError(error, customMessage = 'אירעה שגיאה') {
        console.error('Error:', error);
        this.showToast(customMessage, 'error');
    }
};

// ===== Initialize on page load =====
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 TilesApp initializing...');
    
    const initialized = await window.TilesApp.init();
    
    if (!initialized) {
        return;
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => window.TilesApp.logout());
    }
    
    // Setup modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    console.log('✅ TilesApp initialized successfully');
});

// ===== Export for use in other scripts =====
window.showToast = (message, type) => window.TilesApp.showToast(message, type);
window.formatCurrency = (amount) => window.TilesApp.formatCurrency(amount);
window.formatDate = (date) => window.TilesApp.formatDate(date);
window.formatDateTime = (date) => window.TilesApp.formatDateTime(date);
