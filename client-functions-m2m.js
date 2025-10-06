(function() {
    // Portal State - Month-to-Month Version
    let portalState = {
        "1": false,
        "2": false,
        "3": false,
        "4": false,
        "5": false,
        "creativeLink": null,
        "googleDriveLink": null,
        "invoiceLink": null,
        "docuSignLinks": {
            "serviceAgreement": null,
            "dpa": null
        }
    };

    // Load state from Firebase
    async function loadState() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('c');

        // Hide loading screen function
        const hideLoading = () => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        };

        if (!clientId) {
            document.body.innerHTML = '<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Invalid Access</h1><p style="font-size: 1.1rem;">Please use the link provided by Drive Lead Media.</p><p style="margin-top: 20px; color: #05908C;">Contact: Nicolas@driveleadmedia.com</p></div></div>';
            return;
        }

        try {
            const doc = await db.collection('clients').doc(clientId).get();

            if (!doc.exists) {
                document.body.innerHTML = '<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Portal Not Found</h1><p style="font-size: 1.1rem;">Please contact Drive Lead Media for assistance.</p><p style="margin-top: 20px; color: #05908C;">Contact: Nicolas@driveleadmedia.com</p></div></div>';
                return;
            }

            const data = doc.data();

            if (!data.active) {
                document.body.innerHTML = '<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Portal Inactive</h1><p style="font-size: 1.1rem;">This portal is currently inactive. Please contact Drive Lead Media.</p><p style="margin-top: 20px; color: #05908C;">Contact: Nicolas@driveleadmedia.com</p></div></div>';
                return;
            }

            // Load client name if available
            if (data.clientName) {
                const hero = document.querySelector('.hero h1');
                if (hero) {
                    hero.textContent = `Welcome, ${data.clientName}!`;
                }
            }

            // Load progress from Firebase
            portalState['1'] = data.step1Complete || false;
            portalState['2'] = data.step2Complete || false;
            portalState['3'] = data.step3Complete || false;
            portalState['4'] = data.step4Complete || false;
            portalState['5'] = data.step5Complete || false;

            // Load custom DocuSign links
            if (data.dpaLink) {
                portalState.docuSignLinks.dpa = data.dpaLink;
                const dpaBtn = document.getElementById('dpaBtn');
                if (dpaBtn) dpaBtn.href = data.dpaLink;
            }

            if (data.serviceAgreementLink) {
                portalState.docuSignLinks.serviceAgreement = data.serviceAgreementLink;
                const serviceBtn = document.getElementById('serviceAgreementBtn');
                if (serviceBtn) serviceBtn.href = data.serviceAgreementLink;
            }

            // Load invoice link
            if (data.invoiceLink) {
                portalState.invoiceLink = data.invoiceLink;
                const invoiceBtn = document.getElementById('invoiceBtn');
                if (invoiceBtn) invoiceBtn.href = data.invoiceLink;
            }

            // Load Google Drive link
            if (data.googleDriveLink) {
                portalState.googleDriveLink = data.googleDriveLink;
                const uploadBtn = document.getElementById('uploadBtn');
                if (uploadBtn) uploadBtn.href = data.googleDriveLink;
            }

            // Load creative link
            if (data.creativeLink) {
                portalState.creativeLink = data.creativeLink;
                updateCreativeGallery(data.creativeLink);
            }

            // Store client ID for saving
            window.currentClientId = clientId;

            // Hide loading screen after successful load
            hideLoading();

        } catch (error) {
            console.error('Error loading:', error);
            document.body.innerHTML = '<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Loading Error</h1><p style="font-size: 1.1rem;">Please refresh the page or contact support.</p><p style="margin-top: 20px; color: #05908C;">Contact: Nicolas@driveleadmedia.com</p></div></div>';
        }
    }

    // Save state to Firebase
    async function saveState() {
        if (!window.currentClientId) return;

        try {
            await db.collection('clients').doc(window.currentClientId).update({
                step1Complete: portalState['1'],
                step2Complete: portalState['2'],
                step3Complete: portalState['3'],
                step4Complete: portalState['4'],
                step5Complete: portalState['5'],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving:', error);
        }
    }

    // Update Progress Bar
    function updateProgressBar() {
        const completedSteps = Object.keys(portalState)
            .filter(key => !isNaN(key) && portalState[key]).length;
        const totalSteps = 5;
        const percentage = Math.round((completedSteps / totalSteps) * 100);

        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        const percent = document.getElementById('progressPercent');

        if (fill) fill.style.width = percentage + '%';
        if (text) text.textContent = `${completedSteps} of ${totalSteps} steps completed`;
        if (percent) percent.textContent = percentage + '%';

        return { completedSteps, percentage };
    }

    // Update Floating Sidebar
    function updateFloatingSidebar() {
        const { completedSteps, percentage } = updateProgressBar();

        // Update progress rectangle
        const progressContainer = document.querySelector('.progress-percentage-circle');
        if (progressContainer) {
            progressContainer.style.setProperty('--progress-width', percentage + '%');
        }

        // Update percentage text
        const percentText = document.getElementById('sidebarProgressPercent');
        if (percentText) percentText.textContent = percentage + '%';

        // Update dynamic message
        const msg = document.getElementById('sidebarProgressMessage');
        if (msg) {
            if (percentage === 0) msg.textContent = "Let's get started";
            else if (percentage === 20) msg.textContent = "Great beginning";
            else if (percentage === 40) msg.textContent = "Making progress";
            else if (percentage === 60) msg.textContent = "Over halfway";
            else if (percentage === 80) msg.textContent = "Almost there";
            else if (percentage === 100) msg.textContent = "Launch ready";
        }

        // Update step bubbles
        for (let i = 1; i <= 5; i++) {
            const bubble = document.getElementById(`sidebarBubble${i}`);
            if (bubble) {
                const wasCompleted = bubble.classList.contains('completed');
                bubble.className = 'sidebar-step-bubble upcoming';
                if (portalState[i.toString()]) {
                    bubble.className = 'sidebar-step-bubble completed';
                    // Trigger confetti if newly completed
                    if (!wasCompleted) {
                        createConfetti(bubble);
                    }
                } else if (i === 1 || portalState[(i - 1).toString()]) {
                    if (!portalState[i.toString()]) {
                        bubble.className = 'sidebar-step-bubble current';
                    }
                }
            }
        }
    }

    // Create confetti celebration effect
    function createConfetti(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 12; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-particle';
            confetti.style.position = 'fixed';
            confetti.style.left = centerX + 'px';
            confetti.style.top = centerY + 'px';
            confetti.style.background = ['#F2A922', '#85C7B3', '#05908C', '#EEF4D9'][Math.floor(Math.random() * 4)];

            const angle = (Math.PI * 2 * i) / 12;
            const velocity = 50 + Math.random() * 50;
            confetti.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
            confetti.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 1000);
        }
    }

    // Update Step States
    function updateStepStates() {
        for (let i = 1; i <= 5; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                const isCompleted = portalState[i.toString()];
                const isUnlocked = i === 1 || portalState[(i - 1).toString()];

                step.classList.toggle('completed', isCompleted);
                step.classList.toggle('locked', !isUnlocked);

                const btn = step.querySelector('.btn-complete');
                if (btn) {
                    btn.textContent = isCompleted ? `✓ Step ${i} Completed` : `Mark Step ${i} Complete`;
                    if (isCompleted) btn.setAttribute('disabled', 'true');
                    else btn.removeAttribute('disabled');
                }
            }
        }
        updateFloatingSidebar();
    }

    // Mark Step Complete
    function markStepComplete(stepNum) {
        portalState[stepNum.toString()] = true;
        saveState();

        // Add completing animation to button
        const step = document.getElementById(`step${stepNum}`);
        const btn = step?.querySelector('.btn-complete');
        if (btn) {
            btn.classList.add('completing');
            setTimeout(() => btn.classList.remove('completing'), 600);
        }

        // Add green flash effect to step
        if (step) {
            step.style.transition = 'none';
            step.style.boxShadow = '0 0 0 rgba(34, 197, 94, 0)';
            setTimeout(() => {
                step.style.transition = 'all 0.8s ease';
                step.style.boxShadow = '0 0 50px rgba(34, 197, 94, 0.8)';
                setTimeout(() => {
                    updateStepStates();
                }, 200);
            }, 10);
        } else {
            updateStepStates();
        }

        // Check if all complete
        const allComplete = [1,2,3,4,5].every(n => portalState[n.toString()]);
        if (allComplete) {
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                setTimeout(() => {
                    successMsg.style.display = 'block';
                    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 1000);
            }
        }
    }

    // Update Creative Gallery
    function updateCreativeGallery(link) {
        const gallery = document.getElementById('galleryPlaceholder');
        if (gallery) {
            if (link) {
                gallery.innerHTML = `
                    <p style="color: #012E40; margin-bottom: 15px; font-weight: 600;">
                        🎨 Your Creative Previews Are Ready!
                    </p>
                    <a href="${link}" class="btn" target="_blank" rel="noopener">
                        View Creative Previews
                    </a>
                `;
            } else {
                gallery.innerHTML = `
                    <p>Creative previews will be shared via secure link</p>
                    <p style="font-size: 0.9rem; color: #85C7B3; margin-top: 10px;">
                        Links will be provided once creatives are ready for review
                    </p>
                `;
            }
        }
    }

    // Toggle Brand Kit Info
    function toggleBrandKitInfo() {
        const infoBox = document.getElementById('brandKitInfo');
        if (infoBox) {
            const isVisible = infoBox.style.display === 'block';
            infoBox.style.display = isVisible ? 'none' : 'block';
        }
    }

    // Toggle GA4 Info
    function toggleGA4Info() {
        const infoBox = document.getElementById('ga4Info');
        if (infoBox) {
            const isVisible = infoBox.style.display === 'block';
            infoBox.style.display = isVisible ? 'none' : 'block';
        }
    }

    // Toggle Pixel Info
    function togglePixelInfo() {
        const infoBox = document.getElementById('pixelInfo');
        if (infoBox) {
            const isVisible = infoBox.style.display === 'block';
            infoBox.style.display = isVisible ? 'none' : 'block';
        }
    }

    // Email Admin Details
    function emailAdminDetails() {
        const adminName = document.getElementById('adminName').value;
        const adminEmail = document.getElementById('adminEmail').value;
        const adminPhone = document.getElementById('adminPhone').value;
        const platform = document.getElementById('websitePlatform').value;
        const platformOther = document.getElementById('websitePlatformOther').value;

        if (!adminEmail) {
            alert('Please enter admin email address');
            return;
        }

        const platformText = platform === 'other' ? platformOther : platform;
        const subject = 'Website Admin Contact Details - Client Portal';
        const body = `Website Admin Contact Details:\n\n` +
            `Name: ${adminName || 'Not provided'}\n` +
            `Email: ${adminEmail}\n` +
            `Phone: ${adminPhone || 'Not provided'}\n` +
            `Platform: ${platformText || 'Not specified'}\n\n` +
            `Please contact them to coordinate tracking installation.`;

        window.open(`mailto:${DLM_CONFIG.support.opsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }

    // Email Access Details
    function emailAccessDetails() {
        const websiteUrl = document.getElementById('websiteUrl').value;
        const loginUrl = document.getElementById('loginUrl').value;
        const username = document.getElementById('tempUsername').value;
        const password = document.getElementById('tempPassword').value;
        const platform = document.getElementById('sitePlatform').value;
        const platformOther = document.getElementById('sitePlatformOther').value;

        if (!websiteUrl || !username || !password) {
            alert('Please fill in all required fields');
            return;
        }

        const platformText = platform === 'other' ? platformOther : platform;
        const subject = 'Temporary Website Access Details - Client Portal';
        const body = `Temporary Website Access Details:\n\n` +
            `Website URL: ${websiteUrl}\n` +
            `Login URL: ${loginUrl || 'Not provided'}\n` +
            `Username: ${username}\n` +
            `Password: ${password}\n` +
            `Platform: ${platformText || 'Not specified'}\n\n` +
            `Please install tracking and remove access when complete.`;

        window.open(`mailto:${DLM_CONFIG.support.opsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }

    // Approve Creatives
    function approveCreatives() {
        if (confirm('Approve creatives for launch?')) {
            markStepComplete(5);
            alert('Approved! Your campaign will launch within 24-48 hours.');
        }
    }

    // Request Revisions
    function requestRevisions() {
        const form = document.getElementById('revisionForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Submit Revisions
    function submitRevisions() {
        const notes = document.getElementById('revisionNotes').value;
        if (!notes) {
            alert('Please enter revision notes');
            return;
        }
        const subject = 'Creative Revision Request';
        window.open(`mailto:${DLM_CONFIG.support.opsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(notes)}`);
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', async function() {
        await loadState();
        updateStepStates();

        // Set default DocuSign links if no custom links
        const serviceAgreementBtn = document.getElementById('serviceAgreementBtn');
        const dpaBtn = document.getElementById('dpaBtn');
        const invoiceBtn = document.getElementById('invoiceBtn');
        const uploadBtn = document.getElementById('uploadBtn');

        if (serviceAgreementBtn && !portalState.docuSignLinks?.serviceAgreement) {
            serviceAgreementBtn.href = DLM_CONFIG.docuSign.serviceAgreement;
        }
        if (dpaBtn && !portalState.docuSignLinks?.dpa) {
            dpaBtn.href = DLM_CONFIG.docuSign.dpa;
        }
        if (invoiceBtn && !portalState.invoiceLink) {
            invoiceBtn.href = DLM_CONFIG.stripeLinks.invoiceLink;
        }
        if (uploadBtn && !portalState.googleDriveLink) {
            uploadBtn.href = DLM_CONFIG.googleDrive.defaultUploadLink;
        }

        // Set contact info
        const contactEmail = document.getElementById('contactEmail');
        const contactPhone = document.getElementById('contactPhone');
        if (contactEmail) contactEmail.textContent = DLM_CONFIG.support.opsEmail;
        if (contactPhone) contactPhone.textContent = DLM_CONFIG.support.opsPhone;

        // Step 4 website access event listeners
        document.querySelectorAll('input[name="websiteAccess"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const connectForm = document.getElementById('connectAdminForm');
                const tempForm = document.getElementById('tempAccessForm');
                if (connectForm) connectForm.style.display = this.value === 'connect' ? 'block' : 'none';
                if (tempForm) tempForm.style.display = this.value === 'temporary' ? 'block' : 'none';
            });
        });

        // Platform selection handlers for Step 4
        ['websitePlatform', 'sitePlatform'].forEach(selectId => {
            const selectElement = document.getElementById(selectId);
            const otherInput = document.getElementById(selectId + 'Other');

            if (selectElement && otherInput) {
                selectElement.addEventListener('change', function() {
                    if (this.value === 'other') {
                        otherInput.style.display = 'block';
                        otherInput.required = true;
                    } else {
                        otherInput.style.display = 'none';
                        otherInput.required = false;
                        otherInput.value = '';
                    }
                });
            }
        });

        console.log('✓ Month-to-Month Portal initialized successfully with Firebase');
    });

    // ===== CLIENT MESSAGING SYSTEM =====
    let chatPanelOpen = false;
    let clientMessagesListener = null;

    // Toggle chat panel
    window.toggleChatPanel = function() {
        const chatPanel = document.getElementById('chatPanel');
        chatPanelOpen = !chatPanelOpen;

        if (chatPanelOpen) {
            chatPanel.style.right = '0';
            loadClientMessages();
        } else {
            chatPanel.style.right = '-400px';
        }
    };

    // Load client messages
    function loadClientMessages() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('c');

        if (!clientId) return;

        const messagesContainer = document.getElementById('clientChatMessages');

        // Stop previous listener
        if (clientMessagesListener) {
            clientMessagesListener();
        }

        // Listen to messages
        clientMessagesListener = db.collection('messages')
            .doc(clientId)
            .collection('thread')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                messagesContainer.innerHTML = '';

                if (snapshot.empty) {
                    messagesContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: #64748B;">
                            <div style="font-size: 2rem; margin-bottom: 12px; opacity: 0.3;">💬</div>
                            <p>No messages yet. Start a conversation!</p>
                        </div>
                    `;
                    return;
                }

                snapshot.forEach(doc => {
                    const msg = doc.data();
                    const isClient = msg.sender === 'client';

                    const messageDiv = document.createElement('div');
                    messageDiv.style.cssText = `
                        display: flex;
                        justify-content: ${isClient ? 'flex-end' : 'flex-start'};
                    `;

                    messageDiv.innerHTML = `
                        <div style="
                            max-width: 70%;
                            padding: 12px 16px;
                            border-radius: 12px;
                            background: ${isClient ? 'rgba(242, 169, 34, 0.3)' : 'white'};
                            color: #000000;
                            border: 1px solid ${isClient ? '#F2A922' : '#e5e7eb'};
                        ">
                            <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 4px; color: #64748B;">
                                ${msg.senderName || (isClient ? 'You' : 'Admin')}
                            </div>
                            <div style="font-size: 0.9rem; margin-bottom: 4px; word-wrap: break-word;">
                                ${msg.text}
                            </div>
                            <div style="font-size: 0.7rem; color: #64748B; text-align: right;">
                                ${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleString() : ''}
                            </div>
                        </div>
                    `;

                    messagesContainer.appendChild(messageDiv);
                });

                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                // Mark messages as read by client
                markClientMessagesAsRead(clientId);
            });

        // Listen to unread count
        db.collection('messages').doc(clientId).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                const unread = data.unreadByClient || 0;
                const badge = document.getElementById('clientUnreadBadge');

                if (unread > 0) {
                    badge.textContent = unread;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }

    // Mark messages as read by client
    async function markClientMessagesAsRead(clientId) {
        try {
            await db.collection('messages').doc(clientId).update({
                unreadByClient: 0
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Send message from client
    document.getElementById('clientMessageForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('c');

        if (!clientId) return;

        const input = document.getElementById('clientMessageInput');
        const messageText = input.value.trim();

        if (!messageText) return;

        try {
            // Get client name from portal
            const clientDoc = await db.collection('clients').doc(clientId).get();
            const clientData = clientDoc.data();
            const clientName = clientData.clientName || 'Client';

            // Add message to thread
            await db.collection('messages')
                .doc(clientId)
                .collection('thread')
                .add({
                    text: messageText,
                    sender: 'client',
                    senderName: clientName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                });

            // Update conversation metadata
            await db.collection('messages').doc(clientId).set({
                lastMessage: messageText,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                unreadByAdmin: firebase.firestore.FieldValue.increment(1),
                unreadByClient: 0,
                clientName: clientName
            }, { merge: true });

            input.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        }
    });

    // Expose functions globally
    window.markStepComplete = markStepComplete;
    window.toggleBrandKitInfo = toggleBrandKitInfo;
    window.toggleGA4Info = toggleGA4Info;
    window.togglePixelInfo = togglePixelInfo;
    window.emailAdminDetails = emailAdminDetails;
    window.emailAccessDetails = emailAccessDetails;
    window.approveCreatives = approveCreatives;
    window.requestRevisions = requestRevisions;
    window.submitRevisions = submitRevisions;
})();
