/**
 * Grievance Portal — Admin Dashboard Client Script
 */

let allGrievances = [];
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkInitialAuth();
    setupEventListeners();
});

function getStoredPin() {
    return sessionStorage.getItem('adminPin') || '';
}

function setStoredPin(pin) {
    sessionStorage.setItem('adminPin', pin);
}

function clearStoredPin() {
    sessionStorage.removeItem('adminPin');
}

// Check if user already entered PIN in this session
async function checkInitialAuth() {
    const pin = getStoredPin();
    if (pin) {
        verifyAndLoad(pin);
    } else {
        document.getElementById('loginGate').classList.remove('hidden');
        document.getElementById('adminContent').classList.add('hidden');
        document.getElementById('logoutBtn').classList.add('hidden');
    }
}

async function verifyAndLoad(pin) {
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            setStoredPin(pin);
            document.getElementById('loginGate').classList.add('hidden');
            document.getElementById('adminContent').classList.remove('hidden');
            document.getElementById('logoutBtn').classList.remove('hidden');
            loadGrievances();
        } else {
            clearStoredPin();
            document.getElementById('loginError').textContent = data.error || 'Invalid Admin PIN';
            document.getElementById('loginGate').classList.remove('hidden');
            document.getElementById('adminContent').classList.add('hidden');
        }
    } catch (e) {
        document.getElementById('loginError').textContent = 'Server connection error';
    }
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('adminPinInput').value.trim();
        verifyAndLoad(pin);
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearStoredPin();
        location.reload();
    });

    // Search and Filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);

    // Export CSV
    document.getElementById('exportBtn').addEventListener('click', () => {
        const pin = getStoredPin();
        if (!pin) {
            alert('Please log in first.');
            return;
        }
        window.location.href = `/api/admin/export?pin=${encodeURIComponent(pin)}`;
    });

    // Modal Close
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') closeModal();
    });

    // Save Status Update
    document.getElementById('saveStatusBtn').addEventListener('click', saveStatusUpdate);
}

