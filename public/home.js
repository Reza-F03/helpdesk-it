// API Base URL
const API_URL = '/api';

// Token management
let authToken = null;
let currentUser = null;
let allTickets = [];

// Filter state
let activeFilters = {
    category: 'all',
    status: 'all'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    checkAuthStatus();
    loadTickets();
});

// Check if user is authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateAuthDisplay();
    }
}

// Update auth display
function updateAuthDisplay() {
    const authStatus = document.getElementById('authStatus');
    
    if (currentUser) {
        authStatus.innerHTML = `
            <span class="status-indicator online"></span>
            <span>Logged in as: <strong>${currentUser.full_name}</strong> (${currentUser.role})</span>
        `;
        
        // If admin or support, show link to dashboard
        const authSection = document.querySelector('.auth-section');
        const existingDashboardBtn = authSection.querySelector('.btn-dashboard');
        
        if (!existingDashboardBtn && (currentUser.role === 'admin' || currentUser.role === 'support')) {
            const dashboardBtn = document.createElement('button');
            dashboardBtn.className = 'btn btn-primary btn-dashboard';
            dashboardBtn.textContent = 'Go to Dashboard';
            dashboardBtn.onclick = () => window.location.href = '/dashboard.html';
            
            authSection.appendChild(dashboardBtn);
        }
    }
}

// Show ticket modal (repair or request)
function showTicketModal(type) {
    console.log('showTicketModal:', type);
    if (type === 'repair') {
        document.getElementById('repairTicketModal').classList.add('active');
    } else if (type === 'request') {
        document.getElementById('requestTicketModal').classList.add('active');
    }
}

