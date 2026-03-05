/* ========================================
   EMERGENCY RESPONSE OPTIMIZER - SCRIPT
   Role-Based Dashboard System
   ======================================== */

// ========================================
// API CONFIGURATION
// ========================================

const API_BASE_URL = 'http://localhost:8080/api';
const WS_BASE_URL = 'ws://localhost:8080/ws';

let authToken = null;
let stompClient = null;
let currentUserId = null;

// ========================================
// GLOBAL VARIABLES
// ========================================

let map;
let userMarker;
let ambulanceMarkers = [];
let hospitalMarkers = [];
let trafficPoliceMarkers = [];
let routePolylines = [];
let directionsRenderers = []; // Store direction renderers
let directionsService; // Google Directions Service
let currentEmergency = null;
let movementInterval = null;
let currentUserRole = null;
let ambulanceDashboardMarker = null; // Ambulance marker for ambulance dashboard
let completedEmergencyResetScheduled = false; // Flag to prevent multiple reset timeouts

// NEW FEATURES
let notificationsPoll = null;
let currentLanguage = 'en';
let userPoints = 0;
let emergencyHistory = [];
let chatbotOpen = false;
let chatbotInitialized = false;

// Map enhancement features
let trafficLayer = null;
let is3DMode = false;
let weatherInfo = null;

// Simulated city center (Bangalore - MG Road)
const CITY_CENTER = { lat: 17.6868, lng: 83.2185 }; // Visakhapatnam (Vizag)

// Analytics data
let analytics = {
    totalEmergencies: 0,
    avgResponseTime: 0,
    greenCorridors: 0,
    responseTimes: []
};

// Multi-language translations
const translations = {
    en: {
        sosButton: "EMERGENCY SOS",
        citizenDashboard: "Citizen Dashboard",
        ambulanceDashboard: "Ambulance Dashboard",
        trafficDashboard: "Traffic Police Dashboard",
        hospitalDashboard: "Hospital Dashboard",
        adminDashboard: "Admin Dashboard",
        points: "Points",
        leaderboard: "Leaderboard",
        history: "History",
        notifications: "Notifications",
        emergencyActive: "Emergency Active",
        chatbot: "Healthcare Assistant",
        available: "Available",
        busy: "Busy"
    },
    hi: {
        sosButton: "आपातकालीन एसओएस",
        citizenDashboard: "नागरिक डैशबोर्ड",
        ambulanceDashboard: "एम्बुलेंस डैशबोर्ड",
        trafficDashboard: "ट्रैफिक पुलिस डैशबोर्ड",
        hospitalDashboard: "अस्पताल डैशबोर्ड",
        adminDashboard: "एडमिन डैशबोर्ड",
        points: "अंक",
        leaderboard: "लीडरबोर्ड",
        history: "इतिहास",
        notifications: "सूचनाएं",
        emergencyActive: "आपातकाल सक्रिय",
        chatbot: "स्वास्थ्य सहायक",
        available: "उपलब्ध",
        busy: "व्यस्त"
    },
    te: {
        sosButton: "అత్యవసర SOS",
        citizenDashboard: "పౌరుల డాష్‌బోర్డ్",
        ambulanceDashboard: "అంబులెన్స్ డాష్‌బోర్డ్",
        trafficDashboard: "ట్రాఫిక్ పోలీస్ డాష్‌బోర్డ్",
        hospitalDashboard: "ఆసుపత్రి డాష్‌బోర్డ్",
        adminDashboard: "అడ్మిన్ డాష్‌బోర్డ్",
        points: "పాయింట్లు",
        leaderboard: "లీడర్‌బోర్డ్",
        history: "చరిత్ర",
        notifications: "నోటిఫికేషన్‌లు",
        emergencyActive: "అత్యవసరత సక్రియంగా ఉంది",
        chatbot: "ఆరోగ్య సహాయకుడు",
        available: "అందుబాటులో",
        busy: "బిజీ"
    }
};

// ========================================
// DATA STRUCTURES (Now loaded from backend)
// ========================================

let ambulances = [];
let hospitals = [];
let trafficPolice = [];

// ========================================
// API HELPER FUNCTIONS
// ========================================

async function apiCall(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            // Try to parse error details from response body
            let errorData;
            try {
                errorData = await response.json();
                console.error('❌ Backend Error Response:', errorData);
            } catch (parseError) {
                console.error('❌ Could not parse error response');
                throw new Error(`API Error: ${response.status}`);
            }
            
            if (errorData.error) {
                console.error('   Error Code:', errorData.error);
                console.error('   Error Message:', errorData.message);
                const error = new Error(errorData.message || `API Error: ${response.status}`);
                error.errorCode = errorData.error;
                error.errorMessage = errorData.message;
                error.errorData = errorData;
                throw error;
            }
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Call failed:', endpoint, error);
        throw error;
    }
}

async function loadAmbulances() {
    try {
        const data = await apiCall('/ambulance/all');
        ambulances = data.map(amb => ({
            id: amb.id,
            name: amb.vehicleNumber,
            lat: amb.currentLatitude,
            lng: amb.currentLongitude,
            status: amb.status.toLowerCase(),
            equipment: amb.equipment ? JSON.parse(amb.equipment) : []
        }));
        console.log('🚑 Loaded ambulances from backend:', ambulances.length, 'ambulances');
        ambulances.forEach(amb => console.log(`  - ${amb.name}: Status=${amb.status}, Location=(${amb.lat}, ${amb.lng})`));
        const availableCount = ambulances.filter(a => a.status === 'available').length;
        console.log(`  ✅ ${availableCount} ambulances are AVAILABLE for assignment`);
        if (availableCount === 0) {
            console.warn('  ⚠️ WARNING: No ambulances with "available" status! Emergency allocation will fail.');
        }
    } catch (error) {
        console.error('❌ Failed to load ambulances:', error);
    }
}

async function loadHospitals() {
    try {
        const data = await apiCall('/hospital/all');
        hospitals = data.map(hosp => ({
            id: hosp.id,
            name: hosp.name,
            lat: hosp.latitude,
            lng: hosp.longitude,
            availableBeds: hosp.availableBeds,
            specialization: hosp.specializations ? JSON.parse(hosp.specializations).join(', ') : 'General'
        }));
        console.log('🏥 Loaded hospitals from backend:', hospitals.length, 'hospitals');
        hospitals.forEach(h => console.log(`  - ${h.name}: (${h.lat}, ${h.lng}) - ${h.availableBeds} beds`));
    } catch (error) {
        console.error('❌ Failed to load hospitals:', error);
    }
}

async function loadTrafficPolice() {
    try {
        const data = await apiCall('/traffic/all');
        trafficPolice = data.map(tp => ({
            id: tp.id,
            officerName: tp.badgeNumber,
            lat: tp.currentLatitude,
            lng: tp.currentLongitude,
            status: tp.status.toLowerCase()
        }));
        console.log('👮 Loaded traffic police from backend:', trafficPolice.length, 'officers');
        trafficPolice.forEach(tp => console.log(`  - ${tp.officerName}: (${tp.lat}, ${tp.lng})`))
    } catch (error) {
        console.error('❌ Failed to load traffic police:', error);
    }
}

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================