// Fetch all grievances from server
async function loadGrievances() {
    const pin = getStoredPin();
    const tbody = document.getElementById('grievanceTableBody');

    try {
        const res = await fetch('/api/admin/grievances', {
            headers: { 'x-admin-pin': pin }
        });
        const data = await res.json();

        if (res.ok && data.success) {
            allGrievances = data.grievances || [];
            updateStatsRibbon(allGrievances);
            renderTable(allGrievances);
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Failed to load data. Session may have expired.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Error connecting to server.</td></tr>`;
    }
}

function updateStatsRibbon(list) {
    const total = list.length;
    const urgent = list.filter(g => g.priority === 'Critical' || g.priority === 'Urgent').length;
    const pending = list.filter(g => g.status === 'Submitted' || g.status === 'Under Review' || g.status === 'In Progress').length;
    const resolved = list.filter(g => g.status === 'Resolved').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('urgentCount').textContent = urgent;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('resolvedCount').textContent = resolved;
}

function renderTable(list) {
    const tbody = document.getElementById('grievanceTableBody');

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 30px;">No grievances found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(g => {
        const priorityClass = `priority-${(g.priority || 'moderate').toLowerCase()}`;
        const statusClass = `status-${(g.status || 'submitted').toLowerCase().replace(' ', '-')}`;
        const complainant = g.is_anonymous 
            ? `<span style="color: #b45309; font-weight: 600;">🔒 Anonymous</span>`
            : `<strong>${escapeHtml(g.student_name || 'Student')}</strong><br><small style="color: #64748b;">${escapeHtml(g.roll_number || '')}</small>`;

        const residence = g.residence_type === 'Day Scholar' 
            ? 'Day Scholar' 
            : `${escapeHtml(g.hostel_name || 'Hostel')} ${escapeHtml(g.room_number ? '('+g.room_number+')' : '')}`;

        const dateStr = g.timestamp 
            ? new Date(g.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '--';

        return `
            <tr>
                <td><span class="ticket-link" onclick="openDetailModal('${g.grievance_id}')">${escapeHtml(g.grievance_id)}</span></td>
                <td style="white-space: nowrap;">${dateStr}</td>
                <td><span class="priority-chip ${priorityClass}">${escapeHtml(g.priority || 'Moderate')}</span></td>
                <td>${complainant}</td>
                <td>
                    <span style="font-weight: 600;">${escapeHtml(g.department || 'General')}</span><br>
                    <small style="color: #64748b;">${residence}</small>
                </td>
                <td>
                    <small style="color: #64748b; text-transform: uppercase; font-weight: 600;">${escapeHtml(g.category || '')}</small><br>
                    <strong>${escapeHtml(g.subject || 'No Subject')}</strong>
                </td>
                <td><span class="status-badge-admin ${statusClass}">${escapeHtml(g.status || 'Submitted')}</span></td>
                <td>
                    <button type="button" class="secondary-btn" style="padding: 4px 10px; font-size: 12px;" onclick="openDetailModal('${g.grievance_id}')">
                        Manage
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function applyFilters() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    const category = document.getElementById('categoryFilter').value;

    const filtered = allGrievances.filter(g => {
        // Keyword match
        const matchesQ = !q || 
            (g.grievance_id && g.grievance_id.toLowerCase().includes(q)) ||
            (g.student_name && g.student_name.toLowerCase().includes(q)) ||
            (g.roll_number && g.roll_number.toLowerCase().includes(q)) ||
            (g.subject && g.subject.toLowerCase().includes(q)) ||
            (g.description && g.description.toLowerCase().includes(q)) ||
            (g.hostel_name && g.hostel_name.toLowerCase().includes(q));

        // Status match
        const matchesStatus = (status === 'ALL') || (g.status === status);

        // Priority match
        const matchesPriority = (priority === 'ALL') || (g.priority === priority);

        // Category match
        const matchesCategory = (category === 'ALL') || 
            (g.category && g.category.toLowerCase().includes(category.toLowerCase()));

        return matchesQ && matchesStatus && matchesPriority && matchesCategory;
    });

    renderTable(filtered);
}

function openDetailModal(ticketId) {
    const item = allGrievances.find(g => g.grievance_id === ticketId);
    if (!item) return;

    currentEditingId = ticketId;

    document.getElementById('modalTicketId').textContent = item.grievance_id;
    
    const pChip = document.getElementById('modalPriorityChip');
    pChip.textContent = item.priority || 'Moderate';
    pChip.className = `priority-chip priority-${(item.priority || 'moderate').toLowerCase()}`;

    document.getElementById('modalStudentName').textContent = item.is_anonymous ? 'Anonymous Student' : (item.student_name || 'N/A');
    document.getElementById('modalRollNumber').textContent = item.is_anonymous ? 'Confidential' : (item.roll_number || 'N/A');
    document.getElementById('modalContact').textContent = item.is_anonymous ? 'Protected' : `${item.email || 'No email'} | ${item.phone || 'No phone'}`;
    document.getElementById('modalDept').textContent = `${item.program || 'B.Tech'} - ${item.department || 'N/A'} (${item.year_semester || 'N/A'})`;
    document.getElementById('modalResidence').textContent = item.residence_type === 'Day Scholar' ? 'Day Scholar' : `${item.hostel_name || 'Hostel'} ${item.room_number ? '- Room ' + item.room_number : ''}`;
    
    const dateStr = item.timestamp 
        ? new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST'
        : '--';
    document.getElementById('modalTimestamp').textContent = dateStr;

    document.getElementById('modalSubject').textContent = `${item.category ? item.category + ' — ' : ''}${item.subject || ''}`;
    document.getElementById('modalDescription').textContent = item.description || 'No description provided.';

    document.getElementById('updateStatusSelect').value = item.status || 'Submitted';
    document.getElementById('updateRemarksText').value = item.admin_remarks || '';

    document.getElementById('detailModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    currentEditingId = null;
}

async function saveStatusUpdate() {
    if (!currentEditingId) return;

    const pin = getStoredPin();
    const newStatus = document.getElementById('updateStatusSelect').value;
    const newRemarks = document.getElementById('updateRemarksText').value.trim();

    const saveBtn = document.getElementById('saveStatusBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const res = await fetch(`/api/admin/grievances/${encodeURIComponent(currentEditingId)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-pin': pin
            },
            body: JSON.stringify({
                status: newStatus,
                adminRemarks: newRemarks
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            alert('Status and remarks saved! Students can now see this in the Track Status tab.');
            closeModal();
            loadGrievances(); // Refresh list
        } else {
            alert(data.error || 'Failed to update status.');
        }
    } catch (e) {
        alert('Error connecting to server.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Status & Notify Tracker';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
