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

    // ============================================
    // CARD RENDERING - STAGE-BASED UI
    // ============================================

    // Main router: determines which card type to render based on stage
    function renderDealCard(deal) {
        // Pre-onboarding stages (sales focus)
        const salesStages = ['qualified', 'cold-outreach', 'follow-up', 'discovery-scheduled', 'discovery-completed'];

        if (salesStages.includes(deal.stage)) {
            return renderSalesCard(deal);
        } else {
            // Onboarding+ stages (client focus)
            return renderClientCard(deal);
        }
    }

    // Sales Card: For pre-onboarding stages (Qualified → Discovery Completed)
    function renderSalesCard(deal) {
        const mrr = deal.mrr ? `$${deal.mrr.toLocaleString()}/mo` : '';
        const totalValue = deal.mrr && deal.contractLength ?
            `$${(deal.mrr * deal.contractLength).toLocaleString()}` : '';
        const daysInStage = getDaysInStage(deal);

        return `
            <div class="deal-card sales-card" data-deal-id="${deal.id}" onclick="viewDeal('${deal.id}')">
                <div class="deal-card-header">
                    <strong>${deal.companyName}</strong>
                    <span class="days-badge">${daysInStage}d</span>
                </div>
                <div class="deal-card-body">
                    ${deal.contactName ? `<p class="contact-name">👤 ${deal.contactName}</p>` : ''}
                    ${deal.email ? `<p class="contact-email">📧 ${deal.email}</p>` : ''}
                    ${deal.phone ? `<p class="contact-phone">📞 ${deal.phone}</p>` : ''}

                    <div class="deal-value-section">
                        ${mrr ? `<p class="deal-mrr">💰 ${mrr}</p>` : ''}
                        ${totalValue ? `<p class="deal-total">📊 ${totalValue} total</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Client Card: For onboarding+ stages (Onboarding Portal → Resell)
    function renderClientCard(deal) {
        const mrr = deal.mrr ? `$${deal.mrr.toLocaleString()}/mo` : '';
        const hasPortal = !!deal.clientPortalId;
        const daysInStage = getDaysInStage(deal);

        return `
            <div class="deal-card client-card" data-deal-id="${deal.id}">
                <div class="deal-card-header">
                    <strong>${deal.companyName}</strong>
                    <span class="days-badge">${daysInStage}d</span>
                </div>

                ${hasPortal ? `
                    <div class="portal-status">
                        <a href="client-portal.html?id=${deal.clientPortalId}"
                           class="portal-link-badge"
                           onclick="event.stopPropagation();">
                            🔗 Open Client Portal
                        </a>
                    </div>
                ` : `
                    <div class="portal-status portal-missing">
                        <div class="portal-missing-warning">⚠️ Portal Not Created</div>
                        <button class="create-portal-btn"
                                onclick="event.stopPropagation(); createPortalForDeal('${deal.id}');">
                            + Create Client Portal
                        </button>
                    </div>
                `}

                <div class="deal-card-body">
                    ${deal.contactName ? `<p class="contact-name-small">👤 ${deal.contactName}</p>` : ''}
                    ${mrr ? `<p class="deal-mrr-small">💰 ${mrr}</p>` : ''}

                    ${renderOnboardingProgress(deal)}
                </div>
            </div>
        `;
    }

    // Helper: Calculate days in current stage
    function getDaysInStage(deal) {
        if (!deal.lastUpdated) return 0;
        const lastUpdate = deal.lastUpdated.toDate ? deal.lastUpdated.toDate() : new Date(deal.lastUpdated);
        const today = new Date();
        const diffTime = Math.abs(today - lastUpdate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Helper: Render onboarding progress checklist
    function renderOnboardingProgress(deal) {
        if (deal.stage !== 'onboarding-portal') return '';

        const checklist = deal.onboardingChecklist || {};

        return `
            <div class="onboarding-progress">
                <p class="progress-item ${checklist.contractSigned ? 'completed' : ''}">
                    ${checklist.contractSigned ? '✅' : '⬜'} Contract Signed
                </p>
                <p class="progress-item ${checklist.setupInProgress ? 'completed' : ''}">
                    ${checklist.setupInProgress ? '✅' : '⬜'} Setup In Progress
                </p>
                <p class="progress-item ${checklist.campaignReady ? 'completed' : ''}">
                    ${checklist.campaignReady ? '✅' : '⬜'} Campaign Ready
                </p>
            </div>
        `;
    }

    // Create portal for deal
    window.createPortalForDeal = async function(dealId) {
        if (!confirm('Create a new client portal for this deal?')) return;

        try {
            // Get deal data
            const dealDoc = await db.collection('deals').doc(dealId).get();
            if (!dealDoc.exists) {
                alert('Deal not found');
                return;
            }

            const dealData = dealDoc.data();

            // Create new client portal
            const portalData = {
                companyName: dealData.companyName,
                contactName: dealData.contactName || '',
                email: dealData.email || '',
                phone: dealData.phone || '',
                status: 'onboarding',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: currentRepId,
                dealId: dealId
            };

            const portalRef = await db.collection('clientPortals').add(portalData);

            // Link portal to deal
            await db.collection('deals').doc(dealId).update({
                clientPortalId: portalRef.id,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Client portal created successfully!');

            // Reload pipeline to show updated card
            loadMyPipeline();

        } catch (error) {
            console.error('Error creating portal:', error);
            alert('Error creating portal. Please try again.');
        }
    };

    window.viewDeal = async function(dealId) {
        try {
            const dealDoc = await db.collection('deals').doc(dealId).get();
            if (!dealDoc.exists) {
                alert('Deal not found');
                return;
            }

            const deal = { id: dealDoc.id, ...dealDoc.data() };
            showDealDetailModal(deal);
        } catch (error) {
            console.error('Error loading deal details:', error);
            alert('Error loading deal details');
        }
    };

    function showDealDetailModal(deal) {
        const mrr = deal.mrr ? `$${deal.mrr.toLocaleString()}/mo` : 'Not set';
        const totalValue = deal.mrr && deal.contractLength ?
            `$${(deal.mrr * deal.contractLength).toLocaleString()}` : 'Not calculated';
        const createdDate = deal.createdAt ? formatDate(deal.createdAt.toDate().toISOString().split('T')[0]) : 'Unknown';
        const updatedDate = deal.lastUpdated ? formatDate(deal.lastUpdated.toDate().toISOString().split('T')[0]) : 'Unknown';
        const daysInStage = getDaysInStage(deal);

        const modalHtml = `
            <div class="modal-overlay" onclick="closeDealModal()">
                <div class="modal-content deal-detail-modal" onclick="event.stopPropagation();">
                    <div class="modal-header">
                        <h2>${deal.companyName}</h2>
                        <button class="modal-close-btn" onclick="closeDealModal()">×</button>
                    </div>

                    <div class="modal-body">
                        <!-- Stage Info -->
                        <div class="detail-section">
                            <h3>Pipeline Status</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Current Stage:</span>
                                    <span class="detail-value">${formatStageName(deal.stage)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Days in Stage:</span>
                                    <span class="detail-value">${daysInStage} days</span>
                                </div>
                            </div>
                        </div>

                        <!-- Contact Info -->
                        <div class="detail-section">
                            <h3>Contact Information</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Contact Name:</span>
                                    <span class="detail-value">${deal.contactName || 'Not provided'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Email:</span>
                                    <span class="detail-value">${deal.email || 'Not provided'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Phone:</span>
                                    <span class="detail-value">${deal.phone || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Deal Value -->
                        <div class="detail-section">
                            <h3>Deal Value</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">MRR:</span>
                                    <span class="detail-value" style="color: #05908C; font-weight: 600;">${mrr}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Contract Length:</span>
                                    <span class="detail-value">${deal.contractLength ? deal.contractLength + ' months' : 'Not set'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Total Value:</span>
                                    <span class="detail-value" style="color: #05908C; font-weight: 600;">${totalValue}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Portal Link -->
                        ${deal.clientPortalId ? `
                            <div class="detail-section">
                                <h3>Client Portal</h3>
                                <a href="client-portal.html?id=${deal.clientPortalId}" class="portal-link-btn" target="_blank">
                                    🔗 Open Client Portal
                                </a>
                            </div>
                        ` : ''}

                        <!-- Timestamps -->
                        <div class="detail-section">
                            <h3>Timeline</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Created:</span>
                                    <span class="detail-value">${createdDate}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Last Updated:</span>
                                    <span class="detail-value">${updatedDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeDealModal()">Close</button>
                        <button class="btn btn-primary" onclick="editDeal('${deal.id}')">Edit Deal</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        const modalContainer = document.createElement('div');
        modalContainer.id = 'dealDetailModalContainer';
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    window.closeDealModal = function() {
        const modal = document.getElementById('dealDetailModalContainer');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    };

    window.editDeal = function(dealId) {
        closeDealModal();
        alert(`Edit deal functionality - Coming soon for deal ${dealId}`);
        // This will be implemented later
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