async function loadNotifications() {
    if (!currentUserId) return;
    try {
        const notifications = await apiCall(`/notifications/user/${currentUserId}/unread`);
        displayNotifications(notifications);
        updateNotificationBadge(notifications.length);
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

function displayNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<div class="no-notifications">No new notifications</div>';
        return;
    }
    
    notificationsList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.isRead ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                ${notif.type === 'emergency' ? '🚨' : notif.type === 'success' ? '✅' : 'ℹ️'}
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatNotificationTime(notif.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

function formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-header">${title}</div>
        <div class="toast-body">${message}</div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

async function markNotificationAsRead(notificationId) {
    try {
        await apiCall(`/notifications/${notificationId}/read`, { method: 'PATCH' });
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    if (!currentUserId) {
        console.warn('No user ID set');
        return;
    }
    
    try {
        await apiCall(`/notifications/user/${currentUserId}/read-all`, { method: 'PATCH' });
        console.log('✅ All notifications marked as read');
        
        // Reload notifications to update UI
        await loadNotifications();
        
        // Update badge to 0
        updateNotificationBadge(0);
        
        showNotification('All notifications marked as read', false);
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        showNotification('Failed to mark notifications as read', true);
    }
}

function startNotificationPolling() {
    // DISABLED: Automatic notification polling was irritating users
    // if (notificationsPoll) clearInterval(notificationsPoll);
    // notificationsPoll = setInterval(loadNotifications, 10000); // Poll every 10 seconds
}

// ========================================
// POINTS AND LEADERBOARD FUNCTIONS
// ========================================

async function loadUserPoints() {
    if (!currentUserId) return;
    try {
        const data = await apiCall(`/points/user/${currentUserId}`);
        userPoints = data.points || 0;
        updatePointsDisplay();
    } catch (error) {
        console.error('Failed to load user points:', error);
    }
}

function updatePointsDisplay() {
    const pointsEl = document.getElementById('userPoints');
    if (pointsEl) {
        pointsEl.textContent = `${userPoints} pts`;
    }
}

async function loadLeaderboard(region = null) {
    try {
        const endpoint = region 
            ? `/points/leaderboard/${currentUserRole}?region=${region}`
            : `/points/leaderboard/${currentUserRole}`;
        const leaderboard = await apiCall(endpoint);
        renderLeaderboard(leaderboard);
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
    }
}

function renderLeaderboard(users) {
    const leaderboardEl = document.getElementById('leaderboardList');
    if (!leaderboardEl) return;
    
    leaderboardEl.innerHTML = users.map((user, index) => `
        <div class="leaderboard-item ${user.id === currentUserId ? 'current-user' : ''}">
            <span class="rank">#${index + 1}</span>
            <span class="name">${user.fullName || user.username}</span>
            <span class="points">${user.points || 0} pts</span>
        </div>
    `).join('');
}

// ========================================
// MULTI-LANGUAGE FUNCTIONS
// ========================================

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('eroLanguage', lang);
    updateUILanguage();
}

function updateUILanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
}

function initLanguage() {
    const savedLang = localStorage.getItem('eroLanguage');
    if (savedLang) {
        currentLanguage = savedLang;
        updateUILanguage();
    }
}

// ========================================
// CHATBOT FUNCTIONS
// ========================================

function initChatbot() {
    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const closeChatbot = document.getElementById('closeChatbot');
    const sendChatMsg = document.getElementById('sendChatMsg');
    const chatInput = document.getElementById('chatInput');
    
    if (!chatbotBtn) return;
    
    chatbotBtn.addEventListener('click', () => {
        chatbotContainer.classList.toggle('hidden');
        chatbotOpen = !chatbotOpen;
    });
    
    if (closeChatbot) {
        closeChatbot.addEventListener('click', () => {
            chatbotContainer.classList.add('hidden');
            chatbotOpen = false;
        });
    }
    
    if (sendChatMsg && chatInput) {
        sendChatMsg.addEventListener('click', () => sendChatMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (!message) return;
    
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Simulate chatbot response
    setTimeout(() => {
        const response = getChatbotResponse(message);
        addChatMessage(response, 'bot');
    }, 1000);
}

function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message chat-${sender}`;
    msgEl.textContent = message;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getChatbotResponse(message) {
    const msg = message.toLowerCase();
    
    // Healthcare responses (multilingual)
    if (msg.includes('first aid') || msg.includes('प्राथमिक') || msg.includes('మొదటి')) {
        return translations[currentLanguage] === 'hi' 
            ? "प्राथमिक चिकित्सा: घायल व्यक्ति को शांत रखें, रक्तस्राव को रोकें, घाव को साफ करें।"
            : translations[currentLanguage] === 'te'
            ? "మొదటి చికిత్స: గాయపడిన వ్యక్తిని ప్రశాంతంగా ఉంచండి, రక్తస్రావాన్ని ఆపండి, గాయాన్ని శుభ్రం చేయండి."
            : "First Aid: Keep the injured person calm, stop bleeding, clean wounds with water.";
    }
    
    if (msg.includes('insurance') || msg.includes('बीमा') || msg.includes('బీమా')) {
        return translations[currentLanguage] === 'hi'
            ? "सरकारी स्वास्थ्य बीमा योजनाएं: आयुष्मान भारत, राज्य स्वास्थ्य योजनाएं उपलब्ध हैं।"
            : translations[currentLanguage] === 'te'
            ? "ప్రభుత్వ ఆరోగ్య బీమా పథకాలు: ఆయుష్మాన్ భారత్, రాష్ట్ర ఆరోగ్య పథకాలు అందుబాటులో ఉన్నాయి."
            : "Government health insurance schemes: Ayushman Bharat, State Health Schemes available.";
    }
    
    if (msg.includes('schemes') || msg.includes('योजना') || msg.includes('పథకాలు')) {
        return translations[currentLanguage] === 'hi' 
            ? "सरकारी योजनाएं: आयुष्मान भारत, PMJAY, राज्य स्वास्थ्य योजनाएं। अधिक जानकारी के लिए अपने नजदीकी अस्पताल से संपर्क करें।"
            : translations[currentLanguage] === 'te'
            ? "ప్రభుత్వ పథకాలు: ఆయుష్మాన్ భారత్, PMJAY, రాష్ట్ర ఆరోగ్య పథకాలు. మరింత సమాచారం కోసం మీ సమీప ఆసుపత్రిని సంప్రదించండి."
            : "Government schemes: Ayushman Bharat, PMJAY, State Health Schemes. Contact nearest hospital for details.";
    }
    
    if (msg.includes('heart attack') || msg.includes('दिल का') || msg.includes('గుండె')) {
        return "⚠️ Heart attack: Call ambulance immediately! Make patient sit, give aspirin if available, keep calm.";
    }
    
    return "I can help with first aid, government health schemes, insurance information, and basic medical guidance. How can I assist you?";
}

// ========================================
// MAP ENHANCEMENT FUNCTIONS
// ========================================

function addMapControls() {
    // Create control container
    const controlDiv = document.createElement('div');
    controlDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; background: rgba(22, 22, 40, 0.95); padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index: 100;';

    // Traffic toggle button
    const trafficBtn = document.createElement('button');
    trafficBtn.innerHTML = '🚦 Traffic: OFF';
    trafficBtn.style.cssText = 'display: block; width: 120px; padding: 8px; margin-bottom: 5px; background: rgba(52, 152, 219, 0.2); border: 1px solid rgba(52, 152, 219, 0.4); border-radius: 6px; color: #3498db; font-size: 12px; cursor: pointer; transition: all 0.3s ease;';
    trafficBtn.onclick = toggleTraffic;

    // 3D toggle button
    const viewBtn = document.createElement('button');
    viewBtn.innerHTML = '🏙️ 3D: OFF';
    viewBtn.style.cssText = 'display: block; width: 120px; padding: 8px; margin-bottom: 5px; background: rgba(155, 89, 182, 0.2); border: 1px solid rgba(155, 89, 182, 0.4); border-radius: 6px; color: #9b59b6; font-size: 12px; cursor: pointer; transition: all 0.3s ease;';
    viewBtn.onclick = toggle3DView;

    // Weather info display
    const weatherDiv = document.createElement('div');
    weatherDiv.id = 'mapWeatherInfo';
    weatherDiv.style.cssText = 'padding: 8px; margin-top: 5px; background: rgba(46, 204, 113, 0.2); border: 1px solid rgba(46, 204, 113, 0.4); border-radius: 6px; color: #2ecc71; font-size: 11px; min-width: 120px;';
    weatherDiv.innerHTML = '🌤️ Loading...';

    controlDiv.appendChild(trafficBtn);
    controlDiv.appendChild(viewBtn);
    controlDiv.appendChild(weatherDiv);

    // Add to map container
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.style.position = 'relative';
        mapElement.appendChild(controlDiv);
    }
}

function toggleTraffic() {
    const btn = event.target;
    if (trafficLayer.getMap()) {
        trafficLayer.setMap(null);
        btn.innerHTML = '🚦 Traffic: OFF';
        btn.style.background = 'rgba(52, 152, 219, 0.2)';
    } else {
        trafficLayer.setMap(map);
        btn.innerHTML = '🚦 Traffic: ON';
        btn.style.background = 'rgba(46, 204, 113, 0.3)';
        btn.style.borderColor = 'rgba(46, 204, 113, 0.5)';
        btn.style.color = '#2ecc71';
    }
}

function toggle3DView() {
    const btn = event.target;
    is3DMode = !is3DMode;
    
    if (is3DMode) {
        map.setTilt(45);
        map.setMapTypeId('satellite');
        btn.innerHTML = '🏙️ 3D: ON';
        btn.style.background = 'rgba(46, 204, 113, 0.3)';
        btn.style.borderColor = 'rgba(46, 204, 113, 0.5)';
        btn.style.color = '#2ecc71';
        showToast('3D view enabled - Use Ctrl+Drag to rotate', 'info');
    } else {
        map.setTilt(0);
        map.setMapTypeId('roadmap');
        btn.innerHTML = '🏙️ 3D: OFF';
        btn.style.background = 'rgba(155, 89, 182, 0.2)';
        btn.style.borderColor = 'rgba(155, 89, 182, 0.4)';
        btn.style.color = '#9b59b6';
    }
}

function loadWeatherInfo() {
    // Simulated weather data (in production, use OpenWeatherMap API)
    const weatherData = {
        temp: Math.floor(Math.random() * 10) + 25, // 25-35°C
        condition: ['Clear', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 20) + 60 // 60-80%
    };

    const weatherDiv = document.getElementById('mapWeatherInfo');
    if (weatherDiv) {
        const icon = weatherData.condition === 'Clear' ? '☀️' : weatherData.condition === 'Cloudy' ? '☁️' : '🌧️';
        weatherDiv.innerHTML = `${icon} ${weatherData.temp}°C<br><small>${weatherData.condition} • ${weatherData.humidity}% humidity</small>`;
    }

    // Refresh weather every 10 minutes
    setTimeout(loadWeatherInfo, 600000);
}

// ========================================
// UI TOGGLE FUNCTIONS
// ========================================

async function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (!panel) return;
    
    const isHidden = panel.classList.contains('hidden');
    
    if (isHidden) {
        // Opening panel - load notifications
        panel.classList.remove('hidden');
        await loadNotifications();
    } else {
        // Closing panel
        panel.classList.add('hidden');
    }
}

function toggleChatbot() {
    const container = document.getElementById('chatbotContainer');
    if (container) {
        container.classList.toggle('hidden');
    }
}

// ========================================
// HISTORY FUNCTIONS
// ========================================

async function loadEmergencyHistory() {
    if (!currentUserId) {
        console.warn('No user ID set, cannot load history');
        return;
    }
    try {
        let endpoint;
        if (currentUserRole === 'citizen') {
            endpoint = `/history/citizen/${currentUserId}`;
            console.log('📜 Loading citizen history from:', endpoint);
            console.log('   Current User ID:', currentUserId);
        } else if (currentUserRole === 'ambulance') {
            // Get ambulance ID from current user
            const ambulance = await apiCall(`/ambulance/operator/${currentUserId}`);
            endpoint = `/history/ambulance/${ambulance.id}`;
            console.log('📜 Loading ambulance history from:', endpoint);
        } else if (currentUserRole === 'hospital') {
            // Get hospital ID from current user
            const hospital = await apiCall(`/hospital/admin/${currentUserId}`);
            endpoint = `/history/hospital/${hospital.id}`;
            console.log('📜 Loading hospital history from:', endpoint);
        } else if (currentUserRole === 'control') {
            endpoint = `/history/all`;
            console.log('📜 Loading all history from:', endpoint);
        }
        
        if (endpoint) {
            emergencyHistory = await apiCall(endpoint);
            console.log(`✅ Loaded ${emergencyHistory.length} history records`);
            if (emergencyHistory.length > 0) {
                console.log('   Latest emergency:', emergencyHistory[0]);
            }
            renderHistory();
        }
    } catch (error) {
        console.error('❌ Failed to load history:', error);
        emergencyHistory = [];
        renderHistory();
    }
}

function renderHistory() {
    // Find all history list elements
    const historyElements = [
        document.getElementById('emergencyHistoryList'),
        document.getElementById('ambulanceHistoryList'),
        document.getElementById('trafficHistoryList'),
        document.getElementById('hospitalHistoryList')
    ];
    
    historyElements.forEach(historyEl => {
        if (!historyEl) return;
        
        if (emergencyHistory.length === 0) {
            historyEl.innerHTML = '<p class="empty-state">No completed emergencies yet. Complete an emergency to see history here.</p>';
            return;
        }
        
        historyEl.innerHTML = emergencyHistory.map(emergency => `
            <div class="history-item">
                <div class="history-header">
                    <span class="emergency-code">${emergency.emergencyCode || 'ERO-' + emergency.id}</span>
                    <span class="history-date">${emergency.completedAt ? new Date(emergency.completedAt).toLocaleString() : 'Recently'}</span>
                </div>
                <div class="history-details">
                    <p><strong>Location:</strong> ${emergency.address || 'Emergency Location'}</p>
                    <p><strong>Response Time:</strong> ${emergency.responseTimeSeconds ? Math.floor(emergency.responseTimeSeconds / 60) + ' min' : 'N/A'}</p>
                    <p><strong>Points Earned:</strong> +${emergency.pointsGiven || 25}</p>
                </div>
            </div>
        `).join('');
    });
}

// ========================================
// ANALYTICS FUNCTIONS
// ========================================

async function loadAnalytics() {
    try {
        const data = await apiCall('/analytics/overview');
        analytics = data;
        renderAnalytics();
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

function renderAnalytics() {
    const statsEl = document.getElementById('analyticsStats');
    if (!statsEl) return;
    
    statsEl.innerHTML = `
        <div class="stat-card">
            <h3>Total Emergencies</h3>
            <p class="stat-value">${analytics.totalEmergencies || 0}</p>
        </div>
        <div class="stat-card">
            <h3>Avg Response Time</h3>
            <p class="stat-value">${analytics.avgResponseTimeSeconds ? Math.floor(analytics.avgResponseTimeSeconds / 60) + ' min' : 'N/A'}</p>
        </div>
        <div class="stat-card">
            <h3>Completed</h3>
            <p class="stat-value">${analytics.completedEmergencies || 0}</p>
        </div>
    `;
    
    // Render heatmap if available
    if (analytics.heatmapData && map) {
        renderHeatmap(analytics.heatmapData);
    }
}

function renderHeatmap(heatmapData) {
    // Display markers for emergency locations
    heatmapData.forEach(point => {
        new google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: point.severity === 'CRITICAL' ? '#ff0000' : '#ff9800',
                fillOpacity: 0.6,
                strokeWeight: 0
            }
        });
    });
}

// ========================================
// INITIALIZATION
// ========================================

async function initializeDashboard() {
    // Check for direct citizen access (no login required)
    const urlParams = new URLSearchParams(window.location.search);
    const isCitizenDirectAccess = urlParams.get('citizen') === 'true';
    
    if (isCitizenDirectAccess) {
        // Allow citizen to access without login
        currentUserRole = 'citizen';
        currentUserId = 'guest';  // Set consistent guest ID for history tracking
        
        // Update navigation for anonymous citizen
        document.getElementById('userName').textContent = 'Citizen (Guest)';
        document.getElementById('userRole').textContent = getRoleBadge('citizen');
        
        // Setup logout (redirect to home)
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        // Load data from backend
        await loadBackendData();
        
        // Initialize map
        initMap();
        
        // Render citizen dashboard
        renderDashboard('citizen');
        return;
    }
    
    // Check authentication for other roles
    const userData = localStorage.getItem('eroUser');
    
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(userData);
    currentUserRole = user.role;
    authToken = user.token;
    currentUserId = user.userId;
    
    // Update navigation
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userRole').textContent = getRoleBadge(user.role);
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Load data from backend
    await loadBackendData();
    
    // Initialize map
    initMap();
    
    // Render appropriate dashboard
    renderDashboard(user.role);
    
    // Setup WebSocket
    setupWebSocket();
    
    // Initialize new features
    initLanguage();
    initChatbot();
    await loadUserPoints();
    await loadNotifications();
    await loadEmergencyHistory();
    startNotificationPolling();
    
    // Load analytics for admin
    if (currentUserRole === 'control') {
        await loadAnalytics();
    }
}

// Expose initDashboard globally for Google Maps API callback
// Create a non-async wrapper for Google Maps callback compatibility
window.initDashboard = function() {
    initializeDashboard().catch(error => {
        console.error('Failed to initialize dashboard:', error);
    });
};

async function loadBackendData() {
    showNotification('Loading data from server...', false);
    try {
        await Promise.all([
            loadAmbulances(),
            loadHospitals(),
            loadTrafficPolice()
        ]);
        showNotification('Data loaded successfully!', false);
    } catch (error) {
        console.error('Failed to load backend data:', error);
        showNotification('Warning: Some data failed to load', true);
    }
}

function getRoleBadge(role) {
    const badges = {
        citizen: '👤 Citizen',
        ambulance: '🚑 Ambulance',
        traffic: '👮 Traffic Police',
        hospital: '🏥 Hospital',
        control: '🎛️ Control Room'
    };
    return badges[role] || role;
}

function logout() {
    localStorage.removeItem('eroUser');
    authToken = null;
    currentUserId = null;
    if (stompClient && stompClient.connected) {
        stompClient.disconnect();
    }
    window.location.href = 'index.html';
}

// ========================================
// WEBSOCKET SETUP
// ========================================

function setupWebSocket() {
    // WebSocket requires SockJS and STOMP libraries
    // For now, we'll use polling as fallback
    // In production, include: <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
    //                        <script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7/bundles/stomp.umd.min.js"></script>
    
    console.log('WebSocket setup: Libraries not loaded, using polling mode');
    
    // Poll for updates every 5 seconds
    setInterval(async () => {
        if (currentUserRole === 'control') {
            try {
                const emergencies = await apiCall('/emergency/active');
                // Update control dashboard with active emergencies
                console.log('Active emergencies:', emergencies.length);
            } catch (error) {
                console.error('Failed to poll emergencies:', error);
            }
        }
    }, 5000);
}

// ========================================
// MAP INITIALIZATION
// ========================================

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: CITY_CENTER,
        zoom: 14,
        styles: getDarkMapStyles(),
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        tilt: 0,
        heading: 0
    });

    // Initialize Directions Service
    directionsService = new google.maps.DirectionsService();

    // Initialize traffic layer (not shown by default)
    trafficLayer = new google.maps.TrafficLayer();

    // Add map controls
    addMapControls();

    // Initialize markers
    initializeAmbulanceMarkers();
    initializeHospitalMarkers();
    initializeTrafficPoliceMarkers();

    // Load weather info
    loadWeatherInfo();
}

function getDarkMapStyles() {
    return [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }]
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }]
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }]
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }]
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }]
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }]
        }
    ];
}

// ========================================
// MARKER INITIALIZATION
// ========================================

function initializeAmbulanceMarkers() {
    ambulances.forEach(ambulance => {
        const marker = new google.maps.Marker({
            position: { lat: ambulance.lat, lng: ambulance.lng },
            map: map,
            title: ambulance.name,
            icon: createAmbulanceIcon(ambulance.status)
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="color: #000;">
                    <h3>${ambulance.name}</h3>
                    <p><strong>Status:</strong> ${ambulance.status}</p>
                    <p><strong>Equipment:</strong> ${ambulance.equipment.join(', ')}</p>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        ambulanceMarkers.push(marker);
    });
}

function initializeHospitalMarkers() {
    console.log('🏥 Initializing hospital markers. Total hospitals:', hospitals.length);
    hospitals.forEach(hospital => {
        console.log(`Creating marker for ${hospital.name} at (${hospital.lat}, ${hospital.lng})`);
        const marker = new google.maps.Marker({
            position: { lat: hospital.lat, lng: hospital.lng },
            map: map,
            title: hospital.name,
            icon: createHospitalIcon(),
            zIndex: 1000
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="color: #000;">
                    <h3>${hospital.name}</h3>
                    <p><strong>Available Beds:</strong> ${hospital.availableBeds}</p>
                    <p><strong>Specialization:</strong> ${hospital.specialization}</p>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        hospitalMarkers.push(marker);
    });
}

function initializeTrafficPoliceMarkers() {
    trafficPolice.forEach(officer => {
        const marker = new google.maps.Marker({
            position: { lat: officer.lat, lng: officer.lng },
            map: map,
            title: officer.officerName,
            icon: createTrafficIcon(officer.status)
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="color: #000;">
                    <h3>${officer.officerName}</h3>
                    <p><strong>Status:</strong> ${officer.status}</p>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        trafficPoliceMarkers.push(marker);
    });
}

// Marker icon creators
function createAmbulanceIcon(status, rotation = 0) {
    const color = status === 'available' ? '#3498db' : '#2ecc71';
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <g transform="translate(20,20) rotate(${rotation}) translate(-20,-20)">
                    <path d="M 20 5 L 28 32 L 20 28 L 12 32 Z" fill="${color}" stroke="white" stroke-width="2"/>
                    <circle cx="20" cy="18" r="5" fill="white"/>
                    <text x="20" y="22" font-size="8" text-anchor="middle" fill="${color === '#3498db' ? '#3498db' : '#2ecc71'}">🚑</text>
                </g>
            </svg>`
        ),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
        rotation: rotation
    };
}

