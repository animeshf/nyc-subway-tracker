/**
 * NYC Subway Tracker - Frontend
 * Handles station search, arrival display, and filtering
 */

// Use relative URLs since we're served from the same Flask app
const API_BASE_URL = '';

// Global state
let allStations = [];          // All available stations for search
let currentArrivalsData = null; // Current station's arrival data
let selectedRoute = null;       // Currently selected train filter (or null for all)
let currentStationId = null;    // Currently displayed station ID

// Load stations on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStations();
    setupSearch();
});

/**
 * Load all available subway stations from the API
 * Called once on page load
 */
async function loadStations() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stations`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allStations = await response.json();
    } catch (error) {
        showError('Error loading stations. Please refresh the page.');
    }
}

/**
 * Set up search functionality with autocomplete
 * Includes keyboard navigation (arrow keys) and Enter key support
 */
function setupSearch() {
    const searchInput = document.getElementById('station-search');
    const suggestionsDiv = document.getElementById('suggestions');
    
    // Show autocomplete suggestions as user types
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        // Filter stations
        const matches = allStations.filter(station =>
            station.name.toLowerCase().includes(searchTerm)
        ).slice(0, 8); // Show max 8 suggestions
        
        if (matches.length === 0) {
            suggestionsDiv.innerHTML = '<div class="suggestion-item no-match">No stations found</div>';
            suggestionsDiv.style.display = 'block';
            return;
        }
        
        suggestionsDiv.innerHTML = matches.map(station => 
            `<div class="suggestion-item" data-id="${station.id}" data-name="${station.name}">
                ${station.name}
            </div>`
        ).join('');
        suggestionsDiv.style.display = 'block';
        
        // Add click handlers to suggestions
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.getAttribute('data-name');
                if (name) {
                    searchInput.value = name;
                    suggestionsDiv.innerHTML = '';
                    suggestionsDiv.style.display = 'none';
                    searchArrivals();
                }
            });
        });
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    // Allow Enter key in search to trigger arrivals
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            suggestionsDiv.style.display = 'none';
            searchArrivals();
        }
    });
    
    // Handle keyboard navigation (arrow keys)
    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsDiv.querySelectorAll('.suggestion-item:not(.no-match)');
        if (items.length === 0) return;
        
        const active = suggestionsDiv.querySelector('.suggestion-item.active');
        let currentIndex = active ? Array.from(items).indexOf(active) : -1;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % items.length;
            updateActiveSuggestion(items, currentIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
            updateActiveSuggestion(items, currentIndex);
        }
    });
}

function updateActiveSuggestion(items, index) {
    items.forEach(item => item.classList.remove('active'));
    if (items[index]) {
        items[index].classList.add('active');
        const name = items[index].getAttribute('data-name');
        document.getElementById('station-search').value = name;
    }
}

async function searchArrivals() {
    const searchValue = document.getElementById('station-search').value.trim();
    
    if (!searchValue) {
        showError('Please enter a station name');
        return;
    }
    
    let stationId = null;
    
    // Try exact name match first (case insensitive)
    let station = allStations.find(s => 
        s.name.toLowerCase() === searchValue.toLowerCase()
    );
    
    if (!station) {
        // Try exact ID match
        station = allStations.find(s => 
            s.id.toLowerCase() === searchValue.toLowerCase()
        );
    }
    
    if (!station) {
        // Try partial name match
        const matches = allStations.filter(s => 
            s.name.toLowerCase().includes(searchValue.toLowerCase())
        );
        
        if (matches.length === 1) {
            station = matches[0];
        } else if (matches.length > 1) {
            showError(`Multiple stations found. Please be more specific. Try: ${matches.slice(0, 3).map(s => s.name).join(', ')}`);
            return;
        } else {
            showError('Station not found. Please check the name and try again.');
            return;
        }
    }
    
    stationId = station.id;
    currentStationId = stationId; // Store for refresh
    
    // Hide previous results and errors
    document.getElementById('results').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/arrivals?station_id=${encodeURIComponent(stationId)}`);
        
        if (!response.ok) {
            const data = await response.json();
            document.getElementById('loading').style.display = 'none';
            showError(data.error || 'Error fetching arrivals');
            return;
        }
        
        const data = await response.json();
        
        document.getElementById('loading').style.display = 'none';
        displayResults(data);
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        showError(`Error: ${error.message}. Make sure the backend server is running.`);
    }
}

