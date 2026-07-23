// Global state
let authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || 'null');
const API_BASE_URL = window.location.origin + '/api';

console.log('=== DASHBOARD INITIALIZATION ===');
console.log('Auth Token:', authToken ? `ada (${authToken.substring(0, 20)}...)` : 'TIDAK ADA');
console.log('Current User:', currentUser);
console.log('API Base URL:', API_BASE_URL);

// State tiket
let allDashTickets = [];
let activeCategoryFilter = 'all';
let currentTicketData = null; // data tiket yang sedang dibuka di modal

// Periksa autentikasi
if (!authToken || !currentUser) {
    console.error('❌ Token atau user tidak ditemukan, redirect ke halaman utama');
    window.location.href = '/';
} else {
    console.log('✓ Auth OK - User:', currentUser.full_name, '| Role:', currentUser.role);
}

// Inisialisasi dashboard
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

function initDashboard() {
    console.log('[initDashboard] START');
    
    // Set info pengguna
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userRole').textContent = currentUser.role.toUpperCase();

    // Sembunyikan menu pengguna jika bukan admin
    if (currentUser.role !== 'admin') {
        document.getElementById('usersNav').style.display = 'none';
    }

    console.log('[initDashboard] Loading dashboard stats...');
    // Muat data dashboard
    loadDashboardStats();
    
    console.log('[initDashboard] Loading recent activity...');
    loadRecentActivity();
    
    console.log('[initDashboard] END');
}