// Close ticket modal
function closeTicketModal(modalId) {
    console.log('closeTicketModal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Close generic modal
function closeModal(modalId) {
    console.log('closeModal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show check status modal
function showCheckStatusModal() {
    clearCheckStatus();
    document.getElementById('checkStatusModal').classList.add('active');
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

// Handle ticket submission (repair or request)
async function handleSubmitTicket(event, type) {
    event.preventDefault();
    console.log('=== handleSubmitTicket START ===');
    console.log('Type:', type);
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        priority: formData.get('priority'),
        category: type === 'repair' ? 'Perbaikan' : 'Permintaan Barang',
        reporter_name: formData.get('reporter_name').trim(),
        reporter_email: formData.get('reporter_email').trim(),
        reporter_phone: formData.get('reporter_phone'),
        department: formData.get('department')
    };
    
    console.log('Form data:', data);
    
    // Validate title length
    if (data.title.length < 5) {
        alert('Judul minimal 5 karakter');
        return;
    }
    
    // Validate description length
    if (data.description.length < 10) {
        alert('Deskripsi minimal 10 karakter');
        return;
    }
    
    // Validate required fields
    if (!data.reporter_name || !data.reporter_email) {
        alert('Nama dan email harus diisi');
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    
    try {
        console.log('Sending POST to /api/tickets...');
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        // Check both success:true OR error:false (API inconsistency fix)
        if (response.ok && (result.success || result.error === false)) {
            console.log('✓ Ticket created successfully!');
            
            // Step 1: Close form modal
            const modalId = type === 'repair' ? 'repairTicketModal' : 'requestTicketModal';
            const formModal = document.getElementById(modalId);
            
            if (formModal) {
                console.log('Closing form modal:', modalId);
                formModal.classList.remove('active');
                
                // Force remove after delay to ensure it closes
                setTimeout(() => {
                    formModal.classList.remove('active');
                    formModal.style.display = 'none';
                    console.log('Form modal force closed');
                }, 50);
                
                setTimeout(() => {
                    formModal.style.display = '';
                }, 500);
            }
            
            // Step 2: Reset form
            form.reset();
            
            // Step 3: Show success modal
            setTimeout(() => {
                const successModal = document.getElementById('successModal');
                const ticketNumberEl = document.getElementById('successTicketNumber');
                
                if (ticketNumberEl && result.data) {
                    ticketNumberEl.textContent = result.data.ticket_number;
                }
                
                if (successModal) {
                    successModal.classList.add('active');
                    console.log('✓ Success modal shown');
                }
            }, 200);
            
            // Step 4: Reload ticket list
            setTimeout(() => {
                console.log('Reloading tickets...');
                loadTickets();
            }, 600);
            
        } else {
            console.error('✗ Failed:', result.message);
            alert(result.message || 'Gagal membuat tiket');
        }
    } catch (error) {
        console.error('✗ Error:', error);
        alert('Terjadi kesalahan: ' + error.message);
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
    }
    
    console.log('=== handleSubmitTicket END ===');
}

// Handle check status
async function handleCheckStatus(event) {
    event.preventDefault();
    
    const form = event.target;
    const ticketNumber = form.ticket_number.value.trim();
    const resultDiv = document.getElementById('ticketStatusResult');
    
    if (!ticketNumber) {
        alert('Masukkan nomor tiket');
        return;
    }
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p>Mencari tiket...</p>';
    
    try {
        const response = await fetch(`${API_URL}/tickets?search=${encodeURIComponent(ticketNumber)}`);
        const result = await response.json();
        
        if (response.ok && (result.success || result.error === false) && result.data.length > 0) {
            const ticket = result.data[0];
            
            resultDiv.innerHTML = `
                <div class="ticket-status-card">
                    <div class="status-header">
                        <h3>${ticket.ticket_number}</h3>
                        <span class="badge badge-${ticket.status}">${getStatusLabel(ticket.status)}</span>
                    </div>
                    <div class="status-details">
                        <p><strong>Judul:</strong> ${ticket.title}</p>
                        <p><strong>Kategori:</strong> ${ticket.category || '-'}</p>
                        <p><strong>Prioritas:</strong> <span class="badge badge-${ticket.priority}">${getPriorityLabel(ticket.priority)}</span></p>
                        <p><strong>Pelapor:</strong> ${ticket.reporter_name}</p>
                        <p><strong>Dibuat:</strong> ${formatDate(ticket.created_at)}</p>
                        ${assigneeInfo(ticket)}
                        ${hasilPerbaikanInfo(ticket)}
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-warning">
                    <p>❌ Tiket tidak ditemukan</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <p>Terjadi kesalahan</p>
            </div>
        `;
    }

    // Tampilkan tombol Clear setelah hasil muncul
    const clearBtn = document.getElementById('clearStatusBtn');
    if (clearBtn) clearBtn.style.display = 'inline-flex';
}

// Clear hasil dan reset form cek status
function clearCheckStatus() {
    const resultDiv = document.getElementById('ticketStatusResult');
    const clearBtn = document.getElementById('clearStatusBtn');
    const input = document.getElementById('ticketNumberInput');

    if (resultDiv) {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
    if (clearBtn) clearBtn.style.display = 'none';
    if (input) {
        input.value = '';
        input.focus();
    }
}

// Handle staff login
async function handleLogin(event) {
    event.preventDefault();
    console.log('=== handleLogin START ===');
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('Username:', username);
    
    if (!username || !password) {
        alert('Username dan password harus diisi');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    
    try {
        console.log('Sending login request...');
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Login result:', result);
        
        if (response.ok && (result.success || result.error === false)) {
            console.log('✓ Login successful');
            console.log('User data:', result.data.user);
            console.log('User role:', result.data.user.role);
            
            // Save to localStorage
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));
            console.log('✓ Data saved to localStorage');
            
            authToken = result.data.token;
            currentUser = result.data.user;
            
            // Close modal first
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.remove('active');
                console.log('✓ Login modal closed');
            }
            
            // Small delay before redirect
            setTimeout(() => {
                // Check role and redirect
                if (currentUser.role === 'admin' || currentUser.role === 'support') {
                    console.log('✓ Redirecting to dashboard...');
                    console.log('Redirect URL: /dashboard.html');
                    
                    // Force redirect
                    window.location.href = '/dashboard.html';
                    
                    // If redirect doesn't work, try this
                    setTimeout(() => {
                        if (window.location.pathname !== '/dashboard.html') {
                            console.warn('Redirect failed, trying alternative...');
                            window.location.replace('/dashboard.html');
                        }
                    }, 100);
                } else {
                    console.log('Client user, staying on homepage');
                    updateAuthDisplay();
                    alert('Login berhasil!');
                }
            }, 100);
            
        } else {
            console.error('✗ Login failed:', result.message);
            
            // Clear password field on failed login (security best practice)
            const passwordField = document.getElementById('loginPassword');
            if (passwordField) {
                passwordField.value = '';
                passwordField.focus(); // Focus back to password field
            }
            
            alert(result.message || 'Login gagal. Periksa username dan password.');
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('✗ Login error:', error);
        
        // Clear password field on error
        const passwordField = document.getElementById('loginPassword');
        if (passwordField) {
            passwordField.value = '';
            passwordField.focus(); // Focus back to password field
        }
        
        alert('Terjadi kesalahan saat login: ' + error.message);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
    
    console.log('=== handleLogin END ===');
}

// Load tickets from API
async function loadTickets() {
    console.log('=== loadTickets START ===');
    const container = document.getElementById('ticketListContainer');
    
    if (!container) {
        console.error('✗ Container not found!');
        return;
    }
    
    container.innerHTML = '<p class="loading-text">Memuat tiket...</p>';
    
    try {
        const url = `${API_URL}/tickets?limit=10`;
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Result:', result);
        
        // Check both success:true OR error:false
        if (response.ok && (result.success || result.error === false)) {
            allTickets = result.data || [];
            console.log('✓ Loaded', allTickets.length, 'tickets');
            applyFilters();
        } else {
            console.error('✗ Failed:', result.message);
            container.innerHTML = '<p class="error-text">Gagal: ' + (result.message || 'Unknown') + '</p>';
        }
    } catch (error) {
        console.error('✗ Error:', error);
        container.innerHTML = '<p class="error-text">Error: ' + error.message + '</p>';
    }
}

// Display tickets with category separators
function displayTickets(tickets) {
    const container = document.getElementById('ticketListContainer');
    const countInfo = document.getElementById('ticketCountInfo');
    const countText = document.getElementById('ticketCountText');

    if (!container) return;

    if (tickets.length === 0) {
        container.innerHTML = '<p class="empty-text">Tidak ada tiket yang sesuai filter</p>';
        if (countInfo) countInfo.style.display = 'none';
        return;
    }

    // Update count info
    if (countInfo && countText) {
        countInfo.style.display = 'block';
        countText.textContent = `Menampilkan ${tickets.length} tiket`;
    }

    const showingAll = activeFilters.category === 'all';

    if (showingAll) {
        // Pisah per kategori
        const perbaikan = tickets.filter(t => t.category === 'Perbaikan');
        const permintaan = tickets.filter(t => t.category === 'Permintaan Barang');
        const others = tickets.filter(t => t.category !== 'Perbaikan' && t.category !== 'Permintaan Barang');

        let html = '';

        if (perbaikan.length > 0) {
            html += buildSectionHeader('🔧 Tiket Perbaikan', perbaikan.length, 'repair');
            html += perbaikan.map(t => buildTicketItem(t)).join('');
        }

        if (permintaan.length > 0) {
            html += buildSectionHeader('📦 Permintaan Barang', permintaan.length, 'request');
            html += permintaan.map(t => buildTicketItem(t)).join('');
        }

        if (others.length > 0) {
            html += buildSectionHeader('📁 Lainnya', others.length, 'other');
            html += others.map(t => buildTicketItem(t)).join('');
        }

        container.innerHTML = html;
    } else {
        // Tampilkan flat tanpa pemisah saat filter kategori spesifik
        container.innerHTML = tickets.map(t => buildTicketItem(t)).join('');
    }
}

function buildSectionHeader(label, count, type) {
    return `
        <div class="ticket-section-header ticket-section-${type}">
            <span class="section-title">${label}</span>
            <span class="section-count">${count} tiket</span>
        </div>
    `;
}

function buildTicketItem(ticket) {
    return `
        <div class="ticket-item">
            <div class="ticket-main">
                <div class="ticket-header-line">
                    <span class="ticket-num">${ticket.ticket_number}</span>
                    <span class="badge badge-${ticket.category === 'Perbaikan' ? 'repair' : 'request'}">${ticket.category || 'N/A'}</span>
                    <span class="badge badge-${ticket.priority}">${getPriorityLabel(ticket.priority)}</span>
                    <span class="badge badge-${ticket.status}">${getStatusLabel(ticket.status)}</span>
                </div>
                <h4 class="ticket-title">${ticket.title}</h4>
                <div class="ticket-meta-line">
                    <span>👤 ${ticket.reporter_name}</span>
                    <span>📅 ${formatDate(ticket.created_at)}</span>
                    ${ticket.department ? `<span>🏢 ${ticket.department}</span>` : ''}
                </div>
            </div>
            <div class="ticket-actions">
                <button class="btn btn-sm btn-outline" onclick="viewTicketDetail('${ticket.ticket_number}')">
                    Detail
                </button>
            </div>
        </div>
    `;
}

// Set active filter
function setFilter(type, value, btn) {
    activeFilters[type] = value;

    // Update active button style in the same group
    const groupId = type === 'category' ? 'categoryFilter' : 'statusFilter';
    const group = document.getElementById(groupId);
    if (group) {
        group.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    applyFilters();
}

// Apply all active filters + search
function applyFilters() {
    const searchTerm = (document.getElementById('searchTicket')?.value || '').toLowerCase().trim();

    let filtered = allTickets.filter(ticket => {
        // Filter kategori
        if (activeFilters.category !== 'all' && ticket.category !== activeFilters.category) return false;
        // Filter status
        if (activeFilters.status !== 'all' && ticket.status !== activeFilters.status) return false;
        // Filter pencarian
        if (searchTerm) {
            const match =
                ticket.ticket_number.toLowerCase().includes(searchTerm) ||
                ticket.title.toLowerCase().includes(searchTerm) ||
                ticket.reporter_name.toLowerCase().includes(searchTerm) ||
                (ticket.description && ticket.description.toLowerCase().includes(searchTerm)) ||
                (ticket.department && ticket.department.toLowerCase().includes(searchTerm));
            if (!match) return false;
        }
        return true;
    });

    displayTickets(filtered);
}

// Search tickets (legacy alias)
function searchTickets() {
    applyFilters();
}

// View ticket detail
function viewTicketDetail(ticketNumber) {
    const statusModal = document.getElementById('checkStatusModal');
    const ticketInput = statusModal.querySelector('input[name="ticket_number"]');
    
    ticketInput.value = ticketNumber;
    statusModal.classList.add('active');
    
    handleCheckStatusByNumber(ticketNumber);
}

// Handle check status by ticket number
async function handleCheckStatusByNumber(ticketNumber) {
    const resultDiv = document.getElementById('ticketStatusResult');
    if (!resultDiv) return;
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p>Mencari tiket...</p>';
    
    try {
        const response = await fetch(`${API_URL}/tickets?search=${encodeURIComponent(ticketNumber)}`);
        const result = await response.json();
        
        if (response.ok && (result.success || result.error === false) && result.data.length > 0) {
            const ticket = result.data[0];
            
            resultDiv.innerHTML = `
                <div class="ticket-status-card">
                    <div class="status-header">
                        <h3>${ticket.ticket_number}</h3>
                        <span class="badge badge-${ticket.status}">${getStatusLabel(ticket.status)}</span>
                    </div>
                    <div class="status-details">
                        <p><strong>Judul:</strong> ${ticket.title}</p>
                        <p><strong>Kategori:</strong> ${ticket.category || '-'}</p>
                        <p><strong>Prioritas:</strong> <span class="badge badge-${ticket.priority}">${getPriorityLabel(ticket.priority)}</span></p>
                        <p><strong>Deskripsi:</strong> ${ticket.description}</p>
                        <p><strong>Pelapor:</strong> ${ticket.reporter_name}</p>
                        ${ticket.reporter_email ? `<p><strong>Email:</strong> ${ticket.reporter_email}</p>` : ''}
                        ${ticket.reporter_phone ? `<p><strong>Telepon:</strong> ${ticket.reporter_phone}</p>` : ''}
                        ${ticket.department ? `<p><strong>Departemen:</strong> ${ticket.department}</p>` : ''}
                        <p><strong>Dibuat:</strong> ${formatDate(ticket.created_at)}</p>
                        ${assigneeInfo(ticket)}
                        ${hasilPerbaikanInfo(ticket)}
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-warning">
                    <p>❌ Tiket tidak ditemukan</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <p>Terjadi kesalahan</p>
            </div>
        `;
    }
}

// Helper functions
function assigneeInfo(ticket) {
    if (ticket.assigned_to) {
        return `<p><strong>Petugas:</strong> ${ticket.assignee?.full_name || 'Support Team'}</p>`;
    }
    return '';
}

function hasilPerbaikanInfo(ticket) {
    // Hanya tampil jika status pending, resolved, atau closed DAN ada isinya
    const showStatus = ['pending', 'resolved', 'closed'].includes(ticket.status);
    if (!showStatus || !ticket.hasil_perbaikan) return '';

    const label = ticket.category === 'Permintaan Barang'
        ? '📦 Hasil Permintaan'
        : '🔧 Hasil Perbaikan';

    return `
        <div style="
            margin-top: 12px;
            padding: 12px 14px;
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-left: 4px solid #16a34a;
            border-radius: 8px;
        ">
            <p style="
                font-size: 0.78rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #16a34a;
                margin-bottom: 6px;
            ">${label}</p>
            <p style="
                font-size: 0.92rem;
                color: #166534;
                line-height: 1.6;
                white-space: pre-wrap;
                margin: 0;
            ">${ticket.hasil_perbaikan}</p>
        </div>
    `;
}
function getStatusLabel(status) {
    const labels = {
        'open': 'Terbuka',
        'in_progress': 'Sedang Ditangani',
        'pending': 'Tertunda',
        'resolved': 'Selesai',
        'closed': 'Ditutup'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    const labels = {
        'low': 'Rendah',
        'medium': 'Sedang',
        'high': 'Tinggi',
        'urgent': 'Mendesak'
    };
    return labels[priority] || priority;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleIcon = document.getElementById('togglePasswordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🙈'; // Hide icon
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️'; // Show icon
    }
}