function displayResults(data) {
    // Store data globally for filtering
    currentArrivalsData = data;
    selectedRoute = null;
    
    const resultsDiv = document.getElementById('results');
    const stationInfo = document.getElementById('station-info');
    const arrivalsList = document.getElementById('arrivals-list');
    
    // Find station name from our station list
    const station = allStations.find(s => s.id === data.station_id);
    
    let stationHeader = '';
    if (station) {
        stationHeader = `
            <div class="station-header">
                <h2>${station.name}</h2>
                <button id="refresh-btn" class="refresh-btn" onclick="refreshArrivals()" title="Refresh arrivals">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                </button>
            </div>
            <div id="route-filters"></div>
        `;
    }
    
    stationInfo.innerHTML = stationHeader;
    stationInfo.style.display = 'block';
    
    if (!data.arrivals || data.arrivals.length === 0) {
        arrivalsList.innerHTML = '<div class="no-arrivals">No upcoming arrivals found. Please verify the station or try again later.</div>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    // Create route filter buttons
    const routes = [...new Set(data.arrivals.map(a => a.route))].sort();
    
    const filtersDiv = document.getElementById('route-filters');
    if (filtersDiv && routes.length > 0) {
        filtersDiv.innerHTML = `
            <div class="filter-label">Filter by train:</div>
            <div class="filter-buttons">
                <button class="filter-btn active" onclick="filterByRoute(null)">All</button>
                ${routes.map(route => 
                    `<button class="filter-btn filter-route-${route}" onclick="filterByRoute('${route}')">${route}</button>`
                ).join('')}
            </div>
        `;
    }
    
    // Display summary view (next arrival for each route/direction)
    displaySummaryView(data.arrivals);
    
    resultsDiv.style.display = 'block';
}

function displaySummaryView(arrivals) {
    const arrivalsList = document.getElementById('arrivals-list');
    
    arrivalsList.innerHTML = arrivals.map(arrival => {
        const minutesText = arrival.minutes_until_arrival <= 0 ? 'Arriving' : 
                           arrival.minutes_until_arrival === 1 ? '1 min' : 
                           `${arrival.minutes_until_arrival} mins`;
        
        return `
            <div class="arrival-card">
                <div class="route-badge route-${arrival.route}">
                    ${arrival.route}
                </div>
                <div class="arrival-info">
                    <div class="route-name">${arrival.route} Train</div>
                    <div class="direction">${arrival.direction}</div>
                </div>
                <div class="arrival-time">
                    <div class="time">${arrival.arrival_time}</div>
                    <div class="minutes">${minutesText}</div>
                </div>
            </div>
        `;
    }).join('');
}

function displayFilteredView(route) {
    const arrivalsList = document.getElementById('arrivals-list');
    
    // Filter all arrivals for this route
    const filteredArrivals = currentArrivalsData.all_arrivals.filter(a => a.route === route);
    
    if (filteredArrivals.length === 0) {
        arrivalsList.innerHTML = '<div class="no-arrivals">No arrivals found for this train in the next 30 minutes.</div>';
        return;
    }
    
    // Group by direction
    const byDirection = {};
    filteredArrivals.forEach(arrival => {
        if (!byDirection[arrival.direction]) {
            byDirection[arrival.direction] = [];
        }
        byDirection[arrival.direction].push(arrival);
    });
    
    // Display grouped by direction
    let html = '';
    Object.keys(byDirection).forEach(direction => {
        html += `
            <div class="direction-group">
                <h3 class="direction-header">
                    <span class="route-badge route-${route}">${route}</span>
                    ${direction}
                </h3>
                <div class="arrivals-timeline">
                    ${byDirection[direction].map(arrival => {
                        const minutesText = arrival.minutes_until_arrival <= 0 ? 'Arriving' : 
                                           arrival.minutes_until_arrival === 1 ? '1 min' : 
                                           `${arrival.minutes_until_arrival} mins`;
                        return `
                            <div class="timeline-item">
                                <div class="time">${arrival.arrival_time}</div>
                                <div class="minutes">${minutesText}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    arrivalsList.innerHTML = html;
}

function filterByRoute(route) {
    selectedRoute = route;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (route === null) {
        // Show summary view
        displaySummaryView(currentArrivalsData.arrivals);
    } else {
        // Show filtered view for specific route
        displayFilteredView(route);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

async function refreshArrivals() {
    if (!currentStationId) return;
    
    // Add spinning animation
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('spinning');
        refreshBtn.disabled = true;
    }
    
    // Hide error messages
    document.getElementById('error-message').style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/arrivals?station_id=${encodeURIComponent(currentStationId)}`);
        
        if (!response.ok) {
            const data = await response.json();
            showError(data.error || 'Error fetching arrivals');
            return;
        }
        
        const data = await response.json();
        
        // Update the display with new data
        currentArrivalsData = data;
        
        // Re-render based on current filter state
        if (selectedRoute === null) {
            displaySummaryView(data.arrivals);
        } else {
            displayFilteredView(selectedRoute);
        }
        
        // Update the filters in case routes changed
        const routes = [...new Set(data.arrivals.map(a => a.route))].sort();
        const filtersDiv = document.getElementById('route-filters');
        if (filtersDiv && routes.length > 0) {
            const currentFilter = selectedRoute;
            filtersDiv.innerHTML = `
                <div class="filter-label">Filter by train:</div>
                <div class="filter-buttons">
                    <button class="filter-btn ${currentFilter === null ? 'active' : ''}" onclick="filterByRoute(null)">All</button>
                    ${routes.map(route => 
                        `<button class="filter-btn filter-route-${route} ${currentFilter === route ? 'active' : ''}" onclick="filterByRoute('${route}')">${route}</button>`
                    ).join('')}
                </div>
            `;
        }
        
    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        // Remove spinning animation
        if (refreshBtn) {
            refreshBtn.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }
}