function createHospitalIcon() {
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 45 45">
                <circle cx="22.5" cy="22.5" r="20" fill="#e74c3c" stroke="white" stroke-width="2"/>
                <text x="22.5" y="30" font-size="22" text-anchor="middle" fill="white">🏥</text>
            </svg>`
        ),
        scaledSize: new google.maps.Size(45, 45),
        anchor: new google.maps.Point(22.5, 22.5)
    };
}

function createTrafficIcon(status) {
    let color = '#3498db'; // default blue for patrolling
    let size = 35;
    
    if (status === 'active') {
        color = '#f39c12'; // orange for active
    } else if (status === 'alerted') {
        color = '#e74c3c'; // red for alerted
        size = 45; // larger when alerted
    }
    
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
                <text x="${size/2}" y="${size/2 + 7}" font-size="18" text-anchor="middle" fill="white">👮</text>
            </svg>`
        ),
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size/2, size/2)
    };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Calculate bearing (heading) between two points
function calculateBearing(lat1, lng1, lat2, lng2) {
    const toRadians = (deg) => deg * (Math.PI / 180);
    const toDegrees = (rad) => rad * (180 / Math.PI);
    
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δλ = toRadians(lng2 - lng1);
    
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const bearing = (toDegrees(θ) + 360) % 360;
    
    return bearing;
}

// ========================================
// ROUTE DRAWING WITH DIRECTIONS API
// ========================================

function drawRouteOnRoads(origin, destination, color, callback) {
    if (!directionsService) {
        console.error('DirectionsService not initialized');
        return;
    }

    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
            departureTime: new Date(),
            trafficModel: 'bestguess'
        },
        provideRouteAlternatives: false
    };

    directionsService.route(request, function(result, status) {
        if (status === 'OK') {
            // Create a DirectionsRenderer to display the route
            const directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                directions: result,
                suppressMarkers: true, // Don't show default A/B markers
                polylineOptions: {
                    strokeColor: color,
                    strokeOpacity: 0.8,
                    strokeWeight: 5
                }
            });
            
            // Store renderer for cleanup later
            directionsRenderers.push(directionsRenderer);
            
            // Extract path coordinates from the route
            const route = result.routes[0];
            const path = [];
            
            route.legs.forEach(leg => {
                leg.steps.forEach(step => {
                    const stepPath = step.path;
                    stepPath.forEach(point => {
                        path.push({
                            lat: point.lat(),
                            lng: point.lng()
                        });
                    });
                });
            });
            
            // Call callback with the path if provided
            if (callback) {
                callback(path);
            }
            
        } else {
            console.warn('Directions request failed due to ' + status);
            // Fallback to straight line if directions fail
            drawStraightLine(origin, destination, color);
            if (callback) {
                callback([origin, destination]); // Straight line path
            }
        }
    });
}

// Fallback function for straight line (if Directions API fails)
function drawStraightLine(origin, destination, color) {
    const polyline = new google.maps.Polyline({
        path: [origin, destination],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map
    });
    routePolylines.push(polyline);
}

// ========================================
// DASHBOARD RENDERING
// ========================================

function renderDashboard(role) {
    // Hide all dashboards
    document.querySelectorAll('.role-dashboard').forEach(dash => {
        dash.classList.add('hidden');
    });
    
    // Hide SOS button by default (will be shown for citizen role)
    const sosButton = document.getElementById('sosButton');
    if (sosButton) {
        sosButton.classList.add('hidden');
    }
    
    // Show appropriate dashboard
    const dashboardId = role + 'Dashboard';
    const dashboard = document.getElementById(dashboardId);
    
    if (dashboard) {
        dashboard.classList.remove('hidden');
        setupRoleSpecificHandlers(role);
    }
}

function setupRoleSpecificHandlers(role) {
    switch(role) {
        case 'citizen':
            setupCitizenDashboard();
            break;
        case 'ambulance':
            setupAmbulanceDashboard();
            break;
        case 'traffic':
            setupTrafficDashboard();
            break;
        case 'hospital':
            setupHospitalDashboard();
            break;
        case 'control':
            setupControlDashboard();
            break;
    }
}

// ========================================
// CITIZEN DASHBOARD
// ========================================

function setupCitizenDashboard() {
    // Show SOS button for citizens only
    const sosButton = document.getElementById('sosButton');
    if (sosButton) {
        sosButton.classList.remove('hidden');
        sosButton.addEventListener('click', triggerSOS);
    }
    
    // Initialize chatbot if not already done
    if (!chatbotInitialized) {
        initChatbot();
        chatbotInitialized = true;
        
        // Show chatbot button for citizens
        const chatbotBtn = document.getElementById('chatbotBtn');
        if (chatbotBtn) {
            chatbotBtn.classList.remove('hidden');
        }
    }
    
    // Load leaderboard and history for citizens
    loadLeaderboard();
    loadEmergencyHistory();
}

async function triggerSOS() {
    if (currentEmergency) {
        showNotification("Emergency already in progress!", true);
        return;
    }

    // Prompt for optional additional info
    const additionalInfo = prompt("Any additional emergency details? (Optional - press Cancel to skip):");

    // Simulate user location - random location within 10km of city center
    const userLocation = {
        lat: CITY_CENTER.lat + (Math.random() - 0.5) * 0.1,
        lng: CITY_CENTER.lng + (Math.random() - 0.5) * 0.1
    };

    try {
        showNotification("Creating emergency...", false);
        
        // Create emergency via backend API
        const emergencyData = {
            citizenId: currentUserId || 'guest',
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            address: 'Emergency Location',
            severity: 'MEDIUM',
            additionalInfo: additionalInfo || null
        };
        
        console.log('🚨 Creating emergency with data:', emergencyData);
        console.log('   API Endpoint:', API_BASE_URL + '/emergency/create');
        console.log('   citizenId type:', typeof emergencyData.citizenId);
        console.log('   citizenId value:', emergencyData.citizenId);
        
        const response = await apiCall('/emergency/create', {
            method: 'POST',
            body: JSON.stringify(emergencyData)
        });
        
        console.log('✅ Emergency created:', response);
        console.log('   Database ID:', response.id);
        console.log('   Emergency Code:', response.emergencyCode);
        
        // Create emergency object - store BOTH database ID and code
        currentEmergency = {
            id: response.emergencyCode,  // User-facing code for display
            dbId: response.id,          // Database ID for API calls
            userLocation: userLocation,
            timestamp: new Date(),
            ambulance: null,
            hospital: null,
            trafficUnits: [],
            status: "initiated",
            additionalInfo: additionalInfo
        };
        
        // Update analytics
        analytics.totalEmergencies++;
        
        // Add user marker
        userMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: "Emergency Location",
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="23" fill="#e74c3c" stroke="white" stroke-width="3"/>
                        <text x="25" y="33" font-size="24" text-anchor="middle" fill="white">🆘</text>
                    </svg>`
                ),
                scaledSize: new google.maps.Size(50, 50),
                anchor: new google.maps.Point(25, 25)
            },
            animation: google.maps.Animation.BOUNCE
        });
        
        // Update citizen UI
        updateCitizenUI(currentEmergency.id, userLocation);
        
        // Store location in currentEmergency for later use
        if (!currentEmergency) {
            currentEmergency = {};
        }
        currentEmergency.patientLocation = userLocation;
        
        // Center map
        map.setCenter(userLocation);
        map.setZoom(15);
        
        showNotification("Emergency SOS Activated! Code: " + currentEmergency.id, false);
        
        // Start allocation - use database ID for API call
        setTimeout(() => {
            allocateAmbulance(userLocation, currentEmergency.dbId);
        }, 1000);
        
    } catch (error) {
        console.error('Failed to create emergency:', error);
        
        // Check for duplicate SOS error
        if (error.errorCode === 'DUPLICATE_SOS') {
            showNotification("⚠️ " + (error.errorMessage || "Emergency already reported nearby. Help is on the way!"), true);
            showToast("Duplicate SOS Detected", error.errorMessage || "Another person has already called for help in your area.", "info");
        } else {
            showNotification("Failed to create emergency. Please try again.", true);
        }
    }
}

function updateCitizenUI(emergencyId, userLocation) {
    document.getElementById('citizenEmergencyStatus').classList.remove('hidden');
    document.getElementById('citizenEmergencyId').textContent = emergencyId;
    document.getElementById('citizenStatus').textContent = "Requesting help...";
}

// ========================================
// AMBULANCE ALLOCATION LOGIC
// ========================================

async function allocateAmbulance(userLocation, emergencyId) {
    console.log(`🚨 Allocating ambulance for emergency ${emergencyId}...`);
    console.log(`  Total ambulances: ${ambulances.length}`);
    console.log(`  Ambulance statuses:`, ambulances.map(a => `${a.name}=${a.status}`));
    
    const availableAmbulances = ambulances.filter(amb => amb.status === "available");
    console.log(`  Available ambulances: ${availableAmbulances.length}`);

    if (availableAmbulances.length === 0) {
        console.error('❌ No ambulances available for allocation!');
        showNotification("No ambulances available!", true);
        return;
    }

    let bestAmbulance = null;
    let shortestDistance = Infinity;

    // Find the nearest ambulance by distance
    availableAmbulances.forEach(ambulance => {
        const distance = calculateDistance(
            ambulance.lat, ambulance.lng,
            userLocation.lat, userLocation.lng
        );

        // If this ambulance is closer, or same distance but better equipped
        if (distance < shortestDistance || 
            (distance === shortestDistance && bestAmbulance && ambulance.equipment.length > bestAmbulance.equipment.length)) {
            shortestDistance = distance;
            
            // Calculate ETA considering traffic
            const trafficFactor = 1 + (Math.random() * 0.5);
            const eta = distance * trafficFactor * 3;
            
            bestAmbulance = { ...ambulance, distance, eta };
        }
    });

    console.log(`✅ Selected nearest ambulance: ${bestAmbulance.vehicleNumber} at ${shortestDistance.toFixed(2)} km`);

    // Assign ambulance via backend API
    try {
        if (emergencyId) {
            console.log(`🚨 Assigning ambulance ${bestAmbulance.id} to emergency ${emergencyId}`);
            const assignmentResponse = await apiCall(`/emergency/${emergencyId}/assign-ambulance/${bestAmbulance.id}`, {
                method: 'POST'
            });
            console.log('✅ Ambulance assigned via backend:', assignmentResponse);
            
            // Assign hospital via backend API
            console.log(`🏥 Assigning hospital to emergency ${emergencyId}`);
            console.log('   🛏️ BOOKING HOSPITAL BED NOW (when SOS pressed)...');
            const hospitalResponse = await apiCall(`/emergency/${emergencyId}/assign-hospital`, {
                method: 'POST'
            });
            console.log('✅ Hospital assigned via backend:', hospitalResponse);
            console.log('   🏥 Hospital ID:', hospitalResponse.assignedHospitalId);
            console.log('   🛏️ BED RESERVED SUCCESSFULLY');
            
            // Display hospital on citizen map
            if (hospitalResponse && hospitalResponse.assignedHospitalId) {
                const hospitalId = hospitalResponse.assignedHospitalId;
                const hospital = hospitals.find(h => h.id === hospitalId);
                
                if (hospital) {
                    console.log(`🏥 Displaying hospital: ${hospital.name}`);
                    currentEmergency.hospital = hospital;
                    
                    // Highlight hospital marker
                    const hospitalIndex = hospitals.findIndex(h => h.id === hospital.id);
                    if (hospitalMarkers[hospitalIndex]) {
                        hospitalMarkers[hospitalIndex].setAnimation(google.maps.Animation.BOUNCE);
                        hospitalMarkers[hospitalIndex].setIcon({
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                                    <circle cx="30" cy="30" r="28" fill="#27ae60" stroke="white" stroke-width="3"/>
                                    <text x="30" y="38" font-size="28" text-anchor="middle" fill="white">🏥</text>
                                </svg>`
                            ),
                            scaledSize: new google.maps.Size(60, 60),
                            anchor: new google.maps.Point(30, 30)
                        });
                        setTimeout(() => {
                            if (hospitalMarkers[hospitalIndex]) {
                                hospitalMarkers[hospitalIndex].setAnimation(null);
                            }
                        }, 3000);
                    }
                    
                    // 🗺️ Draw COMPLETE routes using universal function
                    setTimeout(async () => {
                        console.log('🗺️ Drawing complete emergency routes (universal)');
                        await drawCompleteEmergencyRoutes(hospitalResponse);
                        
                        // Alert traffic police after routes are drawn
                        setTimeout(async () => {
                            console.log('🚨 Alerting traffic police...');
                            await alertTrafficPolice(userLocation, hospital);
                        }, 1000);
                    }, 1500);
                    
                    showNotification(`🏥 Hospital: ${hospital.name}`, false);
                }
            }
        }
    } catch (error) {
        console.error('❌ Failed to assign ambulance/hospital via API:', error);
    }
    
    // Update local state
    const ambulanceIndex = ambulances.findIndex(amb => amb.id === bestAmbulance.id);
    ambulances[ambulanceIndex].status = "busy";
    currentEmergency.ambulance = bestAmbulance;
    currentEmergency.ambulanceStartTime = new Date();

    // Update marker
    ambulanceMarkers[ambulanceIndex].setIcon(createAmbulanceIcon('busy'));
    
    // Update all dashboards with ambulance assignment
    currentEmergency.status = "ambulance_assigned";
    updateAllDashboards();

    // Draw route using Directions API (follows roads)
    drawRouteOnRoads(
        { lat: bestAmbulance.lat, lng: bestAmbulance.lng },
        { lat: userLocation.lat, lng: userLocation.lng },
        '#2ecc71', // green color
        (routePath) => {
            // Store the route path for ambulance to follow
            currentEmergency.routeToPatient = routePath;
            
            // Start ambulance movement along the route
            setTimeout(() => {
                startAmbulanceMovementAlongRoute(ambulanceIndex, routePath);
            }, 1000);
        }
    );

    // Update all relevant dashboards
    updateAllDashboards();

    showNotification(`${bestAmbulance.name} dispatched!`, false);

    // Hospital assignment is now handled by backend API above
}