// Navigasi
function showSection(sectionName, event) {
    // Sembunyikan semua section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Hapus active dari semua nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Tampilkan section yang dipilih
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // Set active nav item (jika event tersedia)
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Update judul halaman
    const titles = {
        dashboard: 'Dashboard',
        tickets: 'Kelola Tiket',
        users: 'Kelola Pengguna',
        logs: 'Log Aktivitas',
        profile: 'Pengaturan Profil'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];

    // Muat data section
    switch (sectionName) {
        case 'tickets':
            loadTickets();
            break;
        case 'users':
            loadUsers();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Statistik Dashboard
async function loadDashboardStats() {
    console.log('[loadDashboardStats] START');
    console.log('[loadDashboardStats] URL:', `${API_BASE_URL}/tickets/stats`);
    console.log('[loadDashboardStats] Token:', authToken ? 'ada' : 'tidak ada');
    
    // Check if elements exist
    const elements = {
        totalTickets: document.getElementById('totalTickets'),
        openTickets: document.getElementById('openTickets'),
        inProgressTickets: document.getElementById('inProgressTickets'),
        pendingTickets: document.getElementById('pendingTickets'),
        resolvedTickets: document.getElementById('resolvedTickets'),
        closedTickets: document.getElementById('closedTickets')
    };
    
    console.log('[loadDashboardStats] Elements check:', {
        totalTickets: elements.totalTickets ? 'FOUND' : 'NOT FOUND',
        openTickets: elements.openTickets ? 'FOUND' : 'NOT FOUND',
        inProgressTickets: elements.inProgressTickets ? 'FOUND' : 'NOT FOUND',
        pendingTickets: elements.pendingTickets ? 'FOUND' : 'NOT FOUND',
        resolvedTickets: elements.resolvedTickets ? 'FOUND' : 'NOT FOUND',
        closedTickets: elements.closedTickets ? 'FOUND' : 'NOT FOUND'
    });
    
    // If any element is missing, abort
    const missingElements = Object.entries(elements).filter(([key, el]) => !el).map(([key]) => key);
    if (missingElements.length > 0) {
        console.error('[loadDashboardStats] ❌ Missing DOM elements:', missingElements);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log('[loadDashboardStats] Response status:', response.status);
        const data = await response.json();
        console.log('[loadDashboardStats] Response data:', data);

        if (!response.ok) {
            console.error('[loadDashboardStats] HTTP error:', response.status, data.message);
            // Set nilai default jika gagal
            elements.totalTickets.textContent = '0';
            elements.openTickets.textContent = '0';
            elements.inProgressTickets.textContent = '0';
            elements.pendingTickets.textContent = '0';
            elements.resolvedTickets.textContent = '0';
            elements.closedTickets.textContent = '0';
            return;
        }

        // Handle berbagai kemungkinan struktur response
        const stats = data.data || data;
        
        console.log('[loadDashboardStats] Stats object:', stats);
        
        if (stats) {
            const totalTickets = stats.total_tickets || 0;
            const byStatus = stats.by_status || {};
            
            console.log('[loadDashboardStats] Total tickets:', totalTickets);
            console.log('[loadDashboardStats] By status:', byStatus);
            
            // Update DOM with logging
            console.log('[loadDashboardStats] Updating totalTickets to:', totalTickets);
            elements.totalTickets.textContent = totalTickets;
            
            console.log('[loadDashboardStats] Updating openTickets to:', byStatus.open || 0);
            elements.openTickets.textContent = byStatus.open || 0;
            
            console.log('[loadDashboardStats] Updating inProgressTickets to:', byStatus.in_progress || 0);
            elements.inProgressTickets.textContent = byStatus.in_progress || 0;
            
            console.log('[loadDashboardStats] Updating pendingTickets to:', byStatus.pending || 0);
            elements.pendingTickets.textContent = byStatus.pending || 0;
            
            console.log('[loadDashboardStats] Updating resolvedTickets to:', byStatus.resolved || 0);
            elements.resolvedTickets.textContent = byStatus.resolved || 0;
            
            console.log('[loadDashboardStats] Updating closedTickets to:', byStatus.closed || 0);
            elements.closedTickets.textContent = byStatus.closed || 0;
            
            console.log('[loadDashboardStats] ✓ Stats updated successfully');
            
            // Verify update
            setTimeout(() => {
                console.log('[loadDashboardStats] VERIFY - DOM values after update:');
                console.log('  totalTickets:', elements.totalTickets.textContent);
                console.log('  openTickets:', elements.openTickets.textContent);
                console.log('  inProgressTickets:', elements.inProgressTickets.textContent);
                console.log('  pendingTickets:', elements.pendingTickets.textContent);
                console.log('  resolvedTickets:', elements.resolvedTickets.textContent);
                console.log('  closedTickets:', elements.closedTickets.textContent);
            }, 100);
        } else {
            console.warn('[loadDashboardStats] No stats data found in response');
            // Set nilai default
            elements.totalTickets.textContent = '0';
            elements.openTickets.textContent = '0';
            elements.inProgressTickets.textContent = '0';
            elements.pendingTickets.textContent = '0';
            elements.resolvedTickets.textContent = '0';
            elements.closedTickets.textContent = '0';
        }
    } catch (error) {
        console.error('[loadDashboardStats] Error:', error);
        console.error('[loadDashboardStats] Error stack:', error.stack);
        // Set nilai default jika error
        if (elements.totalTickets) elements.totalTickets.textContent = 'Error';
        if (elements.openTickets) elements.openTickets.textContent = 'Error';
        if (elements.inProgressTickets) elements.inProgressTickets.textContent = 'Error';
        if (elements.pendingTickets) elements.pendingTickets.textContent = 'Error';
        if (elements.resolvedTickets) elements.resolvedTickets.textContent = 'Error';
        if (elements.closedTickets) elements.closedTickets.textContent = 'Error';
    }
    
    console.log('[loadDashboardStats] END');
}

async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_BASE_URL}/logs/recent?limit=10`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        console.log('[loadRecentActivity] status:', response.status);
        console.log('[loadRecentActivity] data:', data);

        const activityList = document.getElementById('recentActivityList');

        if (!response.ok) {
            activityList.innerHTML = `<p class="loading">Gagal memuat aktivitas: ${data.message || response.status}</p>`;
            return;
        }

        // Handle struktur: data.data.activity (successResponse dengan objek)
        const activities = data.data?.activity ?? data.data ?? [];

        if (Array.isArray(activities) && activities.length > 0) {
            activityList.innerHTML = activities.map(log => `
                <div class="log-item">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="log-action-badge log-action-${log.action}">${translateAction(log.action)}</span>
                            ${log.user ? `<span style="font-size: 0.85rem; color: var(--secondary);">oleh <strong>${log.user.full_name}</strong></span>` : ''}
                        </div>
                        <span style="color: var(--secondary); font-size: 0.82rem; white-space: nowrap;">
                            ${new Date(log.created_at).toLocaleString('id-ID')}
                        </span>
                    </div>
                    ${log.description ? `
                    <div style="color: var(--secondary); font-size: 0.9rem; margin-top: 6px;">
                        ${translateDescription(log.description)}
                    </div>` : ''}
                    ${log.ticket ? `
                    <div style="font-size: 0.83rem; margin-top: 5px; color: #2563eb;">
                        &#127915; ${log.ticket.ticket_number} &mdash; ${log.ticket.title}
                    </div>` : ''}
                </div>
            `).join('');
        } else {
            activityList.innerHTML = '<p class="loading">Belum ada aktivitas</p>';
        }
    } catch (error) {
        console.error('[loadRecentActivity] error:', error);
        document.getElementById('recentActivityList').innerHTML =
            '<p class="loading">Gagal memuat aktivitas</p>';
    }
}

// Tiket
async function loadTickets() {
    const status   = document.getElementById('statusFilter')?.value   || '';
    const priority = document.getElementById('priorityFilter')?.value || '';

    let url = `${API_BASE_URL}/tickets?page=1&limit=100`;
    if (status)   url += `&status=${status}`;
    if (priority) url += `&priority=${priority}`;

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.data) {
            allDashTickets = data.data;
            applyTicketFilters();
        } else {
            document.getElementById('ticketsList').innerHTML =
                '<p class="loading">Tidak ada tiket ditemukan</p>';
        }
    } catch (error) {
        console.error('Gagal memuat tiket:', error);
        document.getElementById('ticketsList').innerHTML =
            '<p class="loading">Gagal memuat tiket</p>';
    }
}

// Set filter kategori aktif
function setTicketCategory(cat, btn) {
    activeCategoryFilter = cat;
    document.querySelectorAll('.dash-filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyTicketFilters();
}

// Terapkan semua filter (kategori + status + prioritas + pencarian)
function applyTicketFilters() {
    const search   = (document.getElementById('searchTicket')?.value   || '').toLowerCase().trim();
    const status   = (document.getElementById('statusFilter')?.value   || '');
    const priority = (document.getElementById('priorityFilter')?.value || '');

    let filtered = allDashTickets.filter(ticket => {
        if (activeCategoryFilter !== 'all' && ticket.category !== activeCategoryFilter) return false;
        if (status   && ticket.status   !== status)   return false;
        if (priority && ticket.priority !== priority) return false;
        if (search) {
            const hay = [
                ticket.ticket_number,
                ticket.title,
                ticket.reporter_name,
                ticket.creator?.full_name,
                ticket.department,
                ticket.description
            ].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(search)) return false;
        }
        return true;
    });

    renderTickets(filtered);
}

// Render tiket dengan pemisah kategori
function renderTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    const countEl     = document.getElementById('dashTicketCount');

    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<p class="loading">Tidak ada tiket ditemukan</p>';
        if (countEl) countEl.textContent = '';
        return;
    }

    if (countEl) countEl.textContent = `${tickets.length} tiket`;

    const buildItem = ticket => `
        <div class="ticket-item">
            <div class="ticket-item-info" onclick="showTicketDetail('${ticket.id}')">
                <span class="ticket-number">${ticket.ticket_number}</span>
                <span class="ticket-item-title">${ticket.title}</span>
            </div>
            <div class="ticket-item-badges" onclick="showTicketDetail('${ticket.id}')">
                <span class="status-badge status-${ticket.status}">${translateStatus(ticket.status)}</span>
                <span class="priority-badge priority-badge-${ticket.priority}">${translatePriority(ticket.priority)}</span>
            </div>
            <div class="ticket-item-meta" onclick="showTicketDetail('${ticket.id}')">
                <span>📅 ${new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                ${ticket.creator ? `<span>👤 ${ticket.creator.full_name}</span>` : `<span>👤 ${ticket.reporter_name}</span>`}
                ${ticket.department ? `<span>🏢 ${ticket.department}</span>` : ''}
            </div>
            <div class="ticket-item-actions">
                <button class="btn-action btn-edit" onclick="editTicket('${ticket.id}')">✏️ Edit</button>
                ${(currentUser.role === 'admin' || currentUser.role === 'support') ? `
                <button class="btn-action btn-delete" onclick="confirmDeleteTicket('${ticket.id}', '${ticket.ticket_number}')">🗑️ Hapus</button>` : ''}
            </div>
        </div>
    `;

    const buildSeparator = (label, count, type) => `
        <div class="dash-section-header dash-section-${type}">
            <span class="dash-section-title">${label}</span>
            <span class="dash-section-count">${count} tiket</span>
        </div>
    `;

    let html = '';

    if (activeCategoryFilter === 'all') {
        const perbaikan  = tickets.filter(t => t.category === 'Perbaikan');
        const permintaan = tickets.filter(t => t.category === 'Permintaan Barang');
        const lainnya    = tickets.filter(t => t.category !== 'Perbaikan' && t.category !== 'Permintaan Barang');

        if (perbaikan.length > 0) {
            html += buildSeparator('🔧 Tiket Perbaikan', perbaikan.length, 'repair');
            html += perbaikan.map(buildItem).join('');
        }
        if (permintaan.length > 0) {
            html += buildSeparator('📦 Permintaan Barang', permintaan.length, 'request');
            html += permintaan.map(buildItem).join('');
        }
        if (lainnya.length > 0) {
            html += buildSeparator('📁 Lainnya', lainnya.length, 'other');
            html += lainnya.map(buildItem).join('');
        }
    } else {
        html = tickets.map(buildItem).join('');
    }

    ticketsList.innerHTML = html;
}

function searchTickets() {
    applyTicketFilters();
}

async function showTicketDetail(ticketId) {
    try {
        // Fetch detail tiket dan daftar staff (support+admin) secara paralel
        const [ticketRes, supportRes, adminRes] = await Promise.all([
            fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE_URL}/users/role/support`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`${API_BASE_URL}/users/role/admin`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        const ticketData = await ticketRes.json();
        const supportData = await supportRes.json();
        const adminData   = await adminRes.json();

        if (!ticketData.data) {
            alert('Gagal memuat data tiket');
            return;
        }

        const ticket = ticketData.data;
        const isFinished = ticket.status === 'resolved' || ticket.status === 'closed';

        // Simpan ke global agar bisa diakses printTicketDetail
        currentTicketData = ticket;

        // Gabung semua staff support + admin, filter aktif
        const staffList = [
            ...(supportData.data || []),
            ...(adminData.data   || [])
        ].filter(u => u.is_active !== false);

        // Build opsi dropdown staff
        const staffOptions = staffList.map(u => `
            <option value="${u.id}" ${ticket.assigned_to === u.id ? 'selected' : ''}>
                ${u.full_name} — ${translateRole(u.role)}
            </option>
        `).join('');

        document.getElementById('ticketDetail').innerHTML = `
            <div class="ticket-detail-wrap">

                <!-- Header tiket -->
                <div class="td-header">
                    <div class="td-number">${ticket.ticket_number}</div>
                    <div class="td-badges">
                        <span class="status-badge status-${ticket.status}">${translateStatus(ticket.status)}</span>
                        <span class="priority-badge priority-badge-${ticket.priority}">${translatePriority(ticket.priority)}</span>
                        ${ticket.category ? `<span class="category-badge">${ticket.category}</span>` : ''}
                    </div>
                </div>

                <!-- Judul -->
                <div class="td-section">
                    <div class="td-section-label">Judul Masalah</div>
                    <div class="td-title-box">${ticket.title}</div>
                </div>

                <!-- Grid info -->
                <div class="td-info-grid">
                    <div class="td-info-item">
                        <span class="td-info-label">Dilaporkan oleh</span>
                        <span class="td-info-value">
                            ${ticket.creator
                                ? `${ticket.creator.full_name}<br><small>${ticket.creator.email}</small>`
                                : `${ticket.reporter_name}<br><small>${ticket.reporter_email || '-'}</small>`}
                        </span>
                    </div>
                    ${ticket.reporter_phone ? `
                    <div class="td-info-item">
                        <span class="td-info-label">No. Telepon</span>
                        <span class="td-info-value">${ticket.reporter_phone}</span>
                    </div>` : ''}
                    ${ticket.department ? `
                    <div class="td-info-item">
                        <span class="td-info-label">Departemen</span>
                        <span class="td-info-value">${ticket.department}</span>
                    </div>` : ''}
                    <div class="td-info-item">
                        <span class="td-info-label">Ditangani oleh</span>
                        <span class="td-info-value">
                            <div class="td-assign-wrap">
                                <select id="assigneeSelect" class="td-select-sm">
                                    <option value="">— Belum ditugaskan —</option>
                                    ${staffOptions}
                                </select>
                                <button class="btn-assign" onclick="saveAssignee('${ticket.id}')">
                                    ✔ Tugaskan
                                </button>
                            </div>
                        </span>
                    </div>
                    <div class="td-info-item">
                        <span class="td-info-label">Tanggal Dibuat</span>
                        <span class="td-info-value">${new Date(ticket.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    ${ticket.updated_at ? `
                    <div class="td-info-item">
                        <span class="td-info-label">Terakhir Diperbarui</span>
                        <span class="td-info-value">${new Date(ticket.updated_at).toLocaleString('id-ID')}</span>
                    </div>` : ''}
                </div>

                <!-- Deskripsi -->
                <div class="td-section">
                    <div class="td-section-label">Deskripsi Masalah</div>
                    <div class="td-description">${ticket.description}</div>
                </div>

                <!-- Hasil Perbaikan / Permintaan (tampil jika status pending atau resolved) -->
                ${(ticket.status === 'pending' || ticket.status === 'resolved' || ticket.status === 'closed') ? `
                <div class="td-section" id="hasilPerbaikanSection">
                    <div class="td-section-label" style="display:flex;align-items:center;justify-content:space-between;">
                        <span>
                            ${ticket.category === 'Permintaan Barang' ? '📦 Hasil Permintaan' : '🔧 Hasil Perbaikan'}
                        </span>
                        ${ticket.status !== 'closed' ? `
                        <button class="btn-assign" id="btnSimpanHasil" onclick="saveHasilPerbaikan('${ticket.id}')"
                            style="font-size:0.8rem;padding:4px 12px;">
                            💾 Simpan
                        </button>` : ''}
                    </div>
                    <textarea
                        id="hasilPerbaikanInput"
                        class="td-description"
                        rows="4"
                        ${ticket.status === 'closed' ? 'readonly' : ''}
                        placeholder="${ticket.category === 'Permintaan Barang'
                            ? 'Tuliskan hasil atau keterangan penyelesaian permintaan...'
                            : 'Tuliskan hasil atau keterangan perbaikan yang telah dilakukan...'}"
                        style="resize:vertical;min-height:90px;font-family:inherit;font-size:0.92rem;line-height:1.6;
                               ${ticket.status === 'closed' ? 'background:#f8fafc;color:#475569;cursor:not-allowed;' : ''}"
                    >${ticket.hasil_perbaikan || ''}</textarea>
                    ${ticket.status === 'closed' ? `
                    <small style="color:#94a3b8;font-size:0.78rem;">
                        🔒 Tiket sudah ditutup, hasil perbaikan tidak dapat diubah.
                    </small>` : ''}
                </div>` : ''}

                <!-- Divider -->
                <hr class="td-divider">

                <!-- Aksi -->
                <div class="td-actions">
                    <div class="td-update-status">
                        <select id="updateStatus" class="td-select">
                            <option value="">-- Ubah Status --</option>
                            <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Terbuka</option>
                            <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>Sedang Ditangani</option>
                            <option value="pending" ${ticket.status === 'pending' ? 'selected' : ''}>Tertunda</option>
                            <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Selesai</option>
                            <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Ditutup</option>
                        </select>
                        <button class="btn btn-primary" onclick="updateTicketStatus('${ticket.id}')">
                            💾 Perbarui
                        </button>
                    </div>
                    <div class="td-action-btns">
                        ${isFinished ? `
                        <button class="btn btn-print" onclick="printTicketDetail()">
                            🖨️ Cetak
                        </button>` : ''}
                    </div>
                </div>

            </div>
        `;

        document.getElementById('ticketModal').classList.add('active');

    } catch (error) {
        console.error('Gagal memuat detail tiket:', error);
        alert('Gagal memuat detail tiket');
    }
}

