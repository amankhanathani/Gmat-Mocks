// Global variables
let sessions = [];
let currentSession = null;
let currentQuestionIndex = 0;
let sessionTimer = null;
let viewMode = 'link'; // 'link' or 'embed'

// Storage keys
const STORAGE_KEY = 'gmat_prep_sessions';
const SETTINGS_KEY = 'gmat_prep_settings';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadSessions();
    setupEventListeners();
    displaySessions();
    updateCurrentReview();
});

// Event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Auto-save session inputs
    document.getElementById('sessionName').addEventListener('input', debounce(saveCurrentInputs, 500));
    document.getElementById('questionLinks').addEventListener('input', debounce(saveCurrentInputs, 500));
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Update displays when switching tabs
    if (tabName === 'history') {
        displaySessions();
    } else if (tabName === 'review') {
        updateCurrentReview();
    }
}

// localStorage functions with error handling
function saveSessions() {
    try {
        const dataToSave = {
            sessions: sessions,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        showToast('Sessions saved successfully', 'success');
        return true;
    } catch (error) {
        console.error('Error saving sessions:', error);
        if (error.name === 'QuotaExceededError') {
            showToast('Storage quota exceeded. Please clear old sessions.', 'error');
        } else {
            showToast('Failed to save sessions. Please try again.', 'error');
        }
        return false;
    }
}

function loadSessions() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Handle different data formats for backward compatibility
            if (Array.isArray(parsedData)) {
                // Old format - direct array
                sessions = parsedData;
            } else if (parsedData.sessions) {
                // New format - object with metadata
                sessions = parsedData.sessions;
            } else {
                sessions = [];
            }

            // Convert date strings back to Date objects
            sessions.forEach(session => {
                if (typeof session.startTime === 'string') {
                    session.startTime = new Date(session.startTime);
                }
                if (typeof session.endTime === 'string') {
                    session.endTime = new Date(session.endTime);
                }
            });

            console.log(`Loaded ${sessions.length} sessions from localStorage`);
        } else {
            sessions = [];
            console.log('No saved sessions found');
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
        sessions = [];
        showToast('Error loading saved sessions', 'error');
    }
}

function saveCurrentInputs() {
    try {
        const inputs = {
            sessionName: document.getElementById('sessionName').value,
            questionLinks: document.getElementById('questionLinks').value
        };
        localStorage.setItem('gmat_current_inputs', JSON.stringify(inputs));
    } catch (error) {
        console.error('Error saving current inputs:', error);
    }
}

function loadCurrentInputs() {
    try {
        const saved = localStorage.getItem('gmat_current_inputs');
        if (saved) {
            const inputs = JSON.parse(saved);
            document.getElementById('sessionName').value = inputs.sessionName || '';
            document.getElementById('questionLinks').value = inputs.questionLinks || '';
        }
    } catch (error) {
        console.error('Error loading current inputs:', error);
    }
}

// Session management
function startPractice() {
    const sessionName = document.getElementById('sessionName').value.trim();
    const questionLinksText = document.getElementById('questionLinks').value.trim();

    if (!sessionName) {
        showToast('Please enter a session name', 'warning');
        return;
    }

    if (!questionLinksText) {
        showToast('Please enter at least one question link', 'warning');
        return;
    }

    // Parse question links
    const questionLinks = questionLinksText
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0);

    if (questionLinks.length === 0) {
        showToast('No valid question links found', 'warning');
        return;
    }

    // Create new session
    currentSession = {
        id: Date.now(),
        name: sessionName,
        startTime: new Date(),
        endTime: null,
        questions: questionLinks.map(link => ({
            link: link,
            status: 'unanswered',
            notes: '',
            reviewNotes: '',
            timestamp: new Date()
        }))
    };

    currentQuestionIndex = 0;
    
    // Show practice session interface
    document.getElementById('practiceSession').classList.remove('hidden');
    document.querySelector('.setup-section').style.display = 'none';
    
    // Initialize session display
    document.getElementById('currentSessionName').textContent = sessionName;
    document.getElementById('totalQuestions').textContent = questionLinks.length;
    
    // Start timer
    startSessionTimer();
    
    // Display first question
    displayCurrentQuestion();
    
    showToast(`Practice session "${sessionName}" started with ${questionLinks.length} questions`, 'success');
}

function finishSession() {
    if (!currentSession) return;

    // Mark session as completed
    currentSession.endTime = new Date();
    
    // Add to sessions array
    sessions.unshift(currentSession);
    
    // Save to localStorage
    if (saveSessions()) {
        showToast('Session completed and saved!', 'success');
    }
    
    // Clear current session
    resetPracticeInterface();
    
    // Switch to history tab to show the completed session
    switchTab('history');
}