// ========================================
// HOSPITAL SELECTION
// ========================================

function selectHospital(userLocation) {
    console.log('🏥 Selecting hospital. Available hospitals:', hospitals.length);
    const availableHospitals = hospitals.filter(h => h.availableBeds > 0);

    if (availableHospitals.length === 0) {
        showNotification("No hospitals with available beds!", true);
        console.error('❌ No hospitals with available beds found!');
        return;
    }

    console.log(`Found ${availableHospitals.length} hospitals with available beds`);

    let nearestHospital = null;
    let shortestDistance = Infinity;

    availableHospitals.forEach(hospital => {
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            hospital.lat, hospital.lng
        );

        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestHospital = { ...hospital, distance };
        }
    });

    // Reserve bed
    const hospitalIndex = hospitals.findIndex(h => h.id === nearestHospital.id);
    hospitals[hospitalIndex].availableBeds--;
    currentEmergency.hospital = nearestHospital;
    currentEmergency.status = "hospital_assigned";

    console.log(`🏥 Selected hospital: ${nearestHospital.name} at (${nearestHospital.lat}, ${nearestHospital.lng})`);
    
    // Update all dashboards with hospital assignment
    updateAllDashboards();
    
    // Highlight the selected hospital marker
    if (hospitalMarkers[hospitalIndex]) {
        hospitalMarkers[hospitalIndex].setAnimation(google.maps.Animation.BOUNCE);
        hospitalMarkers[hospitalIndex].setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="28" fill="#27ae60" stroke="white" stroke-width="3"/>
                    <text x="30" y="38" font-size="28" text-anchor="middle" fill="white">🏥</text>
                </svg>`
            ),
            scaledSize: new google.maps.Size(60, 60),
            anchor: new google.maps.Point(30, 30)
        });
        setTimeout(() => {
            if (hospitalMarkers[hospitalIndex]) {
                hospitalMarkers[hospitalIndex].setAnimation(null);
            }
        }, 3000);
    }

    // Draw route using Directions API (follows roads)
    drawRouteOnRoads(
        { lat: userLocation.lat, lng: userLocation.lng },
        { lat: nearestHospital.lat, lng: nearestHospital.lng },
        '#e74c3c', // red color
        (routePath) => {
            // Store the route path to hospital
            currentEmergency.routeToHospital = routePath;
            
            // Adjust map to show both emergency location and hospital
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
            bounds.extend({ lat: nearestHospital.lat, lng: nearestHospital.lng });
            map.fitBounds(bounds);
        }
    );

    updateAllDashboards();
    showNotification(`🏥 Hospital bed reserved at ${nearestHospital.name} (${nearestHospital.distance.toFixed(2)} km away)`, false);

    // Alert traffic police
    setTimeout(async () => {
        await alertTrafficPolice(userLocation, nearestHospital);
    }, 1500);
}

// ========================================
// TRAFFIC POLICE ALERT
// ========================================

async function alertTrafficPolice(userLocation, hospital) {
    console.log('🚨 Alerting traffic police along the ENTIRE ambulance route...');
    console.log(`  Ambulance location: (${currentEmergency.ambulance?.lat || 'N/A'}, ${currentEmergency.ambulance?.lng || 'N/A'})`);
    console.log(`  Patient location: (${userLocation.lat}, ${userLocation.lng})`);
    console.log(`  Hospital: ${hospital.name} at (${hospital.lat}, ${hospital.lng})`);
    console.log(`  Total traffic police: ${trafficPolice.length}`);
    
    const alertedUnits = [];
    const ROUTE_BUFFER_KM = 2.0; // Alert officers within 2km of the route
    const HOSPITAL_RADIUS_KM = 2.5; // Alert officers within 2.5km of hospital destination

    // Get both route segments
    const routeToPatient = currentEmergency.routeToPatient || [];
    const routeToHospital = currentEmergency.routeToHospital || [];
    console.log(`  Route to patient: ${routeToPatient.length} waypoints`);
    console.log(`  Route to hospital: ${routeToHospital.length} waypoints`);
    
    // Combine both routes for complete coverage
    const completeRoute = [...routeToPatient, ...routeToHospital];
    console.log(`  Complete route: ${completeRoute.length} total waypoints`);

    trafficPolice.forEach((officer, index) => {
        let shouldAlert = false;
        let alertReason = '';
        
        // First priority: Check distance to hospital (ensure junctions near hospital are covered)
        const distToHospital = calculateDistance(officer.lat, officer.lng, hospital.lat, hospital.lng);
        
        if (distToHospital <= HOSPITAL_RADIUS_KM) {
            shouldAlert = true;
            alertReason = `near hospital (${distToHospital.toFixed(2)}km)`;
        } else {
            // Second priority: Calculate minimum distance from officer to any point on the COMPLETE route
            let minDistanceToRoute = Infinity;
            
            if (completeRoute.length > 0) {
                for (const point of completeRoute) {
                    // Handle both plain objects {lat, lng} and Google Maps LatLng objects
                    const pointLat = typeof point.lat === 'function' ? point.lat() : point.lat;
                    const pointLng = typeof point.lng === 'function' ? point.lng() : point.lng;
                    
                    const distance = calculateDistance(
                        officer.lat, officer.lng,
                        pointLat, pointLng
                    );
                    if (distance < minDistanceToRoute) {
                        minDistanceToRoute = distance;
                    }
                }
                
                if (minDistanceToRoute <= ROUTE_BUFFER_KM) {
                    shouldAlert = true;
                    alertReason = `along ambulance route (${minDistanceToRoute.toFixed(2)}km)`;
                }
            } else {
                // Fallback: if no route, check distance to all key locations
                const distToPatient = calculateDistance(officer.lat, officer.lng, userLocation.lat, userLocation.lng);
                const distToAmbulance = currentEmergency.ambulance ? 
                    calculateDistance(officer.lat, officer.lng, currentEmergency.ambulance.lat, currentEmergency.ambulance.lng) : Infinity;
                
                minDistanceToRoute = Math.min(distToPatient, distToHospital, distToAmbulance);
                
                if (minDistanceToRoute <= ROUTE_BUFFER_KM) {
                    shouldAlert = true;
                    alertReason = `near emergency path (${minDistanceToRoute.toFixed(2)}km)`;
                }
            }
        }
        
        console.log(`  ${officer.officerName}: Distance to hospital=${distToHospital.toFixed(2)}km`);

        if (shouldAlert) {
            console.log(`    ✅ ALERTED ${officer.officerName} - ${alertReason}`);
            alertedUnits.push(officer);
            
            if (trafficPoliceMarkers[index]) {
                trafficPoliceMarkers[index].setIcon(createTrafficIcon('alerted'));
                trafficPoliceMarkers[index].setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    if (trafficPoliceMarkers[index]) {
                        trafficPoliceMarkers[index].setAnimation(null);
                    }
                }, 3000);
            }
        } else {
            console.log(`    ❌ Not alerted (too far from complete route and hospital)`);
        }
    });

    currentEmergency.trafficUnits = alertedUnits;
    console.log(`🚨 Total alerted units: ${alertedUnits.length}`);
    
    // Create backend assignments for alerted officers
    if (alertedUnits.length > 0 && currentEmergency.id) {
        console.log('📡 Creating backend assignments for alerted officers...');
        console.log(`   currentEmergency.id: ${currentEmergency.id}`);
        console.log(`   Number of units to alert: ${alertedUnits.length}`);
        
        for (const unit of alertedUnits) {
            try {
                const assignmentData = {
                    emergencyId: currentEmergency.id,
                    officerId: unit.id,
                    junctionId: `junction-${unit.id}`,
                    junctionName: `Route to ${hospital.name}`
                };
                
                console.log(`   Creating assignment for officer ${unit.officerName} (ID: ${unit.id}):`, assignmentData);
                
                const assignment = await apiCall('/traffic/assignment/create', {
                    method: 'POST',
                    body: JSON.stringify(assignmentData)
                });
                
                console.log(`✅ Created assignment for ${unit.officerName}:`, assignment);
                console.log(`   Assignment ID: ${assignment.id}`);
                console.log(`   Assignment Status: ${assignment.status}`);
                console.log(`   Emergency ID in assignment: ${assignment.emergencyId}`);
                console.log(`   Officer ID in assignment: ${assignment.officerId}`);
                
            } catch (error) {
                console.error(`❌ Error creating assignment for ${unit.officerName}:`, error);
                console.error(`   Error details:`, error.message || error);
            }
        }
        console.log('✅ Finished creating all assignments');
    } else {
        console.log(`⚠️ Skipping assignment creation: alertedUnits=${alertedUnits.length}, currentEmergency.id=${currentEmergency.id}`);
    }
    
    // Draw alert radius circles for visualization (temporary)
    if (alertedUnits.length > 0) {
        // Draw hospital alert radius circle (larger, different color)
        const hospitalCircle = new google.maps.Circle({
            strokeColor: '#e74c3c',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillColor: '#e74c3c',
            fillOpacity: 0.08,
            map: map,
            center: { lat: hospital.lat, lng: hospital.lng },
            radius: HOSPITAL_RADIUS_KM * 1000 // convert km to meters
        });
        
        // Remove hospital circle after 8 seconds
        setTimeout(() => {
            hospitalCircle.setMap(null);
        }, 8000);
        
        // Draw individual officer alert circles
        alertedUnits.forEach(unit => {
            const alertCircle = new google.maps.Circle({
                strokeColor: '#f39c12',
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: '#f39c12',
                fillOpacity: 0.1,
                map: map,
                center: { lat: unit.lat, lng: unit.lng },
                radius: ROUTE_BUFFER_KM * 1000 // convert km to meters
            });
            
            // Remove circle after 5 seconds
            setTimeout(() => {
                alertCircle.setMap(null);
            }, 5000);
        });
    }
    
    updateAllDashboards();
    
    if (alertedUnits.length > 0) {
        showNotification(`🚨 Emergency Route Alert Sent to ${alertedUnits.length} traffic units`, false);
    } else {
        console.warn('⚠️ No traffic police units within alert radius');
        showNotification('⚠️ No traffic police available in this area', true);
    }
}

// ========================================
// AMBULANCE MOVEMENT SIMULATION
// ========================================

// New function: Move ambulance along actual route path
function startAmbulanceMovementAlongRoute(ambulanceIndex, routePath) {
    if (!routePath || routePath.length < 2) {
        console.error('Invalid route path');
        return;
    }

    const marker = ambulanceMarkers[ambulanceIndex];
    let pathIndex = 0;
    const totalPoints = routePath.length;
    const interval = 2000; // 2 seconds per step
    const pointsPerStep = Math.max(1, Math.floor(totalPoints / 30)); // Move through multiple points per interval

    movementInterval = setInterval(() => {
        if (pathIndex < totalPoints - 1) {
            const currentPoint = routePath[pathIndex];
            const nextIndex = Math.min(pathIndex + pointsPerStep, totalPoints - 1);
            const nextPoint = routePath[nextIndex];
            
            // Calculate heading
            const heading = calculateBearing(
                currentPoint.lat, currentPoint.lng,
                nextPoint.lat, nextPoint.lng
            );
            
            // Update ambulance position
            marker.setPosition(nextPoint);
            marker.setIcon(createAmbulanceIcon('busy', heading));
            
            ambulances[ambulanceIndex].lat = nextPoint.lat;
            ambulances[ambulanceIndex].lng = nextPoint.lng;
            
            // Update backend position every few steps to sync with ambulance dashboard
            if (pathIndex % (pointsPerStep * 5) === 0 || nextIndex === totalPoints - 1) {
                const ambulanceId = ambulances[ambulanceIndex].id;
                apiCall(`/ambulance/${ambulanceId}/location`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        latitude: nextPoint.lat,
                        longitude: nextPoint.lng
                    })
                }).catch(err => console.error('⚠️ Failed to update ambulance position:', err));
            }
            
            pathIndex = nextIndex;
            
        } else {
            // Arrived at patient
            console.log('🚑 Ambulance arrived at patient location');
            currentEmergency.status = "patient_loaded";
            updateAllDashboards();
            showNotification("Ambulance arrived at patient location!", false);
            if (userMarker) userMarker.setAnimation(null);
            
            clearInterval(movementInterval);
            
            // Wait, then transport to hospital
            setTimeout(async () => {
                currentEmergency.status = "transporting";
                updateAllDashboards();
                
                const hospital = currentEmergency.hospital;
                console.log('🏥 Starting transport to hospital:', hospital?.name || 'unknown');
                
                if (!hospital) {
                    console.error('❌ No hospital assigned!');
                    showNotification('⚠️ No hospital assigned', true);
                    return;
                }
                
                const patientLocation = routePath[routePath.length - 1];
                
                // Check if route to hospital exists
                let routeToHospital = currentEmergency.routeToHospital;
                
                if (!routeToHospital || routeToHospital.length < 2) {
                    console.log('🗺️ Route to hospital not found, drawing now...');
                    // Draw route if not already drawn
                    await new Promise((resolve) => {
                        drawRouteOnRoads(
                            { lat: patientLocation.lat, lng: patientLocation.lng },
                            { lat: hospital.lat, lng: hospital.lng },
                            '#e74c3c',
                            (routePath) => {
                                currentEmergency.routeToHospital = routePath;
                                routeToHospital = routePath;
                                console.log('✅ Route to hospital drawn, starting movement');
                                resolve();
                            }
                        );
                    });
                }
                
                if (routeToHospital && routeToHospital.length > 2) {
                    console.log('🚑 Starting movement to hospital along route');
                    startMovementToHospitalAlongRoute(ambulanceIndex, routeToHospital);
                } else {
                    console.error('❌ Failed to get route to hospital');
                    showNotification('⚠️ Failed to calculate route to hospital', true);
                }
            }, 4000);
        }
    }, interval);
}

// New function: Move to hospital along route
async function startMovementToHospitalAlongRoute(ambulanceIndex, routePath) {
    console.log('🏥 startMovementToHospitalAlongRoute called with', routePath.length, 'points');
    
    if (!routePath || routePath.length < 2) {
        console.error('❌ Invalid route path to hospital');
        return;
    }

    const marker = ambulanceMarkers[ambulanceIndex];
    let pathIndex = 0;
    const totalPoints = routePath.length;
    const interval = 2000;
    const pointsPerStep = Math.max(1, Math.floor(totalPoints / 30));

    movementInterval = setInterval(async () => {
        if (pathIndex < totalPoints - 1) {
            const currentPoint = routePath[pathIndex];
            const nextIndex = Math.min(pathIndex + pointsPerStep, totalPoints - 1);
            const nextPoint = routePath[nextIndex];
            
            // Calculate heading
            const heading = calculateBearing(
                currentPoint.lat, currentPoint.lng,
                nextPoint.lat, nextPoint.lng
            );
            
            // Update ambulance position
            marker.setPosition(nextPoint);
            marker.setIcon(createAmbulanceIcon('busy', heading));
            
            ambulances[ambulanceIndex].lat = nextPoint.lat;
            ambulances[ambulanceIndex].lng = nextPoint.lng;
            
            // Update backend position every few steps
            if (pathIndex % (pointsPerStep * 5) === 0 || nextIndex === totalPoints - 1) {
                const ambulanceId = ambulances[ambulanceIndex].id;
                apiCall(`/ambulance/${ambulanceId}/location`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        latitude: nextPoint.lat,
                        longitude: nextPoint.lng
                    })
                }).catch(err => console.error('⚠️ Failed to update ambulance position:', err));
            }
            
            pathIndex = nextIndex;
            
        } else {
            // Arrived at hospital
            console.log('🏥 Ambulance arrived at hospital!');
            clearInterval(movementInterval);
            
            // Update backend: Set emergency status to COMPLETED
            const emergencyDbId = currentEmergency.dbId;  // Use database ID for API
            const ambulanceId = ambulances[ambulanceIndex].id;
            
            try {
                console.log('📤 Updating backend: Emergency COMPLETED');
                console.log('   Emergency DB ID:', emergencyDbId);
                await apiCall(`/emergency/${emergencyDbId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'COMPLETED' })
                });
                
                console.log('📤 Updating backend: Ambulance AVAILABLE');
                await apiCall(`/ambulance/${ambulanceId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'AVAILABLE' })
                });
                
                // Complete all traffic assignments for this emergency
                console.log('📤 Completing traffic assignments for emergency:', currentEmergency.id);
                try {
                    const trafficAssignments = await apiCall(`/traffic/assignment/emergency/${currentEmergency.id}`);
                    console.log(`   Found ${trafficAssignments.length} traffic assignments to complete`);
                    
                    for (const assignment of trafficAssignments) {
                        if (assignment.status !== 'COMPLETED') {
                            await apiCall(`/traffic/assignment/${assignment.id}/complete`, {
                                method: 'POST'
                            });
                            console.log(`   ✅ Completed assignment ${assignment.id.substring(0, 8)}...`);
                        }
                    }
                } catch (assignmentError) {
                    console.warn('⚠️ Failed to complete traffic assignments:', assignmentError);
                }
                
                console.log('✅ Backend updated successfully');
            } catch (error) {
                console.error('❌ Failed to update backend:', error);
            }
            
            // Update local status
            currentEmergency.status = "completed";
            ambulances[ambulanceIndex].status = "available";
            
            const responseTime = (new Date() - currentEmergency.ambulanceStartTime) / 1000 / 60;
            analytics.responseTimes.push(responseTime);
            analytics.avgResponseTime = analytics.responseTimes.reduce((a, b) => a + b, 0) / analytics.responseTimes.length;
            
            updateAllDashboards();
            showNotification("Patient delivered to hospital successfully!", false);
            
            // Reload history to show the completed emergency
            console.log('🔄 Reloading history after emergency completion...');
            setTimeout(() => {
                loadEmergencyHistory();
            }, 2000);
            
            // Reset after delay
            setTimeout(() => {
                resetEmergency();
            }, 5000);
        }
    }, interval);
}

// Legacy function: For fallback if route fails
function startAmbulanceMovement(ambulanceIndex, targetLocation) {
    const ambulance = ambulances[ambulanceIndex];
    const marker = ambulanceMarkers[ambulanceIndex];
    
    let currentLat = ambulance.lat;
    let currentLng = ambulance.lng;
    
    const targetLat = targetLocation.lat;
    const targetLng = targetLocation.lng;
    
    const steps = 20;
    const latStep = (targetLat - currentLat) / steps;
    const lngStep = (targetLng - currentLng) / steps;
    
    // Calculate initial heading
    const heading = calculateBearing(currentLat, currentLng, targetLat, targetLng);
    
    let stepCount = 0;

    movementInterval = setInterval(() => {
        stepCount++;
        
        if (stepCount <= steps) {
            const prevLat = currentLat;
            const prevLng = currentLng;
            
            currentLat += latStep;
            currentLng += lngStep;
            
            // Calculate heading for current movement
            const currentHeading = calculateBearing(prevLat, prevLng, currentLat, currentLng);
            
            // Update position with rotated icon
            marker.setPosition({ lat: currentLat, lng: currentLng });
            marker.setIcon(createAmbulanceIcon('busy', currentHeading));
            
            ambulances[ambulanceIndex].lat = currentLat;
            ambulances[ambulanceIndex].lng = currentLng;
            
        } else if (stepCount === steps + 1) {
            currentEmergency.status = "patient_loaded";
            updateAllDashboards();
            showNotification("Ambulance arrived at patient location!", false);
            userMarker.setAnimation(null);
            
        } else if (stepCount === steps + 3) {
            currentEmergency.status = "transporting";
            updateAllDashboards();
            const hospital = currentEmergency.hospital;
            startMovementToHospital(ambulanceIndex, targetLocation, hospital);
            clearInterval(movementInterval);
        }
    }, 2000);
}

async function startMovementToHospital(ambulanceIndex, currentLocation, hospital) {
    const marker = ambulanceMarkers[ambulanceIndex];
    
    let currentLat = currentLocation.lat;
    let currentLng = currentLocation.lng;
    
    const targetLat = hospital.lat;
    const targetLng = hospital.lng;
    
    const steps = 20;
    const latStep = (targetLat - currentLat) / steps;
    const lngStep = (targetLng - currentLng) / steps;
    
    let stepCount = 0;

    movementInterval = setInterval(async () => {
        stepCount++;
        
        if (stepCount <= steps) {
            const prevLat = currentLat;
            const prevLng = currentLng;
            
            currentLat += latStep;
            currentLng += lngStep;
            
            // Calculate heading for current movement
            const currentHeading = calculateBearing(prevLat, prevLng, currentLat, currentLng);
            
            // Update position with rotated icon
            marker.setPosition({ lat: currentLat, lng: currentLng });
            marker.setIcon(createAmbulanceIcon('busy', currentHeading));
            
            ambulances[ambulanceIndex].lat = currentLat;
            ambulances[ambulanceIndex].lng = currentLng;
            
        } else {
            clearInterval(movementInterval);
            
            // Update backend: Set emergency status to COMPLETED
            const emergencyDbId = currentEmergency.dbId;  // Use database ID for API
            const ambulanceId = ambulances[ambulanceIndex].id;
            
            try {
                console.log('📤 Updating backend: Emergency COMPLETED');
                console.log('   Emergency DB ID:', emergencyDbId);
                await apiCall(`/emergency/${emergencyDbId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'COMPLETED' })
                });
                
                console.log('📤 Updating backend: Ambulance AVAILABLE');
                await apiCall(`/ambulance/${ambulanceId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'AVAILABLE' })
                });
                
                console.log('✅ Backend updated successfully');
                
                // Complete all traffic assignments for this emergency
                try {
                    console.log('📤 Completing traffic assignments for emergency:', currentEmergency.id);
                    const trafficAssignments = await apiCall(`/traffic/assignment/emergency/${currentEmergency.id}`);
                    console.log('   Found assignments:', trafficAssignments.length);
                    for (const assignment of trafficAssignments) {
                        if (assignment.status !== 'COMPLETED') {
                            await apiCall(`/traffic/assignment/${assignment.id}/complete`, {
                                method: 'POST'
                            });
                            console.log('   ✅ Completed assignment:', assignment.id);
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to complete traffic assignments:', error);
                }
            } catch (error) {
                console.error('❌ Failed to update backend:', error);
            }
            
            currentEmergency.status = "completed";
            ambulances[ambulanceIndex].status = "available";
            
            const responseTime = (new Date() - currentEmergency.ambulanceStartTime) / 1000 / 60;
            analytics.responseTimes.push(responseTime);
            analytics.avgResponseTime = analytics.responseTimes.reduce((a, b) => a + b, 0) / analytics.responseTimes.length;
            
            updateAllDashboards();
            showNotification("Patient delivered to hospital successfully!", false);
            
            // Reset after delay
            setTimeout(() => {
                resetEmergency();
            }, 5000);
        }
    }, 2000);
}

// ========================================
// AMBULANCE DASHBOARD
// ========================================

function setupAmbulanceDashboard() {
    const statusToggle = document.getElementById('statusToggle');
    if (statusToggle) {
        statusToggle.addEventListener('click', toggleAmbulanceStatus);
    }
    
    // Update initial state
    updateAmbulanceDashboard();
    
    // Poll for assignments every 5 seconds
    setInterval(fetchAmbulanceAssignment, 5000);
    fetchAmbulanceAssignment(); // Initial fetch
    
    // Load history
    loadEmergencyHistory();
}

async function toggleAmbulanceStatus() {
    const btn = document.getElementById('statusToggle');
    const label = btn.querySelector('.toggle-label');
    
    // Don't allow toggle during active assignment
    if (!btn.classList.contains('available') && !btn.classList.contains('busy')) {
        return;
    }
    
    try {
        // Get ambulance by operator user ID
        const ambulance = await apiCall(`/ambulance/operator/${currentUserId}`);
        if (!ambulance) return;
        
        // Determine new status
        const newStatus = btn.classList.contains('available') ? 'ON_BREAK' : 'AVAILABLE';
        
        // Update backend
        await apiCall(`/ambulance/${ambulance.id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        // Update UI
        if (btn.classList.contains('available')) {
            btn.classList.remove('available');
            btn.classList.add('busy');
            label.textContent = 'On Break';
        } else {
            btn.classList.remove('busy');
            btn.classList.add('available');
            label.textContent = 'Available';
        }
        
        showNotification(`Status updated to ${newStatus}`, false);
    } catch (error) {
        console.error('Failed to update ambulance status:', error);
        showNotification('Failed to update status', true);
    }
}