// Simpan penugasan staff ke tiket
async function saveAssignee(ticketId) {
    const select = document.getElementById('assigneeSelect');
    const assignedTo = select.value || null;
    const btn = select.parentElement.querySelector('.btn-assign');

    btn.disabled = true;
    btn.textContent = '...';

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ assigned_to: assignedTo })
        });

        const data = await response.json();

        if (response.ok) {
            const nama = select.options[select.selectedIndex].text;
            btn.textContent = '✔ Tersimpan';
            btn.style.background = '#065f46';
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = '✔ Tugaskan';
                btn.style.background = '';
            }, 2000);
            loadTickets();
        } else {
            alert(data.message || 'Gagal menyimpan penugasan');
            btn.disabled = false;
            btn.textContent = '✔ Tugaskan';
        }
    } catch (error) {
        console.error('Gagal menyimpan penugasan:', error);
        alert('Gagal menyimpan penugasan');
        btn.disabled = false;
        btn.textContent = '✔ Tugaskan';
    }
}

// Simpan hasil perbaikan / permintaan
async function saveHasilPerbaikan(ticketId) {
    const textarea = document.getElementById('hasilPerbaikanInput');
    const btn      = document.getElementById('btnSimpanHasil');

    if (!textarea) return;

    const nilai = textarea.value.trim();
    if (!nilai) {
        textarea.focus();
        textarea.style.border = '2px solid #ef4444';
        textarea.placeholder  = '⚠️ Isi hasil perbaikan terlebih dahulu...';
        setTimeout(() => {
            textarea.style.border = '';
            textarea.placeholder  = '';
        }, 2500);
        return;
    }

    // Simpan nilai sebelum-request untuk fallback
    const nilaiAwal = currentTicketData?.hasil_perbaikan || '';

    btn.disabled    = true;
    btn.textContent = '...';

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hasil_perbaikan: nilai })
        });

        const data = await response.json();

        if (response.ok) {
            // Perbarui data global
            if (currentTicketData) currentTicketData.hasil_perbaikan = nilai;

            // Feedback sukses
            btn.textContent       = '✔ Tersimpan';
            btn.style.background  = '#065f46';
            textarea.style.border = '2px solid #10b981';

            setTimeout(() => {
                btn.disabled       = false;
                btn.textContent    = '💾 Simpan';
                btn.style.background = '';
                textarea.style.border = '';
            }, 2500);
        } else {
            alert(data.message || 'Gagal menyimpan hasil perbaikan');
            btn.disabled    = false;
            btn.textContent = '💾 Simpan';
        }
    } catch (error) {
        console.error('Gagal menyimpan hasil perbaikan:', error);
        alert('Terjadi kesalahan saat menyimpan');
        btn.disabled    = false;
        btn.textContent = '💾 Simpan';
    }
}

