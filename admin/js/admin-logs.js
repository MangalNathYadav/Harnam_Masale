// Admin logs — just tracking what’s happening (could be cleaner, but works)
document.addEventListener('DOMContentLoaded', () => {
    initializeLogs();
});

// Grab all the DOM bits we need for logs (kinda verbose)
const logsTableBody = document.getElementById('logs-table-body');
const logsLoader = document.getElementById('logs-loader');
const noLogs = document.getElementById('no-logs');
const logsCount = document.getElementById('logs-count');
const logTypeFilter = document.getElementById('log-type-filter');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

// Fire up the logs page (redirect if not logged in — quick check)
function initializeLogs() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            fetchLogs();
            setupEventListeners();
        } else {
            window.location.href = 'login.html';
        }
    });
}

// Button click stuff for filters (just basic event listeners)
function setupEventListeners() {
    document.getElementById('apply-filters-btn').addEventListener('click', fetchLogs);
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
}

// Actually fetch the logs (filters work, but not perfect)
function fetchLogs() {
    showLoader();
    
    const type = logTypeFilter.value;
    const fromDate = dateFrom.value ? new Date(dateFrom.value).toISOString().split('T')[0] : null;
    const toDate = dateTo.value ? new Date(dateTo.value).toISOString().split('T')[0] : null;

    const logsRef = database.ref('admin_logs');
    
    // Try to filter logs by date (could be smarter)
    let query = logsRef;
    if (fromDate) {
        query = query.orderByKey().startAt(fromDate);
    }
    if (toDate) {
        query = query.endAt(toDate);
    }

    query.once('value')
        .then((snapshot) => {
            const logs = [];
            snapshot.forEach((dateSnapshot) => {
                dateSnapshot.forEach((logSnapshot) => {
                    const log = logSnapshot.val();
                    if (type === 'all' || log.activityType === type) {
                        logs.push(log);
                    }
                });
            });
            displayLogs(logs.sort((a, b) => b.timestamp - a.timestamp));
        })
        .catch((error) => {
            console.error('Error fetching logs:', error);
            showNoLogs();
        });
}

// Dump logs into the table (just basic rendering, nothing fancy)
function displayLogs(logs) {
    logsTableBody.innerHTML = '';
    logsCount.textContent = logs.length;
    
    if (logs.length === 0) {
        showNoLogs();
        return;
    }
    
    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.adminUser || 'System'}</td>
            <td><span class="badge ${getBadgeClass(log.activityType)}">${log.activityType}</span></td>
            <td>${log.description}</td>
            <td>${log.ipAddress}</td>
        `;
        logsTableBody.appendChild(row);
    });
    
    hideLoader();
    noLogs.style.display = 'none';
}

// Loader and badge helpers (pretty basic, could be improved)
function showLoader() {
    logsLoader.style.display = 'flex';
    noLogs.style.display = 'none';
}

function hideLoader() {
    logsLoader.style.display = 'none';
}

function showNoLogs() {
    hideLoader();
    noLogs.style.display = 'flex';
    logsCount.textContent = '0';
}

function clearFilters() {
    logTypeFilter.value = 'all';
    dateFrom.value = '';
    dateTo.value = '';
    fetchLogs();
}

function getBadgeClass(type) {
    const classes = {
        'login': 'badge-primary',
        'product': 'badge-success',
        'order': 'badge-warning',
        'user': 'badge-info',
        'settings': 'badge-secondary'
    };
    return classes[type] || 'badge-default';
}

// Just run it (again, not super elegant, but gets the job done)
initializeLogs();