async function fetchAmbulanceAssignment() {
    try {
        console.log('🚑 [Ambulance Polling] Checking for assignments...', currentUserId);
        
        // Get ambulance by operator user ID
        const ambulance = await apiCall(`/ambulance/operator/${currentUserId}`);
        if (!ambulance) {
            console.warn('🚑 [Ambulance Polling] No ambulance found for user:', currentUserId);
            return;
        }
        
        console.log('🚑 [Ambulance Polling] Ambulance found:', ambulance.id, ambulance.vehicleNumber, 'Status:', ambulance.status);
        
        // Get emergencies for this ambulance
        const emergencies = await apiCall(`/emergency/ambulance/${ambulance.id}`);
        console.log('🚑 [Ambulance Polling] Emergencies for this ambulance:', emergencies.length);
        emergencies.forEach(e => console.log(`  - Emergency ${e.emergencyCode}: Status=${e.status}, Hospital=${e.assignedHospitalId || 'none'}`))
        
        const activeEmergency = emergencies.find(e => 
            ['CREATED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'PATIENT_LOADED', 'TRANSPORTING', 'COMPLETED'].includes(e.status)
        );
        
        if (activeEmergency) {
            console.log('🚑 [Ambulance Polling] Active emergency found:', activeEmergency.emergencyCode);
            displayAmbulanceAssignment(activeEmergency, ambulance);
            
            // If emergency is completed, schedule automatic reset to idle after 5 seconds
            if (activeEmergency.status === 'COMPLETED' && !completedEmergencyResetScheduled) {
                console.log('🎉 [Ambulance Polling] Emergency completed! Will reset to idle in 5 seconds');
                completedEmergencyResetScheduled = true; // Set flag to prevent duplicate timeouts
                
                setTimeout(() => {
                    console.log('🔄 [Ambulance Polling] Resetting completed emergency to idle');
                    const statusToggle = document.getElementById('statusToggle');
                    if (statusToggle) {
                        statusToggle.disabled = false;
                        statusToggle.style.opacity = '1';
                        statusToggle.style.cursor = 'pointer';
                    }
                    document.getElementById('ambulanceIdle').classList.remove('hidden');
                    document.getElementById('ambulanceAssignment').classList.add('hidden');
                    
                    // Clear ambulance dashboard map markers and routes
                    if (ambulanceDashboardMarker) {
                        ambulanceDashboardMarker.setMap(null);
                        ambulanceDashboardMarker = null;
                    }
                    if (userMarker) {
                        userMarker.setMap(null);
                        userMarker = null;
                    }
                    routePolylines.forEach(polyline => polyline.setMap(null));
                    routePolylines = [];
                    directionsRenderers.forEach(renderer => renderer.setMap(null));
                    directionsRenderers = [];
                    
                    // Reset flag for next emergency
                    completedEmergencyResetScheduled = false;
                }, 5000);
            }
        } else {
            console.log('🚑 [Ambulance Polling] No active emergencies - resetting to idle');
            // No active assignment - reset to idle state
            completedEmergencyResetScheduled = false; // Reset flag when no active emergency
            
            const statusToggle = document.getElementById('statusToggle');
            if (statusToggle) {
                statusToggle.disabled = false;
                statusToggle.style.opacity = '1';
                statusToggle.style.cursor = 'pointer';
            }
            document.getElementById('ambulanceIdle').classList.remove('hidden');
            document.getElementById('ambulanceAssignment').classList.add('hidden');
            
            // Clear ambulance dashboard map markers and routes
            if (ambulanceDashboardMarker) {
                ambulanceDashboardMarker.setMap(null);
                ambulanceDashboardMarker = null;
            }
            if (userMarker) {
                userMarker.setMap(null);
                userMarker = null;
            }
            routePolylines.forEach(polyline => polyline.setMap(null));
            routePolylines = [];
            directionsRenderers.forEach(renderer => renderer.setMap(null));
            directionsRenderers = [];
        }
    } catch (error) {
        console.error('❌ [Ambulance Polling] Failed to fetch assignment:', error);
    }
}

async function displayAmbulanceAssignment(emergency, ambulance) {
    console.log('📋 [Ambulance Display] Showing assignment:', emergency.emergencyCode);
    
    // Disable status toggle during assignment
    const statusToggle = document.getElementById('statusToggle');
    if (statusToggle) {
        statusToggle.disabled = true;
        statusToggle.style.opacity = '0.5';
        statusToggle.style.cursor = 'not-allowed';
    }
    
    document.getElementById('ambulanceIdle').classList.add('hidden');
    document.getElementById('ambulanceAssignment').classList.remove('hidden');
    
    document.getElementById('ambulanceEmergencyId').textContent = emergency.emergencyCode;
    document.getElementById('ambulancePatientLoc').textContent = 
        `${emergency.latitude.toFixed(4)}, ${emergency.longitude.toFixed(4)}`;
    
    // Calculate distance
    const distance = calculateDistance(
        ambulance.currentLatitude, ambulance.currentLongitude,
        emergency.latitude, emergency.longitude
    );
    document.getElementById('ambulanceDistance').textContent = `${distance.toFixed(2)} km`;
    
    // Get hospital info if assigned
    let hospitalData = null;
    if (emergency.assignedHospitalId) {
        // Ensure hospitals are loaded
        if (hospitals.length === 0) {
            console.log('🏥 Loading hospitals for assignment display...');
            await loadHospitals();
        }
        hospitalData = hospitals.find(h => h.id === emergency.assignedHospitalId);
        console.log('🏥 Hospital assigned:', hospitalData ? hospitalData.name : 'Not found');
        document.getElementById('ambulanceDestHospital').textContent = 
            hospitalData ? hospitalData.name : 'Hospital Assigned';
    } else {
        console.log('🏥 No hospital assigned yet');
        document.getElementById('ambulanceDestHospital').textContent = 'Determining...';
    }
    
    const statusMap = {
        'CREATED': 'Emergency Created',
        'DISPATCHED': '🚑 En route to patient',
        'EN_ROUTE': '🚑 En route to patient',
        'ARRIVED': '✅ Arrived at scene',
        'PATIENT_LOADED': '👤 Patient loaded',
        'TRANSPORTING': '🏥 Transporting to hospital',
        'COMPLETED': '✅ Patient delivered to hospital'
    };
    document.getElementById('ambulanceRouteStatus').textContent = 
        statusMap[emergency.status] || 'En route';
    
    console.log('🗺️ [Ambulance Display] Drawing route on map...');
    // Draw route on map
    drawAmbulanceRoute(ambulance, emergency, hospitalData);
}

function updateAmbulanceDashboard() {
    if (currentEmergency && currentEmergency.ambulance) {
        document.getElementById('ambulanceIdle').classList.add('hidden');
        document.getElementById('ambulanceAssignment').classList.remove('hidden');
        
        document.getElementById('ambulanceEmergencyId').textContent = currentEmergency.id;
        document.getElementById('ambulancePatientLoc').textContent = 
            `${currentEmergency.userLocation.lat.toFixed(4)}, ${currentEmergency.userLocation.lng.toFixed(4)}`;
        document.getElementById('ambulanceDistance').textContent = 
            `${currentEmergency.ambulance.distance.toFixed(2)} km`;
        document.getElementById('ambulanceDestHospital').textContent = 
            currentEmergency.hospital ? currentEmergency.hospital.name : 'Determining...';
        
        const statusMap = {
            'initiated': 'En route to patient',
            'patient_loaded': 'Loading patient...',
            'transporting': 'Transporting to hospital',
            'completed': 'Emergency completed'
        };
        document.getElementById('ambulanceRouteStatus').textContent = 
            statusMap[currentEmergency.status] || 'En route';
    } else {
        document.getElementById('ambulanceIdle').classList.remove('hidden');
        document.getElementById('ambulanceAssignment').classList.add('hidden');
    }
}

function drawAmbulanceRoute(ambulance, emergency, hospital) {
    console.log('🗺️ [Map] drawAmbulanceRoute called', { ambulance: ambulance.id, emergency: emergency.emergencyCode, hospital: hospital?.name || 'none' });
    
    // Check if map is initialized
    if (!map) {
        console.error('❌ [Map] Map not initialized!');
        return;
    }
    
    // Trigger map resize (important when map container was hidden)
    google.maps.event.trigger(map, 'resize');
    console.log('🗺️ [Map] Map resize triggered');
    
    // Check if routes are already drawn (from citizen dashboard or previous calls)
    // Only redraw if no routes exist - this ensures both dashboards show the same route
    const hasExistingRoutes = directionsRenderers.length > 0 || routePolylines.length > 0;
    
    if (hasExistingRoutes) {
        console.log('🗺️ [Map] ✅ Routes already drawn, reusing existing visualization for consistency');
    }
    
    // Determine if patient is already loaded
    const isTransporting = ['PATIENT_LOADED', 'TRANSPORTING', 'COMPLETED'].includes(emergency.status);
    
    // Update or create user marker if patient not yet picked up
    if (!isTransporting) {
        if (!userMarker) {
            // Only create if it doesn't exist
            userMarker = new google.maps.Marker({
                position: { lat: emergency.latitude, lng: emergency.longitude },
                map: map,
                title: 'Patient Location',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="23" fill="#e74c3c" stroke="white" stroke-width="3"/>
                            <text x="25" y="33" font-size="24" text-anchor="middle" fill="white">🆘</text>
                        </svg>`
                    ),
                    scaledSize: new google.maps.Size(50, 50),
                    anchor: new google.maps.Point(25, 25)
                },
                animation: google.maps.Animation.BOUNCE
            });
        }
    } else {
        // Patient loaded, remove patient marker if it exists
        if (userMarker) {
            userMarker.setMap(null);
            userMarker = null;
        }
    }
    
    // Update or create ambulance marker for ambulance dashboard
    if (!ambulanceDashboardMarker) {
        ambulanceDashboardMarker = new google.maps.Marker({
            map: map,
            title: 'Your Ambulance',
            zIndex: 1000
        });
    }
    
    // Update ambulance marker position and icon
    ambulanceDashboardMarker.setPosition({ lat: ambulance.currentLatitude, lng: ambulance.currentLongitude });
    ambulanceDashboardMarker.setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="#2ecc71" stroke="white" stroke-width="3"/>
                <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">🚑</text>
            </svg>`
        ),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
    });
    
    // Only draw routes if they don't already exist (prevents duplicate/different routes)
    if (!hasExistingRoutes) {
        console.log('🗺️ [Map] No existing routes, drawing new ones');
        
        if (isTransporting && hospital) {
            // Patient already picked up - show route to hospital
            console.log('🗺️ [Map] Patient loaded - drawing route: ambulance → hospital');
            drawRouteOnRoads(
                { lat: ambulance.currentLatitude, lng: ambulance.currentLongitude },
                { lat: hospital.lat, lng: hospital.lng },
                '#e74c3c',
                () => {
                    console.log('✅ [Map] Ambulance → hospital route drawn');
                }
            );
            
            // Highlight hospital
            const hospitalIndex = hospitals.findIndex(h => h.id === hospital.id);
            if (hospitalIndex >= 0 && hospitalMarkers[hospitalIndex]) {
                hospitalMarkers[hospitalIndex].setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    if (hospitalMarkers[hospitalIndex]) {
                        hospitalMarkers[hospitalIndex].setAnimation(null);
                    }
                }, 2000);
            }
        } else {
            // Still going to patient
            console.log('🗺️ [Map] Drawing route: ambulance → patient');
            drawRouteOnRoads(
                { lat: ambulance.currentLatitude, lng: ambulance.currentLongitude },
                { lat: emergency.latitude, lng: emergency.longitude },
                '#2ecc71',
                () => {
                    console.log('✅ [Map] Ambulance → patient route drawn');
                }
            );
            
            // If hospital assigned, show future route from patient to hospital
            if (hospital) {
                console.log('🗺️ [Map] Drawing route: patient → hospital (preview)');
                drawRouteOnRoads(
                    { lat: emergency.latitude, lng: emergency.longitude },
                    { lat: hospital.lat, lng: hospital.lng },
                    '#3498db',
                    () => {
                        console.log('✅ [Map] Patient → hospital route drawn');
                    }
                );
                
                // Highlight hospital
                const hospitalIndex = hospitals.findIndex(h => h.id === hospital.id);
                if (hospitalIndex >= 0 && hospitalMarkers[hospitalIndex]) {
                    hospitalMarkers[hospitalIndex].setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(() => {
                        if (hospitalMarkers[hospitalIndex]) {
                            hospitalMarkers[hospitalIndex].setAnimation(null);
                        }
                    }, 2000);
                }
            }
        }
    }
    
    // Adjust map view to show all markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: ambulance.currentLatitude, lng: ambulance.currentLongitude });
    bounds.extend({ lat: emergency.latitude, lng: emergency.longitude });
    if (hospital) {
        bounds.extend({ lat: hospital.lat, lng: hospital.lng });
    }
    console.log('🗺️ [Map] Fitting bounds to markers');
    map.fitBounds(bounds);
    map.setZoom(Math.min(map.getZoom(), 14));
    console.log('✅ [Map] Route drawing completed');
}