// Print tiket (hanya untuk status selesai/ditutup)
function printTicketDetail() {
    const source   = document.getElementById('ticketDetail');
    const ticket   = currentTicketData || {};

    // ── Ambil nama staff dari dropdown ───────────────────────────────
    const assigneeEl  = source.querySelector('#assigneeSelect');
    const assigneeOpt = assigneeEl ? assigneeEl.options[assigneeEl.selectedIndex] : null;
    const namaStaff   = (assigneeOpt && assigneeOpt.value)
        ? assigneeOpt.text.split('—')[0].trim()
        : '&nbsp;';

    // ── Helper format ─────────────────────────────────────────────────
    const fmt = v => v || '<span style="color:#94a3b8;font-style:italic;">-</span>';

    const statusLabel = {
        open:'Terbuka', in_progress:'Sedang Ditangani',
        pending:'Tertunda', resolved:'Selesai', closed:'Ditutup'
    }[ticket.status] || ticket.status || '-';

    const priorityLabel = {
        low:'Rendah', medium:'Sedang', high:'Tinggi', urgent:'Mendesak'
    }[ticket.priority] || ticket.priority || '-';

    const statusColor = {
        open:'#dc2626', in_progress:'#d97706',
        pending:'#ca8a04', resolved:'#16a34a', closed:'#475569'
    }[ticket.status] || '#475569';

    const priorityColor = {
        low:'#0369a1', medium:'#d97706', high:'#ea580c', urgent:'#dc2626'
    }[ticket.priority] || '#475569';

    const formatTgl = d => d ? new Date(d).toLocaleString('id-ID', {
        day:'2-digit', month:'long', year:'numeric',
        hour:'2-digit', minute:'2-digit'
    }) : '-';

    // ── Data pelapor & penugasan ──────────────────────────────────────
    const namaUser   = fmt(ticket.reporter_name);
    const emailUser  = fmt(ticket.reporter_email);
    const phoneUser  = fmt(ticket.reporter_phone);
    const dept       = fmt(ticket.department);
    const kategori   = (ticket.category || '').trim();
    const tglBuat    = formatTgl(ticket.created_at);
    const tglUpdate  = formatTgl(ticket.updated_at);

    // ── Ambil hasil perbaikan dari textarea (jika ada perubahan live) atau dari data
    const hasilTextarea = document.getElementById('hasilPerbaikanInput');
    const hasilPerbaikan = hasilTextarea
        ? (hasilTextarea.value.trim() || ticket.hasil_perbaikan || '')
        : (ticket.hasil_perbaikan || '');
    const hasilLabel = kategori === 'Permintaan Barang' ? 'Hasil Permintaan' : 'Hasil Perbaikan';

    // ── Pengesahan / tanda tangan ─────────────────────────────────────
    const ttdCell = (jabatan, nama) => `
        <td style="width:${kategori==='Permintaan Barang'?'33%':'50%'};text-align:center;padding:12px 8px;vertical-align:bottom;">
            <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:6px;">${jabatan}</div>
            <div style="height:70px;"></div>
            <div style="border-top:1.5px solid #334155;margin:0 auto;width:80%;"></div>
            <div style="font-size:11px;color:#334155;font-weight:600;margin-top:6px;min-height:18px;">${nama}</div>
        </td>`;

    const ttdRow = kategori === 'Permintaan Barang'
        ? ttdCell('User / Pemohon', namaUser) +
          ttdCell('Staff IT', namaStaff) +
          ttdCell('Manager IT', '&nbsp;')
        : ttdCell('User / Pemohon', namaUser) +
          ttdCell('Staff IT', namaStaff);

    // ── Deskripsi ─────────────────────────────────────────────────────
    const deskripsi = (ticket.description || '-').replace(/\n/g, '<br>');

    const printWindow = window.open('', '_blank', 'width=860,height=760');
    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Cetak Tiket — ${ticket.ticket_number || ''}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #1e293b;
    background: #fff;
    padding: 32px 36px;
    line-height: 1.5;
  }

  /* ── Header ── */
  .header-wrap {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }
  .header-logo { font-size: 1.3rem; font-weight: 800; color: #2563eb; }
  .header-sub  { font-size: 11px; color: #64748b; margin-top: 2px; }
  .header-right { text-align: right; font-size: 11px; color: #64748b; }
  .header-right strong { display: block; color: #1e293b; font-size: 12px; margin-top: 2px; }

  /* ── Section Title ── */
  .sec-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #fff;
    background: #2563eb;
    padding: 5px 10px;
    margin: 0 0 0 0;
  }

  /* ── Tabel Info ── */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  .info-table th, .info-table td {
    border: 1px solid #cbd5e1;
    padding: 7px 10px;
    vertical-align: top;
    text-align: left;
    font-size: 12px;
  }
  .info-table th {
    background: #f1f5f9;
    color: #475569;
    font-weight: 700;
    width: 28%;
    white-space: nowrap;
  }
  .info-table td { color: #1e293b; }
  .info-table tr:nth-child(even) td { background: #f8fafc; }

  /* ── Nomor Tiket ── */
  .ticket-number {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: 800;
    color: #2563eb;
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    padding: 4px 14px;
    border-radius: 5px;
    display: inline-block;
    letter-spacing: 1px;
  }

  /* ── Badge Status & Prioritas ── */
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  /* ── Deskripsi ── */
  .desc-box {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  .desc-box td {
    border: 1px solid #cbd5e1;
    padding: 10px 12px;
    font-size: 12px;
    color: #1e293b;
    line-height: 1.7;
    background: #fafcff;
    border-left: 4px solid #2563eb;
  }

  /* ── Pengesahan ── */
  .ttd-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #fff;
    background: #334155;
    padding: 5px 10px;
    margin-bottom: 0;
  }
  .ttd-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #cbd5e1;
    margin-bottom: 14px;
  }
  .ttd-table td {
    border: 1px solid #cbd5e1;
    padding: 10px 8px 12px;
  }

  /* ── Footer ── */
  .print-footer {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
  }

  @media print {
    body { padding: 20px 24px; }
    @page { margin: 1.5cm; }
  }
</style>
</head>
<body>

<!-- ═══════════════════════ HEADER ═══════════════════════ -->
<div class="header-wrap">
  <div>
    <div class="header-logo">🎫 Helpdesk IT System</div>
    <div class="header-sub">Laporan / Cetak Tiket</div>
  </div>
  <div class="header-right">
    Dicetak pada:<br>
    <strong>${new Date().toLocaleString('id-ID', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</strong>
  </div>
</div>

<!-- ═══════════════════════ INFO TIKET ═══════════════════════ -->
<div class="sec-title">Informasi Tiket</div>
<table class="info-table">
  <tr>
    <th>Nomor Tiket</th>
    <td><span class="ticket-number">${ticket.ticket_number || '-'}</span></td>
    <th>Kategori</th>
    <td>${fmt(ticket.category)}</td>
  </tr>
  <tr>
    <th>Status</th>
    <td><span class="badge" style="background:${statusColor}22;color:${statusColor};">${statusLabel}</span></td>
    <th>Prioritas</th>
    <td><span class="badge" style="background:${priorityColor}22;color:${priorityColor};">${priorityLabel}</span></td>
  </tr>
  <tr>
    <th>Tanggal Dibuat</th>
    <td>${tglBuat}</td>
    <th>Terakhir Diperbarui</th>
    <td>${tglUpdate}</td>
  </tr>
  <tr>
    <th>Ditugaskan Kepada</th>
    <td colspan="3">${namaStaff !== '&nbsp;' ? namaStaff : '<span style="color:#94a3b8;font-style:italic;">Belum ditugaskan</span>'}</td>
  </tr>
</table>

<!-- ═══════════════════════ JUDUL TIKET ═══════════════════════ -->
<div class="sec-title">Judul</div>
<table class="desc-box" style="margin-bottom:14px;">
  <tr>
    <td style="border-left:4px solid #64748b;background:#f8fafc;font-weight:700;font-size:13px;">
      ${fmt(ticket.title)}
    </td>
  </tr>
</table>

<!-- ═══════════════════════ DESKRIPSI ═══════════════════════ -->
<div class="sec-title">Deskripsi Masalah / Permintaan</div>
<table class="desc-box">
  <tr><td>${deskripsi}</td></tr>
</table>

<!-- ═══════════════════════ HASIL PERBAIKAN ═══════════════════════ -->
${hasilPerbaikan ? `
<div class="sec-title" style="background:#065f46;">${hasilLabel}</div>
<table class="desc-box" style="margin-bottom:14px;">
  <tr>
    <td style="border-left:4px solid #065f46;background:#f0fdf4;line-height:1.7;">
      ${hasilPerbaikan.replace(/\n/g, '<br>')}
    </td>
  </tr>
</table>
` : `
<div class="sec-title" style="background:#94a3b8;">${hasilLabel}</div>
<table class="desc-box" style="margin-bottom:14px;">
  <tr>
    <td style="border-left:4px solid #94a3b8;background:#f8fafc;color:#94a3b8;font-style:italic;">
      Belum diisi
    </td>
  </tr>
</table>
`}

<!-- ═══════════════════════ DATA PELAPOR ═══════════════════════ -->
<div class="sec-title">Data Pelapor</div>
<table class="info-table">
  <tr>
    <th>Nama Pelapor</th>
    <td>${namaUser}</td>
    <th>Departemen</th>
    <td>${dept}</td>
  </tr>
  <tr>
    <th>Email</th>
    <td>${emailUser}</td>
    <th>Telepon</th>
    <td>${phoneUser}</td>
  </tr>
</table>

<!-- ═══════════════════════ PENGESAHAN ═══════════════════════ -->
<div class="ttd-title">Pengesahan</div>
<table class="ttd-table">
  <tr>${ttdRow}</tr>
</table>

<!-- ═══════════════════════ FOOTER ═══════════════════════ -->
<div class="print-footer">
  Dokumen ini dicetak dari Sistem Helpdesk IT &mdash;
  ${new Date().toLocaleDateString('id-ID', {year:'numeric', month:'long', day:'numeric'})} &mdash;
  Nomor Tiket: ${ticket.ticket_number || '-'}
</div>

<script>
  window.onload = function () {
    window.print();
    window.onafterprint = function () { window.close(); };
  };
<\/script>
</body>
</html>`);
    printWindow.document.close();
}

async function updateTicketStatus(ticketId) {
    const newStatus = document.getElementById('updateStatus').value;

    if (!newStatus) {
        alert('Pilih status terlebih dahulu');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Status tiket berhasil diperbarui!');
            closeModal('ticketModal');
            loadTickets();
            loadDashboardStats();
        } else {
            alert(data.message || 'Gagal memperbarui tiket');
        }
    } catch (error) {
        console.error('Gagal memperbarui tiket:', error);
        alert('Gagal memperbarui tiket');
    }
}

// Buka modal edit dan isi data tiket yang ada
async function editTicket(ticketId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (!data.data) {
            alert('Gagal memuat data tiket');
            return;
        }

        const ticket = data.data;
        const form = document.getElementById('editTicketForm');

        form.elements['edit_ticket_id'].value   = ticket.id;
        form.elements['edit_title'].value        = ticket.title;
        form.elements['edit_description'].value  = ticket.description;
        form.elements['edit_priority'].value     = ticket.priority;
        form.elements['edit_status'].value       = ticket.status;
        form.elements['edit_category'].value     = ticket.category || '';

        // Store original values for comparison
        form.dataset.originalCategory = ticket.category || '';
        form.dataset.originalPriority = ticket.priority;
        form.dataset.originalStatus = ticket.status;

        // Set judul modal
        document.getElementById('editTicketNumber').textContent = ticket.ticket_number;

        document.getElementById('editTicketModal').classList.add('active');
    } catch (error) {
        console.error('Gagal memuat tiket untuk diedit:', error);
        alert('Gagal memuat data tiket');
    }
}

// Submit form edit tiket
async function handleEditTicket(event) {
    event.preventDefault();

    const form = event.target;
    const ticketId  = form.elements['edit_ticket_id'].value;
    const submitBtn = form.querySelector('button[type="submit"]');

    const payload = {
        title:       form.elements['edit_title'].value.trim(),
        description: form.elements['edit_description'].value.trim(),
        priority:    form.elements['edit_priority'].value,
        status:      form.elements['edit_status'].value,
        category:    form.elements['edit_category'].value
    };

    if (!payload.title || !payload.description) {
        alert('Judul dan deskripsi tidak boleh kosong');
        return;
    }

    // Check for important changes and show warnings
    const warnings = [];
    const originalCategory = form.dataset.originalCategory || '';
    const originalPriority = form.dataset.originalPriority || '';
    const originalStatus = form.dataset.originalStatus || '';

    // Warning for category change
    if (payload.category !== originalCategory) {
        warnings.push(
            `⚠️ KATEGORI DIUBAH:\n` +
            `   Dari: "${originalCategory || 'Tidak ada'}"\n` +
            `   Ke: "${payload.category}"\n\n` +
            `   Catatan: Nomor tiket TIDAK akan berubah.\n` +
            `   Perubahan ini akan dicatat di log aktivitas.`
        );
    }

    // Warning for priority change to/from urgent
    if (payload.priority === 'urgent' && originalPriority !== 'urgent') {
        warnings.push(
            `🚨 PRIORITAS DIUBAH KE URGENT!\n` +
            `   Tiket ini akan menjadi prioritas tertinggi.`
        );
    } else if (originalPriority === 'urgent' && payload.priority !== 'urgent') {
        warnings.push(
            `⚠️ Prioritas URGENT diturunkan ke "${payload.priority}".`
        );
    }

    // Warning for status change to closed
    if (payload.status === 'closed' && originalStatus !== 'closed') {
        warnings.push(
            `🔒 TIKET AKAN DITUTUP!\n` +
            `   Pastikan semua penanganan sudah selesai.`
        );
    }

    // Show confirmation if there are warnings
    if (warnings.length > 0) {
        const warningMessage = warnings.join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
        const confirmMessage = `${warningMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\nLanjutkan perubahan?`;
        
        if (!confirm(confirmMessage)) {
            return; // User cancelled
        }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // Show success message with changes summary
            let successMessage = '✅ Tiket berhasil diperbarui!';
            if (warnings.length > 0) {
                successMessage += '\n\nPerubahan telah dicatat di log aktivitas.';
            }
            alert(successMessage);
            
            closeModal('editTicketModal');
            form.reset();
            loadTickets();
            loadDashboardStats();
        } else {
            alert(data.message || 'Gagal memperbarui tiket');
        }
    } catch (error) {
        console.error('Gagal memperbarui tiket:', error);
        alert('Gagal memperbarui tiket');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Perubahan';
    }
}

// Konfirmasi lalu hapus tiket (admin & support)
async function confirmDeleteTicket(ticketId, ticketNumber) {
    if (!confirm(`Yakin ingin menghapus tiket ${ticketNumber}?\n\nTindakan ini tidak dapat dibatalkan.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Tiket ${ticketNumber} berhasil dihapus.`);
            loadTickets();
            loadDashboardStats();
        } else {
            alert(data.message || 'Gagal menghapus tiket');
        }
    } catch (error) {
        console.error('Gagal menghapus tiket:', error);
        alert('Gagal menghapus tiket');
    }
}

function searchTickets() {
    const searchTerm = document.getElementById('searchTicket').value.toLowerCase();
    const tickets = document.querySelectorAll('.ticket-item');

    tickets.forEach(ticket => {
        const text = ticket.textContent.toLowerCase();
        ticket.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// Kelola Pengguna
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users?page=1&limit=100`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        const usersList = document.getElementById('usersList');

        if (data.data && data.data.length > 0) {
            usersList.innerHTML = data.data.map(user => `
                <div class="user-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3>${user.full_name}</h3>
                            <p style="color: var(--secondary); font-size: 0.9rem;">
                                @${user.username} • ${translateRole(user.role)}
                            </p>
                            <p style="font-size: 0.85rem;">${user.email || 'Tidak ada email'}</p>
                        </div>
                        <div>
                            <span class="badge ${user.is_active ? 'badge-success' : 'badge-danger'}">
                                ${user.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                            ${currentUser.role === 'admin' ? `
                                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}', '${user.username}')">Hapus</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            usersList.innerHTML = '<p class="loading">Tidak ada pengguna ditemukan</p>';
        }
    } catch (error) {
        console.error('Gagal memuat pengguna:', error);
        document.getElementById('usersList').innerHTML =
            '<p class="loading">Gagal memuat pengguna</p>';
    }
}

function showCreateUserModal() {
    document.getElementById('createUserModal').classList.add('active');
}

async function handleCreateUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Pengguna berhasil dibuat!');
            closeModal('createUserModal');
            event.target.reset();
            loadUsers();
        } else {
            alert(data.message || 'Gagal membuat pengguna');
        }
    } catch (error) {
        console.error('Gagal membuat pengguna:', error);
        alert('Gagal membuat pengguna');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Yakin ingin menghapus pengguna "${username}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Pengguna berhasil dihapus!');
            loadUsers();
        } else {
            alert(data.message || 'Gagal menghapus pengguna');
        }
    } catch (error) {
        console.error('Gagal menghapus pengguna:', error);
        alert('Gagal menghapus pengguna');
    }
}

// Log Aktivitas
async function loadLogs() {
    const logsList = document.getElementById('logsList');
    const clearBtn = document.getElementById('btnClearLog');

    logsList.innerHTML = '<p class="loading">Memuat log...</p>';
    if (clearBtn) clearBtn.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/logs?page=1&limit=50`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        console.log('[loadLogs] response status:', response.status);
        console.log('[loadLogs] response data:', data);

        // Handle berbagai kemungkinan struktur response
        const logs = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.data?.logs)
                ? data.data.logs
                : null;

        if (!response.ok) {
            console.error('[loadLogs] HTTP error:', response.status, data.message);
            logsList.innerHTML = `<p class="loading">Gagal memuat log: ${data.message || response.status}</p>`;
            return;
        }

        if (logs && logs.length > 0) {
            logsList.innerHTML = logs.map(log => `
                <div class="log-item">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="log-action-badge log-action-${log.action}">${translateAction(log.action)}</span>
                            ${log.user ? `<span style="font-size: 0.85rem; color: var(--secondary);">oleh <strong>${log.user.full_name}</strong></span>` : ''}
                        </div>
                        <span style="color: var(--secondary); font-size: 0.82rem; white-space: nowrap;">
                            ${new Date(log.created_at).toLocaleString('id-ID')}
                        </span>
                    </div>
                    ${log.description ? `
                    <div style="color: var(--secondary); font-size: 0.9rem; margin-top: 6px;">
                        ${translateDescription(log.description)}
                    </div>` : ''}
                    ${log.ticket ? `
                    <div style="font-size: 0.83rem; margin-top: 5px; color: #2563eb;">
                        &#127915; ${log.ticket.ticket_number} &mdash; ${log.ticket.title}
                    </div>` : ''}
                </div>
            `).join('');

            if (clearBtn) clearBtn.style.display = 'inline-flex';
        } else {
            logsList.innerHTML = '<p class="loading">Tidak ada log ditemukan</p>';
        }
    } catch (error) {
        console.error('[loadLogs] Gagal memuat log:', error);
        logsList.innerHTML = '<p class="loading">Gagal memuat log</p>';
    }
}

// Bersihkan tampilan log (UI only, data di database tetap aman)
function clearLogView() {
    const logsList = document.getElementById('logsList');
    const clearBtn = document.getElementById('btnClearLog');

    logsList.innerHTML = `
        <div class="log-cleared">
            <div class="log-cleared-icon">🗑️</div>
            <p>Tampilan log dibersihkan</p>
            <button class="btn btn-secondary btn-sm" onclick="loadLogs()" style="margin-top:10px;">
                🔄 Muat Ulang Log
            </button>
        </div>
    `;

    if (clearBtn) clearBtn.style.display = 'none';
}

// Profil
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (data.data) {
            const user = data.data;
            document.getElementById('profileName').textContent = user.full_name;
            document.getElementById('profileEmail').textContent = user.email || 'Tidak ada email';
            document.getElementById('profileUsername').textContent = user.username;
            document.getElementById('profileRole').textContent = translateRole(user.role);
        }
    } catch (error) {
        console.error('Gagal memuat profil:', error);
    }
}

function showChangePasswordModal() {
    // Clear form fields untuk keamanan
    const form = document.getElementById('changePasswordForm');
    if (form) {
        form.reset();
        // Reset semua password fields ke type password (hide)
        document.getElementById('currentPassword').type = 'password';
        document.getElementById('newPassword').type = 'password';
        document.getElementById('confirmPassword').type = 'password';
        // Reset icons
        document.getElementById('toggleCurrentIcon').textContent = '👁️';
        document.getElementById('toggleNewIcon').textContent = '👁️';
        document.getElementById('toggleConfirmIcon').textContent = '👁️';
    }
    document.getElementById('changePasswordModal').classList.add('active');
}

async function handleChangePassword(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    if (data.new_password !== data.confirm_password) {
        alert('Password baru tidak cocok!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: data.current_password,
                new_password: data.new_password
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Password berhasil diubah!');
            closeModal('changePasswordModal');
            event.target.reset();
        } else {
            alert(result.message || 'Gagal mengubah password');
            // Clear password fields on error untuk keamanan
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }
    } catch (error) {
        console.error('Gagal mengubah password:', error);
        alert('Gagal mengubah password');
        // Clear password fields on error
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }
}

// Fungsi Utilitas
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    
    // Clear password fields jika modal ubah password
    if (modalId === 'changePasswordModal') {
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.reset();
            // Reset password visibility
            document.getElementById('currentPassword').type = 'password';
            document.getElementById('newPassword').type = 'password';
            document.getElementById('confirmPassword').type = 'password';
            // Reset icons
            document.getElementById('toggleCurrentIcon').textContent = '👁️';
            document.getElementById('toggleNewIcon').textContent = '👁️';
            document.getElementById('toggleConfirmIcon').textContent = '👁️';
        }
    }
}

function logout() {
    if (confirm('Yakin ingin keluar?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    }
}

// Toggle password visibility untuk modal ubah password
function togglePasswordField(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🙈'; // Hide icon
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️'; // Show icon
    }
}

// ============================================================================
// DOWNLOAD/EXPORT FUNCTIONS
// ============================================================================

/**
 * Download Tickets Report as Excel (.xlsx)
 */
async function downloadTicketsReport(buttonElement) {
    // Validate parameters
    if (!buttonElement) {
        console.error('[downloadTicketsReport] ERROR: buttonElement is undefined');
        alert('Error: Button element tidak ditemukan');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Library Excel belum ter-load. Refresh halaman dan coba lagi.');
        return;
    }

    try {
        console.log('[downloadTicketsReport] START');
        console.log('[downloadTicketsReport] API_BASE_URL:', API_BASE_URL);
        console.log('[downloadTicketsReport] authToken:', authToken ? 'ada' : 'TIDAK ADA');
        
        // Show loading indicator
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Memproses...';
        buttonElement.disabled = true;
        
        // Fetch tickets with pagination (max 100 per request due to validation)
        let allTickets = [];
        let page = 1;
        let hasMore = true;
        const limit = 100; // Max allowed by validation
        
        console.log('[downloadTicketsReport] Fetching tickets with pagination...');
        
        while (hasMore) {
            const url = `${API_BASE_URL}/tickets?page=${page}&limit=${limit}`;
            console.log(`[downloadTicketsReport] Fetching page ${page}: ${url}`);
            
            const response = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`[downloadTicketsReport] Page ${page} response status:`, response.status);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Data tiket tidak valid atau kosong');
            }
            
            const tickets = data.data;
            console.log(`[downloadTicketsReport] Page ${page} found ${tickets.length} tickets`);
            
            if (tickets.length > 0) {
                allTickets = allTickets.concat(tickets);
                page++;
                // If we got less than limit, no more pages
                hasMore = tickets.length === limit;
            } else {
                hasMore = false;
            }
            
            // Safety limit - max 20 pages (2000 tickets)
            if (page > 20) {
                console.log('[downloadTicketsReport] Reached safety limit (20 pages)');
                hasMore = false;
            }
        }
        
        console.log(`[downloadTicketsReport] Total tickets fetched: ${allTickets.length}`);
        
        if (allTickets.length === 0) {
            alert('Tidak ada data tiket untuk di-download');
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
            return;
        }
        
        // Prepare Excel data
        const excelData = [
            // Header row
            ['No', 'Nomor Tiket', 'Judul', 'Kategori', 'Status', 'Prioritas', 'Pelapor', 'Email', 'Telepon', 'Departemen', 'Ditugaskan Ke', 'Tanggal Dibuat', 'Terakhir Update', 'Deskripsi']
        ];
        
        // Data rows
        allTickets.forEach((ticket, index) => {
            excelData.push([
                index + 1,
                ticket.ticket_number,
                ticket.title || '-',
                ticket.category || '-',
                translateStatus(ticket.status),
                translatePriority(ticket.priority),
                ticket.reporter_name || '-',
                ticket.reporter_email || '-',
                ticket.reporter_phone || '-',
                ticket.department || '-',
                ticket.assignee?.full_name || 'Belum ditugaskan',
                formatDateForExport(ticket.created_at),
                formatDateForExport(ticket.updated_at),
                (ticket.description || '').substring(0, 200)
            ]);
        });
        
        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // No
            { wch: 25 },  // Nomor Tiket
            { wch: 35 },  // Judul
            { wch: 18 },  // Kategori
            { wch: 16 },  // Status
            { wch: 12 },  // Prioritas
            { wch: 20 },  // Pelapor
            { wch: 25 },  // Email
            { wch: 15 },  // Telepon
            { wch: 18 },  // Departemen
            { wch: 20 },  // Ditugaskan Ke
            { wch: 18 },  // Tanggal Dibuat
            { wch: 18 },  // Terakhir Update
            { wch: 50 }   // Deskripsi
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Tiket');
        
        // Generate Excel file and download
        XLSX.writeFile(wb, `Rekapitulasi_Tiket_${formatDateForFilename()}.xlsx`);
        
        console.log('[downloadTicketsReport] Download complete');
        alert(`✅ ${allTickets.length} tiket berhasil di-download!\n\nFile: Rekapitulasi_Tiket_${formatDateForFilename()}.xlsx`);
        
        // Restore button
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
        
    } catch (error) {
        console.error('[downloadTicketsReport] CATCH ERROR');
        console.error('[downloadTicketsReport] Error type:', error.constructor.name);
        console.error('[downloadTicketsReport] Error message:', error.message);
        console.error('[downloadTicketsReport] Error stack:', error.stack);
        
        let errorMessage = 'Gagal download rekapitulasi tiket';
        
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            errorMessage = 'Gagal menghubungi server. Pastikan:\n' +
                          '1. Koneksi internet aktif\n' +
                          '2. Server berjalan di ' + API_BASE_URL + '\n' +
                          '3. Token login masih valid';
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        alert(errorMessage);
        
        if (buttonElement) {
            buttonElement.textContent = '📥 Download';
            buttonElement.disabled = false;
        }
    }
}

/**
 * Download Logs Report as Excel (.xlsx)
 */
async function downloadLogsReport(buttonElement) {
    // Validate parameters
    if (!buttonElement) {
        console.error('[downloadLogsReport] ERROR: buttonElement is undefined');
        alert('Error: Button element tidak ditemukan');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Library Excel belum ter-load. Refresh halaman dan coba lagi.');
        return;
    }

    try {
        console.log('[downloadLogsReport] START');
        console.log('[downloadLogsReport] API_BASE_URL:', API_BASE_URL);
        console.log('[downloadLogsReport] authToken:', authToken ? 'ada' : 'TIDAK ADA');
        
        // Show loading indicator
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Memproses...';
        buttonElement.disabled = true;
        
        // Fetch logs with pagination (max 100 per request due to validation)
        let allLogs = [];
        let page = 1;
        let hasMore = true;
        const limit = 100; // Max allowed by validation
        
        console.log('[downloadLogsReport] Fetching logs with pagination...');
        
        while (hasMore) {
            const url = `${API_BASE_URL}/logs?page=${page}&limit=${limit}`;
            console.log(`[downloadLogsReport] Fetching page ${page}: ${url}`);
            
            const response = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`[downloadLogsReport] Page ${page} response status:`, response.status);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Handle different response structures
            const logs = Array.isArray(data.data)
                ? data.data
                : Array.isArray(data.data?.logs)
                    ? data.data.logs
                    : [];
            
            console.log(`[downloadLogsReport] Page ${page} found ${logs.length} logs`);
            
            if (logs.length > 0) {
                allLogs = allLogs.concat(logs);
                page++;
                // If we got less than limit, no more pages
                hasMore = logs.length === limit;
            } else {
                hasMore = false;
            }
            
            // Safety limit - max 10 pages (1000 logs)
            if (page > 10) {
                console.log('[downloadLogsReport] Reached safety limit (10 pages)');
                hasMore = false;
            }
        }
        
        console.log(`[downloadLogsReport] Total logs fetched: ${allLogs.length}`);
        
        if (allLogs.length === 0) {
            alert('Tidak ada data log untuk di-download');
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
            return;
        }
        
        // Prepare Excel data
        const excelData = [
            // Header row
            ['No', 'Tanggal & Waktu', 'Aksi', 'Deskripsi', 'User', 'Role User', 'Nomor Tiket', 'Judul Tiket']
        ];
        
        // Data rows
        allLogs.forEach((log, index) => {
            excelData.push([
                index + 1,
                formatDateTimeForExport(log.created_at),
                translateAction(log.action),
                translateDescription(log.description) || '-',
                log.user?.full_name || '-',
                log.user?.role ? translateRole(log.user.role) : '-',
                log.ticket?.ticket_number || '-',
                log.ticket?.title || '-'
            ]);
        });
        
        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // No
            { wch: 20 },  // Tanggal & Waktu
            { wch: 18 },  // Aksi
            { wch: 40 },  // Deskripsi
            { wch: 20 },  // User
            { wch: 12 },  // Role User
            { wch: 25 },  // Nomor Tiket
            { wch: 40 }   // Judul Tiket
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Log Aktivitas');
        
        // Generate Excel file and download
        XLSX.writeFile(wb, `Log_Aktivitas_${formatDateForFilename()}.xlsx`);
        
        console.log('[downloadLogsReport] Download complete');
        alert(`✅ ${allLogs.length} log aktivitas berhasil di-download!\n\nFile: Log_Aktivitas_${formatDateForFilename()}.xlsx`);
        
        // Restore button
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
        
    } catch (error) {
        console.error('[downloadLogsReport] CATCH ERROR');
        console.error('[downloadLogsReport] Error type:', error.constructor.name);
        console.error('[downloadLogsReport] Error message:', error.message);
        console.error('[downloadLogsReport] Error stack:', error.stack);
        
        let errorMessage = 'Gagal download log aktivitas';
        
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            errorMessage = 'Gagal menghubungi server. Pastikan:\n' +
                          '1. Koneksi internet aktif\n' +
                          '2. Server berjalan di ' + API_BASE_URL + '\n' +
                          '3. Token login masih valid';
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        alert(errorMessage);
        
        if (buttonElement) {
            buttonElement.textContent = '📥 Download';
            buttonElement.disabled = false;
        }
    }
}

/**
 * Helper: Format date for export (DD/MM/YYYY)
 */
function formatDateForExport(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Helper: Format date time for export (DD/MM/YYYY HH:MM:SS)
 */
function formatDateTimeForExport(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Helper: Format date for filename (YYYYMMDD_HHMMSS)
 */
function formatDateForFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// ============================================================================

// Terjemahan helper
function translateStatus(status) {
    const map = {
        open: 'Terbuka',
        in_progress: 'Sedang Ditangani',
        pending: 'Tertunda',
        resolved: 'Selesai',
        closed: 'Ditutup'
    };
    return map[status] || status;
}

function translatePriority(priority) {
    const map = {
        low: 'Rendah',
        medium: 'Sedang',
        high: 'Tinggi',
        urgent: 'Mendesak'
    };
    return map[priority] || priority;
}

function translateRole(role) {
    const map = {
        admin: 'Admin',
        support: 'Support',
        client: 'Pengguna'
    };
    return map[role] || role.toUpperCase();
}

function translateAction(action) {
    const map = {
        // Dari database (action field ticketLog)
        created: 'Tiket Dibuat',
        status_changed: 'Status Diubah',
        assigned: 'Tiket Ditugaskan',
        unassigned: 'Penugasan Dibatalkan',
        priority_changed: 'Prioritas Diubah',
        commented: 'Komentar Ditambahkan',
        updated: 'Tiket Diperbarui',
        closed: 'Tiket Ditutup',
        resolved: 'Tiket Diselesaikan',
        reopened: 'Tiket Dibuka Kembali',
        // Dari JS sebelumnya
        ticket_created: 'Tiket Dibuat',
        ticket_updated: 'Tiket Diperbarui',
        ticket_closed: 'Tiket Ditutup',
        ticket_resolved: 'Tiket Diselesaikan',
        ticket_assigned: 'Tiket Ditugaskan',
        comment_added: 'Komentar Ditambahkan',
        user_created: 'Pengguna Dibuat',
        user_deleted: 'Pengguna Dihapus',
        user_login: 'Pengguna Masuk',
        user_logout: 'Pengguna Keluar',
        password_changed: 'Password Diubah'
    };
    return map[action] || action.replace(/_/g, ' ');
}

function translateDescription(description) {
    if (!description) return 'Tidak ada keterangan';
    return description
        .replace(/Ticket created/gi, 'Tiket dibuat')
        .replace(/Ticket updated/gi, 'Tiket diperbarui')
        .replace(/Status changed from (.+) to (.+)/gi, (_, from, to) =>
            `Status diubah dari <strong>${translateStatus(from.trim())}</strong> menjadi <strong>${translateStatus(to.trim())}</strong>`)
        .replace(/Priority changed from (.+) to (.+)/gi, (_, from, to) =>
            `Prioritas diubah dari <strong>${translatePriority(from.trim())}</strong> menjadi <strong>${translatePriority(to.trim())}</strong>`)
        .replace(/Assigned to (.+)/gi, (_, name) => `Ditugaskan kepada <strong>${name}</strong>`)
        .replace(/Unassigned from (.+)/gi, (_, name) => `Penugasan ke <strong>${name}</strong> dibatalkan`)
        .replace(/Comment added/gi, 'Komentar ditambahkan')
        .replace(/Ticket closed/gi, 'Tiket ditutup')
        .replace(/Ticket resolved/gi, 'Tiket diselesaikan')
        .replace(/Ticket reopened/gi, 'Tiket dibuka kembali')
        .replace(/No description/gi, 'Tidak ada keterangan')
        .replace(/User created/gi, 'Pengguna dibuat')
        .replace(/User deleted/gi, 'Pengguna dihapus')
        .replace(/Password changed/gi, 'Password diubah');
}

// Tutup modal saat klik di luar
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};
