// Global state
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
const API_BASE_URL = window.location.origin + '/api';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthStatus();
    document.getElementById('baseUrl').textContent = API_BASE_URL;
});

// Tab navigation
function showTab(tabName) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Auth functions
function updateAuthStatus() {
    const authStatus = document.getElementById('authStatus');
    
    if (authToken && currentUser) {
        authStatus.innerHTML = `
            <span class="status-indicator online"></span>
            <span>Logged in as <strong>${currentUser.full_name}</strong> (${currentUser.role})</span>
        `;
    } else {
        authStatus.innerHTML = `
            <span class="status-indicator offline"></span>
            <span>Not Authenticated</span>
        `;
    }
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.data) {
            authToken = data.data.token;
            currentUser = data.data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateAuthStatus();
            closeLoginModal();
            
            // Redirect berdasarkan role
            if (currentUser.role === 'admin' || currentUser.role === 'support') {
                window.location.href = '/dashboard.html';
            } else {
                alert('Login successful!');
                location.reload();
            }
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateAuthStatus();
}

// API Testing functions
async function testEndpoint(endpointName) {
    if (!authToken) {
        alert('Please login first!');
        showLoginModal();
        return;
    }
    
    let url = '';
    let method = 'GET';
    let body = null;
    
    switch (endpointName) {
        case 'profile':
            url = `${API_BASE_URL}/auth/profile`;
            break;
            
        case 'users':
            url = `${API_BASE_URL}/users?page=1&limit=10`;
            break;
            
        case 'userStats':
            url = `${API_BASE_URL}/users/stats`;
            break;
            
        case 'tickets':
            url = `${API_BASE_URL}/tickets?page=1&limit=10`;
            break;
            
        case 'myTickets':
            url = `${API_BASE_URL}/tickets/my-tickets?page=1&limit=10`;
            break;
            
        case 'ticketStats':
            url = `${API_BASE_URL}/tickets/stats`;
            break;
            
        case 'createTicket':
            url = `${API_BASE_URL}/tickets`;
            method = 'POST';
            body = JSON.stringify({
                title: 'Test Ticket - ' + new Date().toLocaleString(),
                description: 'This is a test ticket created from the API testing interface.',
                priority: 'medium',
                category: 'Testing'
            });
            break;
            
        case 'recentLogs':
            url = `${API_BASE_URL}/logs/recent?limit=20`;
            break;
            
        case 'allLogs':
            url = `${API_BASE_URL}/logs?page=1&limit=20`;
            break;
            
        case 'register':
            // Show a prompt for registration
            const username = prompt('Enter username (min 3 chars):');
            const password = prompt('Enter password (min 8 chars):');
            const fullName = prompt('Enter full name:');
            
            if (!username || !password || !fullName) {
                alert('Registration cancelled');
                return;
            }
            
            url = `${API_BASE_URL}/auth/register`;
            method = 'POST';
            body = JSON.stringify({
                username,
                password,
                full_name: fullName,
                role: 'client'
            });
            
            // Don't need auth token for register
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body
                });
                
                const data = await response.json();
                showResponse(response.status, data);
                return;
            } catch (error) {
                console.error('Request error:', error);
                showResponse(0, { error: true, message: error.message });
                return;
            }
            
        default:
            alert('Endpoint not configured yet');
            return;
    }
    
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = body;
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        showResponse(response.status, data);
    } catch (error) {
        console.error('Request error:', error);
        showResponse(0, { error: true, message: error.message });
    }
}

function showResponse(status, data) {
    const responseSection = document.getElementById('responseSection');
    const responseStatus = document.getElementById('responseStatus');
    const responseBody = document.getElementById('responseBody');
    
    // Show response section
    responseSection.style.display = 'block';
    
    // Set status
    if (status >= 200 && status < 300) {
        responseStatus.textContent = `✓ ${status} Success`;
        responseStatus.className = 'success';
    } else {
        responseStatus.textContent = `✗ ${status || 'Error'} Failed`;
        responseStatus.className = 'error';
    }
    
    // Set body
    responseBody.textContent = JSON.stringify(data, null, 2);
    
    // Scroll to response
    responseSection.scrollIntoView({ behavior: 'smooth' });
}

function closeResponse() {
    document.getElementById('responseSection').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeLoginModal();
    }
}
