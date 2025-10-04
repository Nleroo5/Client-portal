// Sales CRM Functions
// This file contains all the JavaScript logic for the Sales Rep Dashboard

(function() {
    'use strict';

    // ============================================
    // GLOBAL VARIABLES
    // ============================================
    let currentRepId = null;
    let currentRepData = null;
    let myDeals = [];
    let teamDeals = [];
    let myScorecard = null;
    let teamScorecard = [];
    let myTasks = [];

    // ============================================
    // INITIALIZATION
    // ============================================

    // Get current rep session data
    function getCurrentRep() {
        currentRepId = sessionStorage.getItem('repId');
        if (!currentRepId) {
            window.location.href = 'sales.html';
            return null;
        }
        return currentRepId;
    }

    // Load rep data from Firebase
    async function loadRepData() {
        try {
            const doc = await db.collection('salesReps').doc(currentRepId).get();
            if (doc.exists) {
                currentRepData = doc.data();
                return currentRepData;
            } else {
                alert('Rep data not found. Please contact admin.');
                logout();
                return null;
            }
        } catch (error) {
            console.error('Error loading rep data:', error);
            return null;
        }
    }

    // ============================================
    // MY PIPELINE TAB
    // ============================================

    window.loadMyPipeline = async function() {
        if (!getCurrentRep()) return;

        const pipelineBoard = document.getElementById('pipelineBoard');
        pipelineBoard.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading your pipeline...</p></div>';

        try {
            // Load deals where assignedTo matches current rep
            const snapshot = await db.collection('deals')
                .where('assignedTo', '==', currentRepId)
                .get();

            myDeals = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Filter out archived deals (completed and closed-lost)
                if (data.stage !== 'completed' && data.stage !== 'closed-lost') {
                    myDeals.push({ id: doc.id, ...data });
                }
            });

            // Render pipeline board
            renderPipelineBoard(myDeals);
        } catch (error) {
            console.error('Error loading pipeline:', error);
            pipelineBoard.innerHTML = '<div class="loading-state"><p style="color: #d32f2f;">Error loading pipeline. Please refresh.</p></div>';
        }
    };

    function renderPipelineBoard(deals) {
        const pipelineBoard = document.getElementById('pipelineBoard');

        // Define pipeline stages
        const stages = [
            { id: 'qualified', name: 'Qualified', color: '#85C7B3' },
            { id: 'cold-outreach', name: 'Cold Outreach', color: '#05908C' },
            { id: 'follow-up', name: 'Follow-Up', color: '#47a5a3' },
            { id: 'discovery-scheduled', name: 'Discovery Scheduled', color: '#F2A922' },
            { id: 'discovery-completed', name: 'Discovery Completed', color: '#e09819' },
            { id: 'onboarding-portal', name: 'Onboarding Portal', color: '#85C7B3' },
            { id: 'campaign-live', name: 'Campaign Live', color: '#22c55e' },
            { id: 'follow-up-resell', name: 'Follow-Up & Resell', color: '#05908C' }
        ];

        // Group deals by stage
        const dealsByStage = {};
        stages.forEach(stage => {
            dealsByStage[stage.id] = deals.filter(deal => deal.stage === stage.id);
        });

        // Build HTML for pipeline columns
        let html = '';
        stages.forEach(stage => {
            const stageDeals = dealsByStage[stage.id] || [];
            html += `
                <div class="pipeline-column">
                    <div class="column-header" style="border-left: 4px solid ${stage.color};">
                        <h3>${stage.name}</h3>
                        <span class="deal-count">${stageDeals.length}</span>
                    </div>
                    <div class="column-body">
                        ${stageDeals.length === 0 ?
                            '<p class="no-deals">No deals in this stage</p>' :
                            stageDeals.map(deal => renderDealCard(deal)).join('')
                        }
                    </div>
                </div>
            `;
        });

        pipelineBoard.innerHTML = html;
    }

    function renderDealCard(deal) {
        const mrr = deal.mrr ? `$${deal.mrr.toLocaleString()}/mo` : '';
        const totalValue = deal.mrr && deal.contractLength ? `$${(deal.mrr * deal.contractLength).toLocaleString()}` : '';

        return `
            <div class="deal-card" data-deal-id="${deal.id}" onclick="viewDeal('${deal.id}')">
                <div class="deal-card-header">
                    <strong>${deal.companyName}</strong>
                    ${deal.clientPortalId ? '<span class="deal-badge portal-linked">🔗 Portal</span>' : ''}
                </div>
                <div class="deal-card-body">
                    ${deal.contactName ? `<p class="deal-contact">👤 ${deal.contactName}</p>` : ''}
                    ${mrr ? `<p class="deal-mrr" style="color: #05908C; font-weight: 600;">${mrr}</p>` : ''}
                    ${totalValue ? `<p class="deal-total" style="color: #999; font-size: 0.85rem;">${totalValue} total</p>` : ''}
                </div>
            </div>
        `;
    }

    window.viewDeal = function(dealId) {
        alert(`Deal details for ${dealId} - Coming soon!`);
    };

    // ============================================
    // MY SCORECARD TAB
    // ============================================

    window.loadMyScorecard = async function() {
        if (!getCurrentRep()) return;

        const tbody = document.getElementById('scorecardTableBody');
        tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">Loading scorecard...</td></tr>';

        try {
            // Get current week start date
            const weekStart = getWeekStartDate();

            // Load rep data to get targets
            if (!currentRepData) {
                await loadRepData();
            }

            // Load scorecard data for current week
            const snapshot = await db.collection('scorecard')
                .where('repId', '==', currentRepId)
                .where('weekStartDate', '==', weekStart)
                .limit(1)
                .get();

            let scorecardData;
            if (!snapshot.empty) {
                scorecardData = snapshot.docs[0].data();
            } else {
                // No scorecard for this week yet, create default
                scorecardData = {
                    discoveryCallsScheduled: 0,
                    discoveryCallsCompleted: 0,
                    dealsOnboarding: 0,
                    dealsLive: 0
                };
            }

            // Render scorecard
            renderScorecard(scorecardData);
        } catch (error) {
            console.error('Error loading scorecard:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell" style="color: #d32f2f;">Error loading scorecard</td></tr>';
        }
    };

    function renderScorecard(data) {
        const tbody = document.getElementById('scorecardTableBody');
        const targets = currentRepData.weeklyTargets || {
            discoveryCallsScheduled: 1,
            discoveryCallsCompleted: 1,
            dealsOnboarding: 1,
            dealsLive: 1
        };

        const metrics = [
            { name: 'Discovery Calls Scheduled', target: targets.discoveryCallsScheduled, actual: data.discoveryCallsScheduled || 0 },
            { name: 'Discovery Calls Completed', target: targets.discoveryCallsCompleted, actual: data.discoveryCallsCompleted || 0 },
            { name: 'Deals to Onboarding', target: targets.dealsOnboarding, actual: data.dealsOnboarding || 0 },
            { name: 'Deals Gone Live', target: targets.dealsLive, actual: data.dealsLive || 0 }
        ];

        tbody.innerHTML = metrics.map(metric => `
            <tr>
                <td>${metric.name}</td>
                <td>${metric.target}</td>
                <td>${metric.actual}</td>
                <td>${metric.actual >= metric.target ? '✅' : '❌'}</td>
            </tr>
        `).join('');
    }

    // ============================================
    // TEAM TAB
    // ============================================

    window.loadTeamData = async function() {
        const tbody = document.getElementById('teamLeaderboardBody');
        tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading team data...</td></tr>';

        try {
            // Get current week start date
            const weekStart = getWeekStartDate();
            document.getElementById('weekIndicator').textContent = `Week of ${formatDate(weekStart)}`;

            // Load all active reps
            const repsSnapshot = await db.collection('salesReps')
                .where('active', '==', true)
                .orderBy('name')
                .get();

            const teamData = [];

            for (const repDoc of repsSnapshot.docs) {
                const repData = repDoc.data();

                // Load scorecard for this rep for current week
                const scorecardSnapshot = await db.collection('scorecard')
                    .where('repId', '==', repDoc.id)
                    .where('weekStartDate', '==', weekStart)
                    .limit(1)
                    .get();

                let scorecard = {
                    discoveryCallsScheduled: 0,
                    discoveryCallsCompleted: 0,
                    dealsOnboarding: 0,
                    dealsLive: 0
                };

                if (!scorecardSnapshot.empty) {
                    const data = scorecardSnapshot.docs[0].data();
                    scorecard = {
                        discoveryCallsScheduled: data.discoveryCallsScheduled || 0,
                        discoveryCallsCompleted: data.discoveryCallsCompleted || 0,
                        dealsOnboarding: data.dealsOnboarding || 0,
                        dealsLive: data.dealsLive || 0
                    };
                }

                teamData.push({
                    repId: repDoc.id,
                    name: repData.name,
                    targets: repData.weeklyTargets || {},
                    ...scorecard
                });
            }

            // Render team leaderboard
            renderTeamLeaderboard(teamData);

            // Load team pipeline stats
            loadTeamPipelineStats();
        } catch (error) {
            console.error('Error loading team data:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="loading-cell" style="color: #d32f2f;">Error loading team data</td></tr>';
        }
    };

    function renderTeamLeaderboard(teamData) {
        const tbody = document.getElementById('teamLeaderboardBody');

        // Sort by total activity (sum of all metrics)
        teamData.sort((a, b) => {
            const aTotal = a.discoveryCallsScheduled + a.discoveryCallsCompleted + a.dealsOnboarding + a.dealsLive;
            const bTotal = b.discoveryCallsScheduled + b.discoveryCallsCompleted + b.dealsOnboarding + b.dealsLive;
            return bTotal - aTotal;
        });

        tbody.innerHTML = teamData.map((rep, index) => {
            const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const isCurrentRep = rep.repId === currentRepId;

            return `
                <tr ${isCurrentRep ? 'style="background: rgba(5, 144, 140, 0.1); font-weight: 600;"' : ''}>
                    <td>${rank} ${rep.name}${isCurrentRep ? ' (You)' : ''}</td>
                    <td>${rep.discoveryCallsScheduled}/${rep.targets.discoveryCallsScheduled || 1}</td>
                    <td>${rep.discoveryCallsCompleted}/${rep.targets.discoveryCallsCompleted || 1}</td>
                    <td>${rep.dealsOnboarding}/${rep.targets.dealsOnboarding || 1}</td>
                    <td>${rep.dealsLive}/${rep.targets.dealsLive || 1}</td>
                </tr>
            `;
        }).join('');
    }

    async function loadTeamPipelineStats() {
        try {
            // Load all active deals (not completed or closed-lost)
            const snapshot = await db.collection('deals').get();

            // Get all active reps to map IDs to names
            const repsSnapshot = await db.collection('salesReps')
                .where('active', '==', true)
                .get();

            const repNames = {};
            repsSnapshot.forEach(doc => {
                repNames[doc.id] = doc.data().name;
            });

            const dealsByRep = {};
            snapshot.forEach(doc => {
                const deal = doc.data();
                // Filter out archived stages
                if (deal.stage !== 'completed' && deal.stage !== 'closed-lost') {
                    const repName = repNames[deal.assignedTo] || 'Unassigned';
                    if (!dealsByRep[repName]) {
                        dealsByRep[repName] = [];
                    }
                    dealsByRep[repName].push(deal);
                }
            });

            // Render stats
            const statsDiv = document.getElementById('teamPipelineStats');

            if (Object.keys(dealsByRep).length === 0) {
                statsDiv.innerHTML = '<p class="no-data">No active deals in the pipeline yet</p>';
                return;
            }

            let html = '<div class="team-stats-grid">';

            for (const [repName, deals] of Object.entries(dealsByRep)) {
                const stageBreakdown = {};
                deals.forEach(deal => {
                    stageBreakdown[deal.stage] = (stageBreakdown[deal.stage] || 0) + 1;
                });

                html += `
                    <div class="rep-stat-card">
                        <strong>${repName}</strong>: ${deals.length} deals
                        <p class="stat-breakdown">${Object.entries(stageBreakdown).map(([stage, count]) =>
                            `${count} in ${formatStageName(stage)}`
                        ).join(', ')}</p>
                    </div>
                `;
            }

            html += '</div>';
            statsDiv.innerHTML = html;
        } catch (error) {
            console.error('Error loading team pipeline stats:', error);
            document.getElementById('teamPipelineStats').innerHTML = '<p class="no-data" style="color: #d32f2f;">Error loading pipeline stats</p>';
        }
    }

    // ============================================
    // MY TASKS TAB
    // ============================================

    window.loadMyTasks = async function() {
        if (!getCurrentRep()) return;

        try {
            // Load tasks for current rep
            const snapshot = await db.collection('tasks')
                .where('ownerId', '==', currentRepId)
                .where('completed', '==', false)
                .orderBy('dueDate')
                .get();

            myTasks = [];
            snapshot.forEach(doc => {
                myTasks.push({ id: doc.id, ...doc.data() });
            });

            // Categorize tasks
            const today = new Date().toISOString().split('T')[0];
            const overdue = myTasks.filter(task => task.dueDate < today);
            const dueToday = myTasks.filter(task => task.dueDate === today);
            const upcoming = myTasks.filter(task => task.dueDate > today);

            // Render tasks
            renderTasks('overdueTasks', overdue, 'overdueCount');
            renderTasks('dueTodayTasks', dueToday, 'dueTodayCount');
            renderTasks('upcomingTasks', upcoming, 'upcomingCount');
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    function renderTasks(containerId, tasks, countId) {
        const container = document.getElementById(containerId);
        const countSpan = document.getElementById(countId);

        countSpan.textContent = tasks.length;

        if (tasks.length === 0) {
            container.innerHTML = '<p class="no-data">No tasks</p>';
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-item">
                <div class="task-checkbox">
                    <input type="checkbox" onchange="completeTask('${task.id}')">
                </div>
                <div class="task-details">
                    <p class="task-title">${task.title}</p>
                    <p class="task-meta">Due: ${formatDate(task.dueDate)}</p>
                </div>
            </div>
        `).join('');
    }

    window.completeTask = async function(taskId) {
        if (confirm('Mark this task as complete?')) {
            try {
                await db.collection('tasks').doc(taskId).update({
                    completed: true,
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                loadMyTasks(); // Reload tasks
            } catch (error) {
                console.error('Error completing task:', error);
                alert('Error completing task. Please try again.');
            }
        }
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    function getWeekStartDate() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        return monday.toISOString().split('T')[0];
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatStageName(stageId) {
        const stageNames = {
            'qualified': 'Qualified',
            'cold-outreach': 'Cold Outreach',
            'follow-up': 'Follow-Up',
            'discovery-scheduled': 'Discovery Scheduled',
            'discovery-completed': 'Discovery Completed',
            'onboarding-portal': 'Onboarding',
            'campaign-live': 'Live',
            'follow-up-resell': 'Resell'
        };
        return stageNames[stageId] || stageId;
    }

})();
