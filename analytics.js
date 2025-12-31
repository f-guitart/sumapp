/**
 * Analytics module for admin profile
 * Shows statistics for all profiles
 */

const Analytics = {
  /**
   * Check if profile name is admin
   */
  isAdmin(profileName) {
    return profileName && profileName.toLowerCase() === 'admin';
  },

  /**
   * Calculate statistics for a profile
   */
  calculateProfileStats(profileName, profileData) {
    const stats = profileData.stats || {};
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalQuestions = 0;
    const problemStats = [];

    // Calculate totals and per-problem stats
    Object.keys(stats).forEach(key => {
      const stat = stats[key];
      const correct = stat.correct || 0;
      const wrong = stat.wrong || 0;
      totalCorrect += correct;
      totalWrong += wrong;
      totalQuestions += correct + wrong;

      if (correct + wrong > 0) {
        const accuracy = ((correct / (correct + wrong)) * 100).toFixed(1);
        problemStats.push({
          problem: key,
          correct,
          wrong,
          total: correct + wrong,
          accuracy: parseFloat(accuracy)
        });
      }
    });

    // Sort by wrong answers (most incorrect first)
    problemStats.sort((a, b) => b.wrong - a.wrong);

    const overallAccuracy = totalQuestions > 0 
      ? ((totalCorrect / totalQuestions) * 100).toFixed(1)
      : '0.0';

    return {
      profileName,
      level: profileData.level || 1,
      totalCorrect,
      totalWrong,
      totalQuestions,
      overallAccuracy: parseFloat(overallAccuracy),
      problemStats,
      lastPlayed: profileData.lastPlayed || 'Never'
    };
  },

  /**
   * Get analytics for all profiles
   */
  getAllProfilesAnalytics() {
    const profiles = Storage.getProfiles();
    const analytics = [];

    Object.keys(profiles).forEach(profileName => {
      // Skip admin profile itself
      if (!this.isAdmin(profileName)) {
        const profileData = profiles[profileName];
        const stats = this.calculateProfileStats(profileName, profileData);
        analytics.push(stats);
      }
    });

    // Sort by total questions (most active first)
    analytics.sort((a, b) => b.totalQuestions - a.totalQuestions);

    return analytics;
  },

  /**
   * Render analytics screen
   */
  render(container) {
    const analytics = this.getAllProfilesAnalytics();

    container.innerHTML = `
      <div class="analytics-screen">
        <h2>Analytics Dashboard</h2>
        
        ${analytics.length === 0 ? `
          <div class="analytics-empty">
            <p>No player data yet. Players need to play the game to see analytics here.</p>
          </div>
        ` : `
          <div class="analytics-summary">
            <div class="summary-stat">
              <div class="summary-label">Total Players</div>
              <div class="summary-value">${analytics.length}</div>
            </div>
            <div class="summary-stat">
              <div class="summary-label">Total Questions</div>
              <div class="summary-value">${analytics.reduce((sum, a) => sum + a.totalQuestions, 0)}</div>
            </div>
            <div class="summary-stat">
              <div class="summary-label">Avg Accuracy</div>
              <div class="summary-value">${analytics.length > 0 ? (analytics.reduce((sum, a) => sum + a.overallAccuracy, 0) / analytics.length).toFixed(1) : 0}%</div>
            </div>
          </div>

          <div class="analytics-profiles">
            ${analytics.map(stat => this.renderProfileCard(stat)).join('')}
          </div>
        `}

        <div class="analytics-footer">
          <button class="btn btn-secondary" onclick="Game.showProfileSelection()">Back to Profiles</button>
        </div>
      </div>
    `;
  },

  /**
   * Render individual profile card
   */
  renderProfileCard(stats) {
    return `
      <div class="analytics-profile-card">
        <div class="profile-card-header">
          <h3 class="clickable" onclick="Analytics.showProfileDetail('${stats.profileName}')">${stats.profileName}</h3>
          <div class="profile-card-actions">
            <div class="profile-card-level">Level ${stats.level}</div>
            <button class="btn-delete" onclick="Analytics.deleteProfile('${stats.profileName}')" title="Delete profile">×</button>
          </div>
        </div>
        
        <div class="profile-card-stats">
          <div class="card-stat">
            <div class="card-stat-label">Total Questions</div>
            <div class="card-stat-value">${stats.totalQuestions}</div>
          </div>
          <div class="card-stat">
            <div class="card-stat-label">Correct</div>
            <div class="card-stat-value correct">${stats.totalCorrect}</div>
          </div>
          <div class="card-stat">
            <div class="card-stat-label">Wrong</div>
            <div class="card-stat-value wrong">${stats.totalWrong}</div>
          </div>
          <div class="card-stat">
            <div class="card-stat-label">Accuracy</div>
            <div class="card-stat-value">${stats.overallAccuracy}%</div>
          </div>
        </div>

        ${stats.problemStats.length > 0 ? `
          <div class="profile-card-details">
            <div class="details-header">Top 5 Incorrect Problems</div>
            <div class="multiplication-list">
              ${stats.problemStats.slice(0, 5).map(ps => `
                <div class="multiplication-item">
                  <span class="multiplication-key">${ps.problem}</span>
                  <span class="multiplication-stats">
                    ${ps.correct}/${ps.total} (${ps.accuracy}%)
                  </span>
                </div>
              `).join('')}
            </div>
            <div class="check-errors-button">
              <button class="btn btn-primary" onclick="Analytics.showErrorList('${stats.profileName}')">
                Check Errors
              </button>
            </div>
          </div>
        ` : ''}

        <div class="profile-card-footer">
          <small>Last played: ${new Date(stats.lastPlayed).toLocaleDateString()}</small>
        </div>
      </div>
    `;
  },

  /**
   * Show detailed profile view
   */
  showProfileDetail(profileName) {
    const profile = Storage.getProfile(profileName);
    if (!profile) return;

    const stats = this.calculateProfileStats(profileName, profile);
    const sessions = profile.sessions || [];
    const quizzes = profile.quizzes || [];

    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div class="profile-detail-screen">
        <h2>${profileName} - Detailed View</h2>
        
        <div class="detail-summary">
          <div class="detail-stat">
            <div class="detail-label">Total Sessions</div>
            <div class="detail-value">${sessions.length}</div>
          </div>
          <div class="detail-stat">
            <div class="detail-label">Total Quizzes</div>
            <div class="detail-value">${quizzes.length}</div>
          </div>
          <div class="detail-stat">
            <div class="detail-label">Current Level</div>
            <div class="detail-value">${stats.level}</div>
          </div>
          <div class="detail-stat">
            <div class="detail-label">Overall Accuracy</div>
            <div class="detail-value">${stats.overallAccuracy}%</div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Sessions</h3>
          ${sessions.length === 0 ? `
            <p class="empty-message">No sessions recorded yet.</p>
          ` : `
            <div class="sessions-list">
              ${sessions.map((session, index) => {
                const startTime = new Date(session.startTime);
                const endTime = session.endTime ? new Date(session.endTime) : null;
                const duration = endTime ? Math.round((endTime - startTime) / 1000 / 60) : 'In Progress';
                return `
                  <div class="session-item">
                    <div class="session-header">
                      <span class="session-number">Session ${sessions.length - index}</span>
                      <span class="session-date">${startTime.toLocaleString()}</span>
                    </div>
                    <div class="session-info">
                      <span>Duration: ${duration} ${endTime ? 'minutes' : ''}</span>
                      <span>Quizzes: ${session.quizzes ? session.quizzes.length : 0}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="detail-section">
          <h3>Accuracy Evolution</h3>
          ${quizzes.length === 0 ? `
            <p class="empty-message">No data available yet.</p>
          ` : `
            ${this.renderAccuracyChart(quizzes, profileName)}
          `}
        </div>

        <div class="detail-section">
          <h3>Quizzes</h3>
          ${quizzes.length === 0 ? `
            <p class="empty-message">No quizzes recorded yet.</p>
          ` : `
            <div class="quizzes-list">
              ${quizzes.slice().reverse().map((quiz, index) => {
                const startTime = new Date(quiz.startTime);
                const endTime = quiz.endTime ? new Date(quiz.endTime) : null;
                const duration = endTime ? Math.round((endTime - startTime) / 1000) : 'In Progress';
                return `
                  <div class="quiz-item ${quiz.passed ? 'passed' : 'failed'}">
                    <div class="quiz-header">
                      <span class="quiz-level">Level ${quiz.level}</span>
                      <span class="quiz-status">${quiz.passed ? '✓ Passed' : '✗ Failed'}</span>
                    </div>
                    <div class="quiz-info">
                      <span>Score: ${quiz.correctCount || 0}/${quiz.totalQuestions || 0}</span>
                      <span>Date: ${startTime.toLocaleString()}</span>
                      <span>Duration: ${duration}s</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="detail-footer">
          <button class="btn btn-secondary" onclick="Game.showAnalytics()">Back to Analytics</button>
        </div>
      </div>
    `;
  },

  /**
   * Show error list for addition and subtraction problems
   */
  showErrorList(profileName) {
    const profile = Storage.getProfile(profileName);
    if (!profile) return;

    const stats = profile.stats || {};
    
    // Get all problems with stats
    const problemList = [];
    Object.keys(stats).forEach(key => {
      const stat = stats[key];
      const total = (stat.correct || 0) + (stat.wrong || 0);
      if (total > 0) {
        const errorRate = total > 0 ? (stat.wrong / total) : 0;
        const accuracy = total > 0 ? ((stat.correct / total) * 100).toFixed(1) : 0;
        problemList.push({
          key,
          correct: stat.correct || 0,
          wrong: stat.wrong || 0,
          total,
          errorRate,
          accuracy: parseFloat(accuracy)
        });
      }
    });

    // Sort by error rate (highest first), then by total attempts
    problemList.sort((a, b) => {
      if (b.errorRate !== a.errorRate) {
        return b.errorRate - a.errorRate;
      }
      return b.total - a.total;
    });

    // Separate by operation type
    const additions = problemList.filter(p => p.key.includes('+'));
    const subtractions = problemList.filter(p => p.key.includes('-'));

    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div class="error-matrix-screen">
        <h2>Error Distribution - ${profileName}</h2>
        <p class="matrix-description">Click any problem to see details. Color intensity shows error rate.</p>
        
        <div class="problem-list-container">
          <div class="problem-section">
            <h3>Addition Problems</h3>
            <div class="problem-grid">
              ${additions.length > 0 ? additions.map(problem => {
                const errorRate = problem.errorRate;
                const bgColor = errorRate > 0.5 ? `rgba(244, 67, 54, ${0.3 + errorRate * 0.7})` : 
                                errorRate > 0 ? `rgba(255, 152, 0, ${0.2 + errorRate * 0.5})` : 
                                'rgba(76, 175, 80, 0.3)';
                const textColor = errorRate > 0.5 ? 'white' : '#333';
                
                return `
                  <div class="problem-cell clickable" 
                       style="background: ${bgColor}; color: ${textColor};"
                       onclick="Analytics.showCellDetail('${profileName}', '${problem.key}', ${problem.correct}, ${problem.wrong}, ${problem.total})"
                       title="${problem.key}: ${problem.wrong} wrong, ${problem.correct} correct">
                    <div class="cell-content">
                      <div class="cell-multiplication">${problem.key}</div>
                      <div class="cell-stats">${problem.wrong}/${problem.total}</div>
                      <div class="cell-accuracy">${problem.accuracy}%</div>
                    </div>
                  </div>
                `;
              }).join('') : '<p class="empty-message">No addition problems attempted yet.</p>'}
            </div>
          </div>

          <div class="problem-section">
            <h3>Subtraction Problems</h3>
            <div class="problem-grid">
              ${subtractions.length > 0 ? subtractions.map(problem => {
                const errorRate = problem.errorRate;
                const bgColor = errorRate > 0.5 ? `rgba(244, 67, 54, ${0.3 + errorRate * 0.7})` : 
                                errorRate > 0 ? `rgba(255, 152, 0, ${0.2 + errorRate * 0.5})` : 
                                'rgba(76, 175, 80, 0.3)';
                const textColor = errorRate > 0.5 ? 'white' : '#333';
                
                return `
                  <div class="problem-cell clickable" 
                       style="background: ${bgColor}; color: ${textColor};"
                       onclick="Analytics.showCellDetail('${profileName}', '${problem.key}', ${problem.correct}, ${problem.wrong}, ${problem.total})"
                       title="${problem.key}: ${problem.wrong} wrong, ${problem.correct} correct">
                    <div class="cell-content">
                      <div class="cell-multiplication">${problem.key}</div>
                      <div class="cell-stats">${problem.wrong}/${problem.total}</div>
                      <div class="cell-accuracy">${problem.accuracy}%</div>
                    </div>
                  </div>
                `;
              }).join('') : '<p class="empty-message">No subtraction problems attempted yet.</p>'}
            </div>
          </div>
        </div>

        <div class="matrix-legend">
          <div class="legend-item">
            <div class="legend-color" style="background: rgba(244, 67, 54, 0.8);"></div>
            <span>High Error Rate (&gt;50%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: rgba(255, 152, 0, 0.5);"></div>
            <span>Medium Error Rate (1-50%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: rgba(76, 175, 80, 0.3);"></div>
            <span>No Errors</span>
          </div>
        </div>

        <div class="detail-footer">
          <button class="btn btn-secondary" onclick="Game.showAnalytics()">Back to Analytics</button>
        </div>
      </div>
    `;
  },

  /**
   * Show cell detail popup
   */
  showCellDetail(profileName, problemKey, correct, wrong, total) {
    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
    
    // Create a simple modal/popup
    const modal = document.createElement('div');
    modal.className = 'cell-detail-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${problemKey}</h3>
        <div class="modal-stats">
          <div class="modal-stat">
            <span class="modal-label">Total Attempts:</span>
            <span class="modal-value">${total}</span>
          </div>
          <div class="modal-stat">
            <span class="modal-label">Correct:</span>
            <span class="modal-value correct">${correct}</span>
          </div>
          <div class="modal-stat">
            <span class="modal-label">Wrong:</span>
            <span class="modal-value wrong">${wrong}</span>
          </div>
          <div class="modal-stat">
            <span class="modal-label">Accuracy:</span>
            <span class="modal-value">${accuracy}%</span>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="this.closest('.cell-detail-modal').remove()">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  },

  /**
   * Delete a profile (admin only)
   */
  deleteProfile(profileName) {
    if (!confirm(`Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`)) {
      return;
    }

    Storage.deleteProfile(profileName);
    
    // Refresh analytics view
    const container = document.getElementById('game-container');
    this.render(container);
  },

  /**
   * Calculate accuracy evolution by day/week
   */
  calculateAccuracyEvolution(quizzes) {
    const byDay = {};
    const byWeek = {};

    quizzes.forEach(quiz => {
      if (!quiz.endTime) return; // Skip incomplete quizzes
      
      const date = new Date(quiz.startTime);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekKey = this.getWeekKey(date);
      
      const accuracy = quiz.totalQuestions > 0 
        ? ((quiz.correctCount || 0) / quiz.totalQuestions) * 100 
        : 0;

      // By day
      if (!byDay[dayKey]) {
        byDay[dayKey] = { correct: 0, total: 0, count: 0 };
      }
      byDay[dayKey].correct += quiz.correctCount || 0;
      byDay[dayKey].total += quiz.totalQuestions || 0;
      byDay[dayKey].count += 1;

      // By week
      if (!byWeek[weekKey]) {
        byWeek[weekKey] = { correct: 0, total: 0, count: 0 };
      }
      byWeek[weekKey].correct += quiz.correctCount || 0;
      byWeek[weekKey].total += quiz.totalQuestions || 0;
      byWeek[weekKey].count += 1;
    });

    // Convert to arrays and calculate accuracy
    const dayData = Object.keys(byDay)
      .sort()
      .map(day => ({
        date: day,
        label: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        accuracy: byDay[day].total > 0 ? ((byDay[day].correct / byDay[day].total) * 100).toFixed(1) : 0,
        quizzes: byDay[day].count
      }));

    const weekData = Object.keys(byWeek)
      .sort()
      .map(week => ({
        date: week,
        label: this.formatWeekLabel(week),
        accuracy: byWeek[week].total > 0 ? ((byWeek[week].correct / byWeek[week].total) * 100).toFixed(1) : 0,
        quizzes: byWeek[week].count
      }));

    return { byDay: dayData, byWeek: weekData };
  },

  /**
   * Get week key (YYYY-WW format)
   */
  getWeekKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = Math.ceil((((d - week1) / 86400000) + week1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  },

  /**
   * Format week label
   */
  formatWeekLabel(weekKey) {
    const [year, week] = weekKey.split('-W');
    const weekNum = parseInt(week);
    const date = new Date(year, 0, 1 + (weekNum - 1) * 7);
    return `Week ${weekNum}, ${date.toLocaleDateString('en-US', { month: 'short' })}`;
  },

  /**
   * Render accuracy chart
   */
  renderAccuracyChart(quizzes, profileName) {
    const evolution = this.calculateAccuracyEvolution(quizzes);
    const useWeeks = evolution.byWeek.length > 0 && evolution.byWeek.length <= 12;
    const data = useWeeks ? evolution.byWeek : evolution.byDay;
    
    if (data.length === 0) {
      return '<p class="empty-message">No data available yet.</p>';
    }

    const maxAccuracy = Math.max(...data.map(d => parseFloat(d.accuracy)), 100);
    const chartHeight = 200;

    return `
      <div class="accuracy-chart-container">
        <div class="chart-toggle">
          <button class="chart-toggle-btn ${!useWeeks ? 'active' : ''}" onclick="Analytics.showProfileDetailWithView('${profileName}', 'day')">By Day</button>
          <button class="chart-toggle-btn ${useWeeks ? 'active' : ''}" onclick="Analytics.showProfileDetailWithView('${profileName}', 'week')">By Week</button>
        </div>
        <div class="accuracy-chart" id="accuracy-chart">
          <div class="chart-bars">
            ${data.map((point, index) => {
              const height = (parseFloat(point.accuracy) / maxAccuracy) * chartHeight;
              return `
                <div class="chart-bar-item" style="flex: 1">
                  <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="height: ${height}px" title="${point.label}: ${point.accuracy}%">
                      <div class="chart-bar-value">${point.accuracy}%</div>
                    </div>
                  </div>
                  <div class="chart-label">${point.label}</div>
                  <div class="chart-quizzes">${point.quizzes} quiz${point.quizzes !== 1 ? 'zes' : ''}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Show profile detail with specific chart view
   */
  showProfileDetailWithView(profileName, view) {
    // Re-render with the selected view
    this.showProfileDetail(profileName);
  }
};

