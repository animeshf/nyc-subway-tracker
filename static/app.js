/**
 * NYC Subway Tracker - Frontend
 * Handles station search, arrival display, and filtering
 */

// Use relative URLs since we're served from the same Flask app
const API_BASE_URL = '';

const AUTO_REFRESH_INTERVAL_MS = 30000;

// Global state
let allStations = [];           // All available stations for search
let currentArrivalsData = null; // Current station's arrival data
let selectedRoute = null;       // Currently selected train filter (or null for all)
let currentStationId = null;    // Currently displayed station ID
let autoRefreshTimer = null;    // Auto-refresh interval handle

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
 * Includes keyboard navigation (arrow keys), Enter key, and Escape key support
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

    // Keyboard handling: Enter to search, Escape to close, arrows to navigate
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            suggestionsDiv.style.display = 'none';
            return;
        }

        if (e.key === 'Enter') {
            suggestionsDiv.style.display = 'none';
            searchArrivals();
            return;
        }

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

    let station = allStations.find(s =>
        s.name.toLowerCase() === searchValue.toLowerCase()
    );

    if (!station) {
        station = allStations.find(s =>
            s.id.toLowerCase() === searchValue.toLowerCase()
        );
    }

    if (!station) {
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

    currentStationId = station.id;

    document.getElementById('results').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('loading').style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/api/arrivals?station_id=${encodeURIComponent(currentStationId)}`);

        if (!response.ok) {
            const data = await response.json();
            document.getElementById('loading').style.display = 'none';
            showError(data.error || 'Error fetching arrivals');
            return;
        }

        const data = await response.json();
        document.getElementById('loading').style.display = 'none';
        displayResults(data);
        startAutoRefresh();
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        showError(`Error: ${error.message}. Make sure the backend server is running.`);
    }
}

function displayResults(data) {
    currentArrivalsData = data;
    selectedRoute = null;

    const resultsDiv = document.getElementById('results');
    const stationInfo = document.getElementById('station-info');

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
        document.getElementById('arrivals-list').innerHTML =
            '<div class="no-arrivals">No upcoming arrivals found. Please verify the station or try again later.</div>';
        resultsDiv.style.display = 'block';
        return;
    }

    const routes = [...new Set(data.arrivals.map(a => a.route))].sort();
    renderRouteFilters(routes, null);
    displaySummaryView(data.arrivals);

    resultsDiv.style.display = 'block';
}

/**
 * Renders the route filter button bar.
 * Extracted to avoid duplication between displayResults and refreshArrivals.
 */
function renderRouteFilters(routes, activeRoute) {
    const filtersDiv = document.getElementById('route-filters');
    if (!filtersDiv || routes.length === 0) return;

    filtersDiv.innerHTML = `
        <div class="filter-label">Filter by train:</div>
        <div class="filter-buttons">
            <button class="filter-btn ${activeRoute === null ? 'active' : ''}" onclick="filterByRoute(null, event)">All</button>
            ${routes.map(route =>
                `<button class="filter-btn filter-route-${route} ${activeRoute === route ? 'active' : ''}" onclick="filterByRoute('${route}', event)">${route}</button>`
            ).join('')}
        </div>
    `;
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

    const filteredArrivals = currentArrivalsData.all_arrivals.filter(a => a.route === route);

    if (filteredArrivals.length === 0) {
        arrivalsList.innerHTML = '<div class="no-arrivals">No arrivals found for this train in the next 30 minutes.</div>';
        return;
    }

    const byDirection = {};
    filteredArrivals.forEach(arrival => {
        if (!byDirection[arrival.direction]) {
            byDirection[arrival.direction] = [];
        }
        byDirection[arrival.direction].push(arrival);
    });

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

function filterByRoute(route, event) {
    selectedRoute = route;

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (route === null) {
        displaySummaryView(currentArrivalsData.arrivals);
    } else {
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

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.classList.add('spinning');
        refreshBtn.disabled = true;
    }

    document.getElementById('error-message').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/api/arrivals?station_id=${encodeURIComponent(currentStationId)}`);

        if (!response.ok) {
            const data = await response.json();
            showError(data.error || 'Error fetching arrivals');
            return;
        }

        const data = await response.json();
        currentArrivalsData = data;

        if (selectedRoute === null) {
            displaySummaryView(data.arrivals);
        } else {
            displayFilteredView(selectedRoute);
        }

        const routes = [...new Set(data.arrivals.map(a => a.route))].sort();
        renderRouteFilters(routes, selectedRoute);

        // Reset the auto-refresh timer so we don't refresh again immediately after a manual one
        startAutoRefresh();
    } catch (error) {
        showError(`Error: ${error.message}`);
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }
}

/**
 * Starts (or restarts) the 30-second auto-refresh timer.
 * Calling this resets the countdown, so a manual refresh won't be immediately
 * followed by an automatic one.
 */
function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(refreshArrivals, AUTO_REFRESH_INTERVAL_MS);
}