// ========================================
// TRAFFIC DASHBOARD
// ========================================

async function setupTrafficDashboard() {
    console.log('🚓 Setting up traffic dashboard for user:', currentUserId);
    
    const acknowledgeBtn = document.getElementById('trafficAcknowledgeBtn');
    if (acknowledgeBtn) {
        acknowledgeBtn.addEventListener('click', acknowledgeTrafficAlert);
    }
    
    // Fetch and display active assignments for this officer immediately
    await fetchTrafficAssignments();
    
    // Poll for new assignments every 10 seconds
    setInterval(async () => {
        await fetchTrafficAssignments();
    }, 10000);
    
    // Load history
    loadEmergencyHistory();
    
    console.log('✅ Traffic dashboard setup complete - polling for assignments every 10 seconds');
}

async function fetchTrafficAssignments() {
    if (!currentUserId) {
        console.log('❌ No user logged in - cannot fetch assignments');
        return;
    }
    
    try {
        console.log('🔍 Fetching traffic assignments for user:', currentUserId);
        console.log('   Current URL:', window.location.href);
        console.log('   Auth token:', authToken ? 'Present' : 'Missing');
        
        // First get the officer record to get officer ID
        console.log('   Calling /traffic/officer/' + currentUserId);
        const officerResponse = await apiCall(`/traffic/officer/${currentUserId}`, {
            method: 'GET'
        });
        
        const officerId = officerResponse.id;
        console.log('👮 Officer record found!');
        console.log('   Officer ID:', officerId);
        console.log('   Officer Badge:', officerResponse.badgeNumber);
        console.log('   Officer User ID:', officerResponse.officerUserId);
        console.log('   Officer Status:', officerResponse.status);
        
        // Now get assignments for this officer
        console.log('   Calling /traffic/assignment/officer/' + officerId);
        const assignments = await apiCall(`/traffic/assignment/officer/${officerId}`, {
            method: 'GET'
        });
        
        console.log(`📋 Found ${assignments.length} total assignments for officer ${officerId}`);
        
        if (assignments.length > 0) {
            console.log('📋 Assignment details:');
            assignments.forEach((a, idx) => {
                console.log(`   [${idx}] ID: ${a.id.substring(0,12)}...`);
                console.log(`       Emergency ID: ${a.emergencyId}`);
                console.log(`       Officer ID: ${a.officerId}`);
                console.log(`       Status: ${a.status}`);
                console.log(`       Junction: ${a.junctionName}`);
                console.log(`       Created: ${a.createdAt}`);
            });
            
            // Filter for active assignments only (backend uses: ALERTED, ACKNOWLEDGED, ACTIVELY_CLEARING)
            const activeAssignments = assignments.filter(a => 
                a.status === 'ALERTED' || a.status === 'ACKNOWLEDGED' || a.status === 'ACTIVELY_CLEARING'
            );
            
            console.log(`✅ ${activeAssignments.length} active assignments (ALERTED/ACKNOWLEDGED/ACTIVELY_CLEARING)`);
            
            if (activeAssignments.length > 0) {
                // Get the most recent assignment
                const latestAssignment = activeAssignments[0];
                console.log('🚨 Displaying latest assignment:');
                console.log('   Assignment ID:', latestAssignment.id);
                console.log('   Emergency ID:', latestAssignment.emergencyId);
                console.log('   Status:', latestAssignment.status);
                
                // Fetch emergency details using the code endpoint (emergencyId in assignment is actually the code)
                console.log('   Fetching emergency details via /emergency/code/' + latestAssignment.emergencyId);
                const emergency = await apiCall(`/emergency/code/${latestAssignment.emergencyId}`, {
                    method: 'GET'
                });
                
                console.log('🚑 Emergency details fetched:');
                console.log('   Emergency Code:', emergency.emergencyCode);
                console.log('   Emergency DB ID:', emergency.id);
                console.log('   Status:', emergency.status);
                console.log('   Location:', emergency.latitude, emergency.longitude);
                
                // Update the dashboard display
                displayTrafficAssignment(latestAssignment, emergency);
            } else {
                console.log('ℹ️ No active assignments - showing idle state');
                showIdleTrafficDashboard();
            }
        } else {
            console.log('ℹ️ No assignments found - showing idle state');
            showIdleTrafficDashboard();
        }
        
    } catch (error) {
        console.error('❌ Error fetching traffic assignments:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        console.error('   Full error object:', JSON.stringify(error, null, 2));
        showIdleTrafficDashboard();
    }
}

async function displayTrafficAssignment(assignment, emergency) {
    console.log('📢 Displaying assignment on dashboard:');
    console.log('   Assignment ID:', assignment.id);
    console.log('   Emergency Code:', emergency.emergencyCode);
    console.log('   Junction:', assignment.junctionName);
    console.log('   Status:', assignment.status);
    
    const trafficIdle = document.getElementById('trafficIdle');
    const trafficAlert = document.getElementById('trafficAlert');
    
    if (trafficIdle && trafficAlert) {
        trafficIdle.classList.add('hidden');
        trafficAlert.classList.remove('hidden');
        
        console.log('✅ Traffic alert panel now visible');
        
        const emergencyIdElem = document.getElementById('trafficEmergencyId');
        const routeElem = document.getElementById('trafficRoute');
        
        if (emergencyIdElem) {
            emergencyIdElem.textContent = emergency.emergencyCode || emergency.id;
            console.log('   Set emergency ID display to:', emergency.emergencyCode || emergency.id);
        }
        if (routeElem) {
            routeElem.textContent = assignment.junctionName || 'Emergency Route Clearance';
            console.log('   Set route display to:', assignment.junctionName || 'Emergency Route Clearance');
        }
        
        // Show acknowledge button if not yet acknowledged
        const acknowledgeBtn = document.getElementById('trafficAcknowledgeBtn');
        if (acknowledgeBtn) {
            if (assignment.status === 'ALERTED') {
                acknowledgeBtn.style.display = 'block';
                acknowledgeBtn.onclick = () => acknowledgeTrafficAssignment(assignment.id);
                console.log('   Acknowledge button shown (status: ALERTED)');
            } else {
                acknowledgeBtn.style.display = 'none';
                console.log('   Acknowledge button hidden (status:', assignment.status + ')');
            }
        }
        
        // Show status based on assignment status
        const corridorStatus = document.getElementById('trafficCorridorStatus');
        if (corridorStatus) {
            if (assignment.status === 'ACKNOWLEDGED' || assignment.status === 'ACTIVELY_CLEARING') {
                corridorStatus.classList.remove('hidden');
                console.log('   Green corridor status shown');
            } else {
                corridorStatus.classList.add('hidden');
                console.log('   Green corridor status hidden');
            }
        }
        
        // 🗺️ DRAW ROUTES ON TRAFFIC POLICE MAP
        console.log('🗺️ [Traffic] Drawing emergency routes on traffic police map');
        await drawCompleteEmergencyRoutes(emergency);
    } else {
        console.error('❌ Traffic dashboard elements not found!');
    }
}

function showIdleTrafficDashboard() {
    const trafficIdle = document.getElementById('trafficIdle');
    const trafficAlert = document.getElementById('trafficAlert');
    
    if (trafficIdle && trafficAlert) {
        trafficIdle.classList.remove('hidden');
        trafficAlert.classList.add('hidden');
    }
}

async function acknowledgeTrafficAssignment(assignmentId) {
    try {
        console.log('✅ Acknowledging assignment:', assignmentId);
        
        await apiCall(`/traffic/assignment/${assignmentId}/acknowledge`, {
            method: 'POST'
        });
        
        // Update display
        document.getElementById('trafficAcknowledgeBtn').style.display = 'none';
        document.getElementById('trafficCorridorStatus').classList.remove('hidden');
        
        analytics.greenCorridors++;
        updateAllDashboards();
        showNotification("Green Corridor Activated!", false);
        
        // Refresh assignments
        await fetchTrafficAssignments();
        
    } catch (error) {
        console.error('❌ Error acknowledging assignment:', error);
        showNotification("Failed to acknowledge assignment", true);
    }
}

function acknowledgeTrafficAlert() {
    // Legacy function for backward compatibility
    document.getElementById('trafficAcknowledgeBtn').style.display = 'none';
    document.getElementById('trafficCorridorStatus').classList.remove('hidden');
    
    analytics.greenCorridors++;
    updateAllDashboards();
    showNotification("Green Corridor Activated!", false);
}

function updateTrafficDashboard() {
    console.log('Updating traffic dashboard...');
    
    const trafficIdle = document.getElementById('trafficIdle');
    const trafficAlert = document.getElementById('trafficAlert');
    
    if (!trafficIdle || !trafficAlert) {
        console.log('Traffic dashboard elements not found (user may not be logged in as traffic)');
        return;
    }
    
    if (currentEmergency && currentEmergency.trafficUnits && currentEmergency.trafficUnits.length > 0) {
        console.log(`✅ Showing traffic alert for ${currentEmergency.trafficUnits.length} units`);
        trafficIdle.classList.add('hidden');
        trafficAlert.classList.remove('hidden');
        
        const emergencyIdElem = document.getElementById('trafficEmergencyId');
        const routeElem = document.getElementById('trafficRoute');
        
        if (emergencyIdElem) {
            emergencyIdElem.textContent = currentEmergency.id;
        }
        if (routeElem) {
            routeElem.textContent = 
                `${currentEmergency.ambulance ? currentEmergency.ambulance.name : 'Ambulance'} → ${currentEmergency.hospital ? currentEmergency.hospital.name : 'Hospital'}`;
        }
    } else {
        console.log('No traffic units alerted, showing idle state');
        trafficIdle.classList.remove('hidden');
        trafficAlert.classList.add('hidden');
    }
}

// ========================================
// HOSPITAL DASHBOARD
// ========================================

function setupHospitalDashboard() {
    const bedIncreaseBtn = document.getElementById('bedIncreaseBtn');
    const bedDecreaseBtn = document.getElementById('bedDecreaseBtn');
    
    if (bedIncreaseBtn) {
        bedIncreaseBtn.addEventListener('click', () => adjustBedCount(1));
    }
    
    if (bedDecreaseBtn) {
        bedDecreaseBtn.addEventListener('click', () => adjustBedCount(-1));
    }
    
    updateHospitalDashboard();
    
    // Poll for incoming emergencies assigned to this hospital
    setInterval(async () => {
        await updateHospitalDashboard();
    }, 3000); // Check every 3 seconds
    
    // Load history
    loadEmergencyHistory();
}

function adjustBedCount(change) {
    if (hospitals[0]) {
        hospitals[0].availableBeds = Math.max(0, hospitals[0].availableBeds + change);
        updateHospitalDashboard();
        showNotification(`Bed count updated to ${hospitals[0].availableBeds}`, false);
    }
}

async function updateHospitalDashboard() {
    // Update bed count
    if (hospitals[0]) {
        document.getElementById('hospitalBedCount').textContent = hospitals[0].availableBeds;
    }
    
    // Fetch emergencies assigned to THIS hospital
    try {
        if (!hospitals[0] || !hospitals[0].id) {
            console.warn('Hospital ID not available yet');
            return;
        }
        
        const hospitalId = hospitals[0].id;
        console.log('🏥 [Hospital] Checking for emergencies assigned to hospital:', hospitalId);
        
        const assignedEmergencies = await apiCall(`/emergency/hospital/${hospitalId}`);
        console.log('🏥 [Hospital] Found', assignedEmergencies.length, 'assigned emergencies');
        
        if (assignedEmergencies && assignedEmergencies.length > 0) {
            // Show the first active emergency
            const emergency = assignedEmergencies[0];
            console.log('🏥 [Hospital] Displaying emergency:', emergency.emergencyCode);
            
            document.getElementById('hospitalIncoming').classList.remove('hidden');
            document.getElementById('hospitalEmergencyId').textContent = emergency.emergencyCode || emergency.id;
            
            // Get ambulance info if assigned
            let ambulanceName = 'Dispatching...';
            let eta = 'Calculating...';
            if (emergency.assignedAmbulanceId) {
                const ambulance = ambulances.find(a => a.id === emergency.assignedAmbulanceId);
                if (ambulance) {
                    ambulanceName = ambulance.name;
                    // Calculate ETA based on distance
                    const distance = calculateDistance(
                        ambulance.lat, ambulance.lng,
                        emergency.latitude, emergency.longitude
                    );
                    eta = `${(distance * 3).toFixed(1)} mins`;
                }
            }
            
            document.getElementById('hospitalAmbulance').textContent = ambulanceName;
            document.getElementById('hospitalETA').textContent = eta;
            
            // 🗺️ DRAW ROUTES ON HOSPITAL MAP
            console.log('🗺️ [Hospital] Drawing emergency routes on hospital map');
            await drawCompleteEmergencyRoutes(emergency);
            
        } else {
            console.log('🏥 [Hospital] No incoming emergencies');
            document.getElementById('hospitalIncoming').classList.add('hidden');
        }
        
    } catch (error) {
        console.error('❌ [Hospital] Error fetching assigned emergencies:', error);
        document.getElementById('hospitalIncoming').classList.add('hidden');
    }
}

// ========================================
// CONTROL DASHBOARD
// ========================================

function setupControlDashboard() {
    const resetBtn = document.getElementById('controlResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSystem);
    }
    
    updateControlDashboard();
}

function updateControlDashboard() {
    // Update stats
    const availableCount = ambulances.filter(a => a.status === "available").length;
    document.getElementById('controlAmbulances').textContent = availableCount;
    
    const hospitalsWithBeds = hospitals.filter(h => h.availableBeds > 0).length;
    document.getElementById('controlHospitals').textContent = hospitalsWithBeds;
    
    document.getElementById('controlTraffic').textContent = trafficPolice.length;
    document.getElementById('controlEmergencies').textContent = currentEmergency ? 1 : 0;
    
    // Update analytics
    document.getElementById('controlAvgResponse').textContent = 
        analytics.avgResponseTime > 0 ? `${analytics.avgResponseTime.toFixed(1)} min` : '--';
    document.getElementById('controlTotalEmerg').textContent = analytics.totalEmergencies;
    document.getElementById('controlSuccessRate').textContent = '100%';
    document.getElementById('controlCorridors').textContent = analytics.greenCorridors;
    
    // Update emergency list
    const emergencyList = document.getElementById('controlEmergencyList');
    if (currentEmergency) {
        emergencyList.innerHTML = `
            <div class="emergency-item">
                <div class="emergency-id">${currentEmergency.id}</div>
                <div style="margin-top: 5px; font-size: 11px; color: #95a5a6;">
                    Ambulance: ${currentEmergency.ambulance ? currentEmergency.ambulance.name : 'Assigning...'}
                </div>
            </div>
        `;
        
        // 🗺️ DRAW ROUTES ON CONTROL MAP
        if (currentEmergency.dbId) {
            console.log('🗺️ [Control] Drawing emergency routes on control dashboard map');
            apiCall(`/emergency/${currentEmergency.dbId}`)
                .then(fullEmergency => drawCompleteEmergencyRoutes(fullEmergency))
                .catch(error => console.warn('Could not fetch emergency for control dashboard:', error));
        }
    } else {
        emergencyList.innerHTML = '<p class="empty-state">No active emergencies</p>';
    }
}

// ========================================
// UNIVERSAL ROUTE DRAWING FOR ALL DASHBOARDS
// ========================================

/**
 * Draws complete emergency routes visible to ALL dashboards
 * Shows: Ambulance → Patient → Hospital
 * @param {Object} emergency - Full emergency object with assignments
 */
async function drawCompleteEmergencyRoutes(emergency) {
    console.log('🗺️ [Universal] Drawing complete emergency routes for all dashboards');
    
    if (!emergency || !map) {
        console.warn('⚠️ No emergency or map available for route drawing');
        return;
    }
    
    // Load data if not already loaded
    if (ambulances.length === 0) await loadAmbulances();
    if (hospitals.length === 0) await loadHospitals();
    
    // Find ambulance location
    let ambulanceLocation = null;
    if (emergency.assignedAmbulanceId) {
        const ambulance = ambulances.find(a => a.id === emergency.assignedAmbulanceId);
        if (ambulance) {
            ambulanceLocation = { lat: ambulance.lat, lng: ambulance.lng };
            console.log('   Ambulance location:', ambulanceLocation);
        }
    }
    
    // Patient location
    const patientLocation = {
        lat: emergency.latitude,
        lng: emergency.longitude
    };
    console.log('   Patient location:', patientLocation);
    
    // Find hospital location
    let hospitalLocation = null;
    if (emergency.assignedHospitalId) {
        const hospital = hospitals.find(h => h.id === emergency.assignedHospitalId);
        if (hospital) {
            hospitalLocation = { lat: hospital.lat, lng: hospital.lng };
            console.log('   Hospital location:', hospitalLocation);
            
            // Highlight hospital marker
            const hospitalIndex = hospitals.findIndex(h => h.id === hospital.id);
            if (hospitalIndex >= 0 && hospitalMarkers[hospitalIndex]) {
                hospitalMarkers[hospitalIndex].setAnimation(google.maps.Animation.BOUNCE);
                hospitalMarkers[hospitalIndex].setIcon({
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="28" fill="#27ae60" stroke="white" stroke-width="3"/>
                            <text x="30" y="38" font-size="28" text-anchor="middle" fill="white">🏥</text>
                        </svg>`
                    ),
                    scaledSize: new google.maps.Size(60, 60),
                    anchor: new google.maps.Point(30, 30)
                });
                setTimeout(() => {
                    if (hospitalMarkers[hospitalIndex]) {
                        hospitalMarkers[hospitalIndex].setAnimation(null);
                    }
                }, 3000);
            }
        }
    }
    
    // ROUTE 1: Ambulance → Patient (Green)
    if (ambulanceLocation) {
        console.log('🗺️ Drawing Route 1: Ambulance → Patient (GREEN)');
        drawRouteOnRoads(
            ambulanceLocation,
            patientLocation,
            '#2ecc71',
            () => console.log('   ✅ Route 1 drawn')
        );
    }
    
    // ROUTE 2: Patient → Hospital (Red)
    if (hospitalLocation) {
        console.log('🗺️ Drawing Route 2: Patient → Hospital (RED)');
        drawRouteOnRoads(
            patientLocation,
            hospitalLocation,
            '#e74c3c',
            () => console.log('   ✅ Route 2 drawn')
        );
    }
    
    // Fit map to show all markers
    if (ambulanceLocation || hospitalLocation) {
        const bounds = new google.maps.LatLngBounds();
        if (ambulanceLocation) bounds.extend(ambulanceLocation);
        bounds.extend(patientLocation);
        if (hospitalLocation) bounds.extend(hospitalLocation);
        map.fitBounds(bounds);
        console.log('🗺️ Map bounds adjusted to show all locations');
    }
}

// ========================================
// UPDATE ALL DASHBOARDS
// ========================================

function updateAllDashboards() {
    // Update citizen dashboard
    if (currentEmergency) {
        if (document.getElementById('citizenAmbulance')) {
            document.getElementById('citizenAmbulance').textContent = 
                currentEmergency.ambulance ? currentEmergency.ambulance.name : 'Searching...';
            document.getElementById('citizenETA').textContent = 
                currentEmergency.ambulance && currentEmergency.ambulance.eta ? `${currentEmergency.ambulance.eta.toFixed(1)} mins` : 'Calculating...';
            document.getElementById('citizenEquipment').textContent = 
                currentEmergency.ambulance ? currentEmergency.ambulance.equipment.join(', ') : '-';
            document.getElementById('citizenHospital').textContent = 
                currentEmergency.hospital ? currentEmergency.hospital.name : 'Pending...';
            
            // Calculate hospital distance if not already set
            let hospitalDist = '-';
            if (currentEmergency.hospital) {
                // Try to use stored patient location or global userLocation
                const patientLoc = currentEmergency.patientLocation || (typeof userLocation !== 'undefined' ? userLocation : null);
                
                if (patientLoc && !currentEmergency.hospital.distance) {
                    currentEmergency.hospital.distance = calculateDistance(
                        patientLoc.lat, patientLoc.lng,
                        currentEmergency.hospital.lat, currentEmergency.hospital.lng
                    );
                }
                
                if (currentEmergency.hospital.distance) {
                    hospitalDist = `${currentEmergency.hospital.distance.toFixed(2)} km`;
                }
            }
            document.getElementById('citizenHospitalDist').textContent = hospitalDist;
        }
        
        // Update Universal Emergency Overview on ALL dashboards
        updateEmergencyOverviewPanels();
    } else {
        // Hide emergency overview panels when no emergency
        hideEmergencyOverviewPanels();
    }
    
    // Update other dashboards
    updateAmbulanceDashboard();
    updateTrafficDashboard();
    updateHospitalDashboard();
    updateControlDashboard();
}

// ========================================
// UNIVERSAL EMERGENCY OVERVIEW (All Dashboards)
// ========================================

function updateEmergencyOverviewPanels() {
    if (!currentEmergency) return;
    
    const emergencyId = currentEmergency.id || '-';
    const ambulanceName = currentEmergency.ambulance ? currentEmergency.ambulance.name : 'Assigning...';
    const hospitalName = currentEmergency.hospital ? currentEmergency.hospital.name : 'Pending...';
    const status = getEmergencyStatusText();
    const locationText = currentEmergency.patientLocation 
        ? `${currentEmergency.patientLocation.lat.toFixed(4)}, ${currentEmergency.patientLocation.lng.toFixed(4)}`
        : '-';
    
    // Update Ambulance Dashboard Overview
    const ambulanceOverview = document.getElementById('ambulanceEmergencyOverview');
    if (ambulanceOverview) {
        ambulanceOverview.classList.remove('hidden');
        document.getElementById('ambulanceOverviewEmergencyId').textContent = emergencyId;
        document.getElementById('ambulanceOverviewAmbulance').textContent = ambulanceName;
        document.getElementById('ambulanceOverviewHospital').textContent = hospitalName;
        document.getElementById('ambulanceOverviewStatus').textContent = status;
    }
    
    // Update Traffic Dashboard Overview
    const trafficOverview = document.getElementById('trafficEmergencyOverview');
    if (trafficOverview) {
        trafficOverview.classList.remove('hidden');
        document.getElementById('trafficOverviewEmergencyId').textContent = emergencyId;
        document.getElementById('trafficOverviewAmbulance').textContent = ambulanceName;
        document.getElementById('trafficOverviewHospital').textContent = hospitalName;
        document.getElementById('trafficOverviewStatus').textContent = status;
    }
    
    // Update Hospital Dashboard Overview
    const hospitalOverview = document.getElementById('hospitalEmergencyOverview');
    if (hospitalOverview) {
        hospitalOverview.classList.remove('hidden');
        document.getElementById('hospitalOverviewEmergencyId').textContent = emergencyId;
        document.getElementById('hospitalOverviewAmbulance').textContent = ambulanceName;
        document.getElementById('hospitalOverviewLocation').textContent = locationText;
        document.getElementById('hospitalOverviewStatus').textContent = status;
    }
}

function hideEmergencyOverviewPanels() {
    const ambulanceOverview = document.getElementById('ambulanceEmergencyOverview');
    if (ambulanceOverview) {
        ambulanceOverview.classList.add('hidden');
    }
    
    const trafficOverview = document.getElementById('trafficEmergencyOverview');
    if (trafficOverview) {
        trafficOverview.classList.add('hidden');
    }
    
    const hospitalOverview = document.getElementById('hospitalEmergencyOverview');
    if (hospitalOverview) {
        hospitalOverview.classList.add('hidden');
    }
}

function getEmergencyStatusText() {
    if (!currentEmergency) return '-';
    
    switch(currentEmergency.status) {
        case 'initiated':
            return '🔴 Emergency Initiated - Allocating resources';
        case 'ambulance_assigned':
            return '🟡 Ambulance Assigned - En route to patient';
        case 'hospital_assigned':
            return '🟢 Hospital Assigned - Transporting patient';
        case 'completed':
            return '✅ Emergency Completed';
        default:
            return currentEmergency.status || 'Active';
    }
}

// ========================================
// RESET FUNCTIONS
// ========================================

function resetEmergency() {
    // Clear markers
    if (userMarker) {
        userMarker.setMap(null);
        userMarker = null;
    }
    
    // Clear routes
    routePolylines.forEach(polyline => {
        polyline.setMap(null);
    });
    routePolylines = [];
    
    // Clear direction renderers (for routes that follow roads)
    directionsRenderers.forEach(renderer => {
        renderer.setMap(null);
    });
    directionsRenderers = [];
    
    // Reset ambulance status
    ambulances.forEach((ambulance, index) => {
        ambulance.status = "available";
        ambulanceMarkers[index].setIcon(createAmbulanceIcon('available'));
    });
    
    // Reset traffic markers
    trafficPolice.forEach((officer, index) => {
        trafficPoliceMarkers[index].setIcon(createTrafficIcon('active'));
    });
    
    // Clear emergency
    currentEmergency = null;
    
    // Hide emergency overview panels on all dashboards
    hideEmergencyOverviewPanels();
    
    // Update all dashboards
    updateAllDashboards();
    
    // Reset citizen dashboard UI to idle state
    if (document.getElementById('citizenIdle')) {
        console.log('🔄 Resetting citizen dashboard to idle');
        document.getElementById('citizenIdle').classList.remove('hidden');
        document.getElementById('citizenEmergency').classList.add('hidden');
    }
    
    // Reset map view
    map.setCenter(CITY_CENTER);
    map.setZoom(14);
}

function resetSystem() {
    if (movementInterval) {
        clearInterval(movementInterval);
    }
    
    resetEmergency();
    
    // Reset analytics (optional)
    // analytics = { totalEmergencies: 0, avgResponseTime: 0, greenCorridors: 0, responseTimes: [] };
    
    showNotification("System reset successfully", false);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function showNotification(message, isError = false) {
    const toast = document.getElementById('notificationToast');
    toast.textContent = message;
    toast.className = 'notification-toast';
    
    if (isError) {
        toast.classList.add('error');
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================

window.addEventListener('load', () => {
    // Check if we're on dashboard page
    if (document.querySelector('.dashboard-page')) {
        // Will be called by Google Maps callback
        // initDashboard(); is called by callback
    }
});