function cancelSession() {
    showConfirmModal(
        'Cancel Session',
        'Are you sure you want to cancel this practice session? All progress will be lost.',
        () => {
            resetPracticeInterface();
            showToast('Practice session cancelled', 'warning');
        }
    );
}

function resetPracticeInterface() {
    // Stop timer
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
    
    // Reset variables
    currentSession = null;
    currentQuestionIndex = 0;
    
    // Hide practice session interface
    document.getElementById('practiceSession').classList.add('hidden');
    document.querySelector('.setup-section').style.display = 'block';
    
    // Clear current inputs from localStorage
    try {
        localStorage.removeItem('gmat_current_inputs');
    } catch (error) {
        console.error('Error clearing current inputs:', error);
    }
}

function startSessionTimer() {
    if (sessionTimer) clearInterval(sessionTimer);
    
    sessionTimer = setInterval(() => {
        if (currentSession) {
            const elapsed = Math.floor((new Date() - currentSession.startTime) / 1000);
            document.getElementById('sessionTime').textContent = formatTime(elapsed);
        }
    }, 1000);
}

// Question navigation
function displayCurrentQuestion() {
    if (!currentSession || currentQuestionIndex >= currentSession.questions.length) return;

    const question = currentSession.questions[currentQuestionIndex];
    const questionNum = currentQuestionIndex + 1;
    
    // Update stats
    document.getElementById('currentQuestionNum').textContent = questionNum;
    
    // Update progress bar
    const progress = (questionNum / currentSession.questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').textContent = 
        currentQuestionIndex === currentSession.questions.length - 1 ? 'Finish ✅' : 'Next ➡️';
    
    // Display question
    const questionDisplay = document.getElementById('questionDisplay');
    questionDisplay.innerHTML = `
        <div class="question-number">Question ${questionNum} of ${currentSession.questions.length}</div>
        <div class="link-options">
            <a href="${question.link}" target="_blank" class="question-link">
                🔗 Open Question ${questionNum}
            </a>
            <button class="view-toggle ${viewMode === 'embed' ? 'active' : ''}" onclick="toggleViewMode()">
                ${viewMode === 'embed' ? '📱 Switch to Link' : '🖥️ Embed View'}
            </button>
        </div>
        ${viewMode === 'embed' ? `
            <div class="iframe-container">
                <iframe src="${question.link}" title="Question ${questionNum}"></iframe>
            </div>
        ` : ''}
        <div class="question-actions">
            <h4>Mark this question as:</h4>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 15px 0;">
                <button class="action-btn ${question.status === 'correct' ? 'correct' : 'secondary'}" 
                        onclick="markCurrentQuestion('correct')">✅ Correct</button>
                <button class="action-btn ${question.status === 'incorrect' ? 'incorrect' : 'secondary'}" 
                        onclick="markCurrentQuestion('incorrect')">❌ Incorrect</button>
                <button class="action-btn ${question.status === 'flagged' ? 'flag' : 'secondary'}" 
                        onclick="markCurrentQuestion('flagged')">🚩 Flag for Review</button>
                <button class="action-btn ${question.status === 'skipped' ? 'skip' : 'secondary'}" 
                        onclick="markCurrentQuestion('skipped')">⏭️ Skip</button>
            </div>
        </div>
        <div class="error-log">
            <label style="font-size: 0.9em; font-weight: 600; color: #2c3e50;">Session Notes:</label>
            <textarea placeholder="Add notes about this question (mistakes, concepts, etc.)" 
                      onchange="updateCurrentQuestionNotes(this.value)">${question.notes}</textarea>
        </div>
    `;
}

function nextQuestion() {
    if (!currentSession) return;
    
    if (currentQuestionIndex < currentSession.questions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
    } else {
        // Last question - finish session
        finishSession();
    }
}

function previousQuestion() {
    if (!currentSession || currentQuestionIndex <= 0) return;
    
    currentQuestionIndex--;
    displayCurrentQuestion();
}

function markCurrentQuestion(status) {
    if (!currentSession) return;
    
    currentSession.questions[currentQuestionIndex].status = status;
    currentSession.questions[currentQuestionIndex].timestamp = new Date();
    displayCurrentQuestion();
    
    // Auto-save current session state
    saveSessions();
}

function updateCurrentQuestionNotes(notes) {
    if (!currentSession) return;
    
    currentSession.questions[currentQuestionIndex].notes = notes;
    saveSessions();
}

function toggleViewMode() {
    viewMode = viewMode === 'link' ? 'embed' : 'link';
    displayCurrentQuestion();
}

// Session history display
function displaySessions() {
    const container = document.getElementById('sessionsList');
    
    if (sessions.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; font-style: italic; text-align: center;">No practice sessions yet. Complete a practice session to see it here!</p>';
        return;
    }

    container.innerHTML = sessions.map(session => {
        const stats = calculateSessionStats(session);
        const duration = session.endTime ? 
            Math.floor((session.endTime - session.startTime) / 1000) : 
            Math.floor((new Date() - session.startTime) / 1000);

        return `
            <div class="session-card">
                <div class="session-header">
                    <div class="session-title">${escapeHtml(session.name)}</div>
                    <div class="session-date">${session.startTime.toLocaleDateString()} ${session.startTime.toLocaleTimeString()}</div>
                </div>
                <div class="session-stats">
                    <div class="session-stat">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Questions</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-number">${stats.correct}</div>
                        <div class="stat-label">Correct</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-number">${stats.incorrect}</div>
                        <div class="stat-label">Incorrect</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-number">${stats.flagged}</div>
                        <div class="stat-label">Flagged</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-number">${formatTime(duration)}</div>
                        <div class="stat-label">Duration</div>
                    </div>
                </div>
                <div class="question-list">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">Questions Review:</h4>
                    ${session.questions.map((question, index) => `
                        <div class="question-item ${question.status}">
                            <div class="question-header">
                                <a href="${question.link}" target="_blank" class="question-link-small">
                                    Question ${index + 1}
                                </a>
                                <div class="question-status">
                                    <span class="status-badge status-${question.status}">
                                        ${question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            ${question.notes ? `<div style="font-size: 0.9em; color: #6c757d; margin: 5px 0;"><strong>Session Notes:</strong> ${escapeHtml(question.notes)}</div>` : ''}
                            <div class="error-log">
                                <label style="font-size: 0.9em; font-weight: 600; color: #2c3e50;">Review Notes:</label>
                                <textarea placeholder="Add your review notes, error analysis, concepts to study..." 
                                          onchange="updateQuestionReview(${session.id}, ${index}, this.value)">${escapeHtml(question.reviewNotes || '')}</textarea>
                                <div class="question-actions" style="margin-top: 8px;">
                                    <button class="action-btn ${question.status === 'correct' ? 'correct' : 'secondary'}" 
                                            onclick="updateQuestionStatus(${session.id}, ${index}, 'correct')">✅ Correct</button>
                                    <button class="action-btn ${question.status === 'incorrect' ? 'incorrect' : 'secondary'}" 
                                            onclick="updateQuestionStatus(${session.id}, ${index}, 'incorrect')">❌ Incorrect</button>
                                    <button class="action-btn ${question.status === 'flagged' ? 'flag' : 'secondary'}" 
                                            onclick="updateQuestionStatus(${session.id}, ${index}, 'flagged')">🚩 Flag</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 15px; text-align: center;">
                    <button class="button danger" onclick="confirmDeleteSession(${session.id})">🗑️ Delete Session</button>
                </div>
            </div>
        `;
    }).join('');
}

// Session management functions
function updateQuestionReview(sessionId, questionIndex, reviewNotes) {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.questions[questionIndex]) {
        session.questions[questionIndex].reviewNotes = reviewNotes;
        saveSessions();
    }
}

function updateQuestionStatus(sessionId, questionIndex, status) {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.questions[questionIndex]) {
        session.questions[questionIndex].status = status;
        session.questions[questionIndex].timestamp = new Date();
        saveSessions();
        displaySessions();
        updateCurrentReview();
        showToast('Question status updated', 'success');
    }
}

function confirmDeleteSession(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    showConfirmModal(
        'Delete Session',
        `Are you sure you want to delete the session "${session.name}"? This action cannot be undone.`,
        () => deleteSession(sessionId)
    );
}

function deleteSession(sessionId) {
    const initialLength = sessions.length;
    sessions = sessions.filter(session => session.id !== sessionId);
    
    if (sessions.length < initialLength) {
        if (saveSessions()) {
            displaySessions();
            updateCurrentReview();
            showToast('Session deleted successfully', 'success');
        } else {
            // Rollback on save failure
            loadSessions();
            showToast('Failed to delete session', 'error');
        }
    } else {
        showToast('Session not found', 'error');
    }
}

function confirmClearAllSessions() {
    if (sessions.length === 0) {
        showToast('No sessions to clear', 'warning');
        return;
    }

    showConfirmModal(
        'Clear All Sessions',
        `Are you sure you want to delete all ${sessions.length} practice sessions? This action cannot be undone.`,
        clearAllSessions
    );
}

function clearAllSessions() {
    sessions = [];
    if (saveSessions()) {
        displaySessions();
        updateCurrentReview();
        showToast('All sessions cleared successfully', 'success');
    } else {
        loadSessions(); // Rollback on failure
        showToast('Failed to clear sessions', 'error');
    }
}

// Current review display
function updateCurrentReview() {
    const container = document.getElementById('currentReviewContent');
    
    if (currentSession && currentSession.questions.length > 0) {
        // Show current session review
        const stats = calculateSessionStats(currentSession);
        container.innerHTML = `
            <div class="session-card">
                <div class="session-header">
                    <div class="session-title">Current Session: ${escapeHtml(currentSession.name)}</div>
                    <div class="session-date">Started: ${currentSession.startTime.toLocaleTimeString()}</div>
                </div>
                <div class="session-stats">
                    <div class="session-stat">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Questions</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-number">${stats.correct}</div>
                        <div class="stat-label">Correct</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-number">${stats.incorrect}</div>
                        <div class="stat-label">Incorrect</div>
                    </div>
                    <div class="session-stat">
                        <div class="stat-number">${stats.flagged}</div>
                        <div class="stat-label">Flagged</div>
                    </div>
                </div>
                <div class="current-session-actions">
                    <h4>Session Actions</h4>
                    <button class="button success" onclick="finishSession()">✅ Finish Session</button>
                    <button class="button danger" onclick="cancelSession()">❌ Cancel Session</button>
                </div>
            </div>
        `;
    } else {
        // Show overall statistics from all sessions
        if (sessions.length === 0) {
            container.innerHTML = '<p style="color: #6c757d; font-style: italic; text-align: center;">Start a practice session to review questions here.</p>';
        } else {
            const overallStats = calculateOverallStats();
            container.innerHTML = `
                <div class="session-card">
                    <h3 style="color: #2c3e50; margin-bottom: 20px;">📊 Overall Statistics</h3>
                    <div class="session-stats">
                        <div class="session-stat">
                            <div class="stat-number">${overallStats.totalSessions}</div>
                            <div class="stat-label">Total Sessions</div>
                        </div>
                        <div class="session-stat">
                            <div class="stat-number">${overallStats.totalQuestions}</div>
                            <div class="stat-label">Total Questions</div>
                        </div>
                        <div class="session-stat">
                            <div class="stat-number">${overallStats.correctQuestions}</div>
                            <div class="stat-label">Correct</div>
                        </div>
                        <div class="session-stat">
                            <div class="stat-number">${overallStats.flaggedQuestions}</div>
                            <div class="stat-label">Flagged</div>
                        </div>
                        <div class="session-stat">
                            <div class="stat-number">${overallStats.accuracyRate}%</div>
                            <div class="stat-label">Accuracy</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// Utility functions
function calculateSessionStats(session) {
    const stats = {
        total: session.questions.length,
        correct: 0,
        incorrect: 0,
        flagged: 0,
        skipped: 0,
        unanswered: 0
    };

    session.questions.forEach(question => {
        stats[question.status]++;
    });

    return stats;
}

function calculateOverallStats() {
    const stats = {
        totalSessions: sessions.length,
        totalQuestions: 0,
        correctQuestions: 0,
        incorrectQuestions: 0,
        flaggedQuestions: 0,
        skippedQuestions: 0,
        accuracyRate: 0
    };

    sessions.forEach(session => {
        session.questions.forEach(question => {
            stats.totalQuestions++;
            if (question.status === 'correct') stats.correctQuestions++;
            else if (question.status === 'incorrect') stats.incorrectQuestions++;
            else if (question.status === 'flagged') stats.flaggedQuestions++;
            else if (question.status === 'skipped') stats.skippedQuestions++;
        });
    });

    const answeredQuestions = stats.correctQuestions + stats.incorrectQuestions;
    stats.accuracyRate = answeredQuestions > 0 
        ? Math.round((stats.correctQuestions / answeredQuestions) * 100) 
        : 0;

    return stats;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// UI functions
function clearInputs() {
    document.getElementById('sessionName').value = '';
    document.getElementById('questionLinks').value = '';
    saveCurrentInputs();
    showToast('Inputs cleared', 'success');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const messageElement = document.getElementById('toastMessage');
    
    messageElement.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    document.getElementById('toast').classList.add('hidden');
}

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.remove('hidden');
    
    // Set up confirm button
    const confirmBtn = document.getElementById('confirmYes');
    confirmBtn.onclick = () => {
        hideConfirmModal();
        onConfirm();
    };
}

function hideConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}

// Load current inputs on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentInputs();
});

// Auto-save before page unload
window.addEventListener('beforeunload', function(e) {
    if (currentSession) {
        // Save current session state
        saveSessions();
    }
    saveCurrentInputs();
});

// Handle localStorage events (for multiple tabs)
window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY) {
        loadSessions();
        displaySessions();
        updateCurrentReview();
        showToast('Sessions updated from another tab', 'info');
    }
});

// Service worker registration for offline capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
