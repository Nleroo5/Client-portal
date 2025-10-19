// Version 2.1 - Fixed null reference errors
(function() {
    'use strict';

    // Global settings object - loaded from Firestore, falls back to config.js
    let APP_SETTINGS = null;

    // Load settings from Firestore
    async function loadSettings() {
        try {
            const settingsDoc = await db.collection('settings').doc('config').get();
            if (settingsDoc.exists) {
                APP_SETTINGS = settingsDoc.data();
                console.log('Settings loaded from Firestore');
            } else {
                // Fallback to config.js
                APP_SETTINGS = DLM_CONFIG;
                console.log('Using default settings from config.js');
            }
        } catch (error) {
            console.error('Error loading settings, using config.js:', error);
            APP_SETTINGS = DLM_CONFIG;
        }
    }

    // Portal State
    let portalState = {
        "1": false,
        "2": false,
        "3": false,
        "4": false,
        "5": false,
        "6": false,
        "docuSignLinks": {
            "dpa": null,
            "service6": null,
            "service12": null
        },
        "stripeLinks": {
            "service6": {
                "monthly": null,
                "upfront": null
            },
            "service12": {
                "monthly": null,
                "upfront": null
            }
        }
    };

    // Load state from Firebase - THIS IS THE CRITICAL FIREBASE FUNCTION
    async function loadState() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('id') || urlParams.get('c'); // Support both new 'id' and legacy 'c' parameter
        
        // Hide loading screen function
        const hideLoading = () => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        };
        
        const contactEmail = APP_SETTINGS?.support?.email || 'nicolas@driveleadmedia.com';

        if (!clientId) {
            document.body.innerHTML = `<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Invalid Access</h1><p style="font-size: 1.1rem;">Please use the link provided by Drive Lead Media.</p><p style="margin-top: 20px; color: #05908C;">Contact: ${contactEmail}</p></div></div>`;
            return;
        }

        try {
            const doc = await db.collection('clients').doc(clientId).get();

            if (!doc.exists) {
                document.body.innerHTML = `<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Portal Not Found</h1><p style="font-size: 1.1rem;">Please contact Drive Lead Media for assistance.</p><p style="margin-top: 20px; color: #05908C;">Contact: ${contactEmail}</p></div></div>`;
                return;
            }

            const data = doc.data();

            if (!data.active) {
                document.body.innerHTML = `<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Portal Inactive</h1><p style="font-size: 1.1rem;">This portal is currently inactive. Please contact Drive Lead Media.</p><p style="margin-top: 20px; color: #05908C;">Contact: ${contactEmail}</p></div></div>`;
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
            portalState['6'] = data.step6Complete || false;
            
            // Load custom DocuSign links
            if (data.dpaLink) {
                portalState.docuSignLinks.dpa = data.dpaLink;
                const dpaBtn = document.getElementById('dpaBtn');
                if (dpaBtn) dpaBtn.href = data.dpaLink;
            }
            
            if (data.service6Link) {
                portalState.docuSignLinks.service6 = data.service6Link;
            }
            
            if (data.service12Link) {
                portalState.docuSignLinks.service12 = data.service12Link;
            }
            
            // Load Stripe links
            if (data.stripe6Monthly) {
                if (!portalState.stripeLinks.service6) portalState.stripeLinks.service6 = {};
                portalState.stripeLinks.service6.monthly = data.stripe6Monthly;
            }
            
            if (data.stripe6Upfront) {
                if (!portalState.stripeLinks.service6) portalState.stripeLinks.service6 = {};
                portalState.stripeLinks.service6.upfront = data.stripe6Upfront;
            }
            
            if (data.stripe12Monthly) {
                if (!portalState.stripeLinks.service12) portalState.stripeLinks.service12 = {};
                portalState.stripeLinks.service12.monthly = data.stripe12Monthly;
            }
            
            if (data.stripe12Upfront) {
                if (!portalState.stripeLinks.service12) portalState.stripeLinks.service12 = {};
                portalState.stripeLinks.service12.upfront = data.stripe12Upfront;
            }
            
            // Load brand assets
            if (data.brandAssets && data.brandAssets.length > 0) {
                displayBrandAssets(data.brandAssets);
            }

            // Load creatives
            if (data.creatives && data.creatives.length > 0) {
                displayCreativesGallery(data.creatives);
            }

            // Store client ID for saving
            window.currentClientId = clientId;
            
            // Hide loading screen after successful load
            hideLoading();
            
        } catch (error) {
            console.error('Error loading:', error);
            document.body.innerHTML = `<div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;"><div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;"><h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Loading Error</h1><p style="font-size: 1.1rem;">Please refresh the page or contact support.</p><p style="margin-top: 20px; color: #05908C;">Contact: ${contactEmail}</p></div></div>`;
        }
    }

    // Save state to Firebase - THIS SAVES TO FIREBASE INSTEAD OF LOCALSTORAGE
    async function saveState() {
        if (!window.currentClientId) return;

        try {
            await db.collection('clients').doc(window.currentClientId).update({
                step1Complete: portalState['1'],
                step2Complete: portalState['2'],
                step3Complete: portalState['3'],
                step4Complete: portalState['4'],
                step5Complete: portalState['5'],
                step6Complete: portalState['6'],
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
        const totalSteps = 6;
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
            if (percentage === 0) msg.textContent = "Let's get started!";
            else if (percentage >= 17 && percentage < 34) msg.textContent = "Rolling now!";
            else if (percentage >= 34 && percentage < 50) msg.textContent = "Crushing it!";
            else if (percentage >= 50 && percentage < 67) msg.textContent = "Halfway done!";
            else if (percentage >= 67 && percentage < 100) msg.textContent = "So close!";
            else if (percentage === 100) msg.textContent = "Launch ready!";
        }

        // Update step bubbles
        for (let i = 1; i <= 6; i++) {
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
        for (let i = 1; i <= 6; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                const isCompleted = portalState[i.toString()];
                const isUnlocked = i === 1 || portalState[(i - 1).toString()];

                step.classList.toggle('completed', isCompleted);
                step.classList.toggle('locked', !isUnlocked);

                const btn = step.querySelector('.btn-complete');
                if (btn) {
                    btn.textContent = isCompleted ? `Step ${i} Completed` : `Mark Step ${i} Complete`;
                    if (isCompleted) btn.setAttribute('disabled', 'true');
                    else btn.removeAttribute('disabled');
                }
            }
        }
        updateFloatingSidebar();
    }

    // Mark Step Complete - SAVES TO FIREBASE
    async function markStepComplete(stepNum) {
        portalState[stepNum.toString()] = true;
        await saveState(); // This now saves to Firebase

        // Create notification for admin about step completion
        if (window.createNotification && window.currentClientId) {
            try {
                const clientDoc = await db.collection('clients').doc(window.currentClientId).get();
                const clientData = clientDoc.data();

                await window.createNotification({
                    type: 'CLIENT_STEP_COMPLETE',
                    recipientId: 'admin',
                    recipientType: 'admin',
                    message: `${clientData.clientName || 'Client'} completed Step ${stepNum}`,
                    actionUrl: `admin.html?tab=clients`,
                    relatedId: window.currentClientId,
                    metadata: {
                        clientName: clientData.clientName,
                        stepNumber: stepNum,
                        portalType: clientData.portalType
                    }
                });
                console.log(`Admin notification created for Step ${stepNum} completion`);
            } catch (error) {
                console.error('Error creating step completion notification:', error);
            }
        }

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

                    // Scroll to next step (or top if step 6)
                    if (stepNum < 6) {
                        const nextStep = document.getElementById(`step${stepNum + 1}`);
                        if (nextStep) {
                            nextStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    } else {
                        // Step 6 - scroll to top for celebration
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                }, 200);
            }, 10);
        } else {
            updateStepStates();

            // Scroll to next step (or top if step 6)
            if (stepNum < 6) {
                const nextStep = document.getElementById(`step${stepNum + 1}`);
                if (nextStep) {
                    nextStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Step 6 - scroll to top for celebration
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }

        // Check if all complete (especially step 6)
        const allComplete = [1,2,3,4,5,6].every(n => portalState[n.toString()]);
        if (stepNum === 6 || allComplete) {
            // Show celebration for final step completion
            setTimeout(() => {
                showFinalCelebration();
            }, 1000);
        }
    }

    // Final celebration when step 6 is completed
    function showFinalCelebration() {
        // Create full-screen celebration overlay
        const celebrationDiv = document.createElement('div');
        celebrationDiv.id = 'finalCelebration';
        celebrationDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(1, 46, 64, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;

        celebrationDiv.innerHTML = `
            <div style="text-align: center; color: white; max-width: 600px; padding: 40px;">
                <div style="font-size: 6rem; margin-bottom: 20px; animation: bounce 1s infinite;">🎉</div>
                <h1 style="font-family: 'Young Serif', serif; font-size: 3rem; margin-bottom: 20px; color: #F2A922;">
                    Congratulations!
                </h1>
                <p style="font-size: 1.5rem; margin-bottom: 30px; color: #85C7B3;">
                    You're all set and ready to launch!
                </p>
                <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; color: #EEF4D9;">
                    We'll review everything and start your campaign within 24-48 hours.
                    You'll receive an email as soon as we're live!
                </p>
                <button onclick="document.getElementById('finalCelebration').remove()"
                        style="background: linear-gradient(135deg, #F2A922 0%, #05908C 100%);
                               color: white;
                               border: none;
                               padding: 15px 40px;
                               font-size: 1.1rem;
                               font-weight: 600;
                               border-radius: 10px;
                               cursor: pointer;
                               box-shadow: 0 4px 15px rgba(242, 169, 34, 0.4);
                               transition: transform 0.2s;">
                    Continue to Portal
                </button>
            </div>
        `;

        document.body.appendChild(celebrationDiv);

        // Fade in
        setTimeout(() => {
            celebrationDiv.style.opacity = '1';
        }, 10);

        // Trigger confetti burst
        triggerCelebrationConfetti();

        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Show success message too
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            setTimeout(() => {
                successMsg.style.display = 'block';
            }, 3000);
        }
    }

    // Trigger multiple confetti bursts for celebration
    function triggerCelebrationConfetti() {
        const colors = ['#F2A922', '#85C7B3', '#05908C', '#EEF4D9'];

        // Create 5 bursts with slight delays
        for (let burst = 0; burst < 5; burst++) {
            setTimeout(() => {
                for (let i = 0; i < 30; i++) {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti-particle';
                    confetti.style.position = 'fixed';
                    confetti.style.left = '50%';
                    confetti.style.top = '30%';
                    confetti.style.width = '10px';
                    confetti.style.height = '10px';
                    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.pointerEvents = 'none';
                    confetti.style.zIndex = '9999';

                    const angle = (Math.PI * 2 * i) / 30;
                    const velocity = 100 + Math.random() * 100;
                    confetti.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
                    confetti.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');

                    document.body.appendChild(confetti);

                    setTimeout(() => confetti.remove(), 2000);
                }
            }, burst * 200);
        }
    }

    // Update Service Button
    function updateServiceButton() {
        const service12 = document.getElementById('service12');
        const serviceBtn = document.getElementById('serviceBtn');
        if (service12 && serviceBtn) {
            if (service12.checked) {
                serviceBtn.textContent = 'Sign Service Agreement (12-month)';
                serviceBtn.href = portalState.docuSignLinks?.service12 || APP_SETTINGS?.docuSign?.service12 || '#';
            } else {
                serviceBtn.textContent = 'Sign Service Agreement (6-month)';
                serviceBtn.href = portalState.docuSignLinks?.service6 || APP_SETTINGS?.docuSign?.service6 || '#';
            }
            updatePaymentOptions();
        }
    }

    // Update Payment Options
    function updatePaymentOptions() {
        const serviceTerm = document.getElementById('service12')?.checked ? 'service12' : 'service6';
        const termText = serviceTerm === 'service12' ? '12-Month' : '6-Month';
        const paymentTermText = document.getElementById('paymentTermText');
        if (paymentTermText) paymentTermText.textContent = termText;
        updatePaymentButton();
    }

    // Update Payment Button
    function updatePaymentButton() {
        const serviceTerm = document.getElementById('service12')?.checked ? 'service12' : 'service6';
        const paymentType = document.getElementById('paymentUpfront')?.checked ? 'upfront' : 'monthly';
        const stripeBtn = document.getElementById('stripeBtn');
        
        if (stripeBtn) {
            const typeText = paymentType === 'upfront' ? 
                'Set Up Upfront Payment (5% Discount)' : 'Set Up Monthly Payment';
            stripeBtn.textContent = typeText;
            
            // Use custom link if available, otherwise use default
            let paymentLink;
            if (portalState.stripeLinks?.[serviceTerm]?.[paymentType]) {
                paymentLink = portalState.stripeLinks[serviceTerm][paymentType];
            } else {
                paymentLink = APP_SETTINGS?.stripeLinks?.[serviceTerm]?.[paymentType] || '#';
            }
            stripeBtn.href = paymentLink;
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

    // Send Admin Details via Message
    async function emailAdminDetails() {
        const adminName = document.getElementById('adminName').value;
        const adminEmail = document.getElementById('adminEmail').value;
        const adminPhone = document.getElementById('adminPhone').value;
        const platform = document.getElementById('websitePlatform').value;
        const platformOther = document.getElementById('websitePlatformOther').value;

        if (!adminEmail) {
            alert('Please enter admin email address');
            return;
        }

        if (!window.currentClientId) {
            alert('Error: Client ID not found');
            return;
        }

        const platformText = platform === 'other' ? platformOther : platform;

        try {
            // Save to client document for admin dashboard display
            await db.collection('clients').doc(window.currentClientId).update({
                websiteAccessMethod: 'admin-contact',
                websiteAdminDetails: {
                    name: adminName || 'Not provided',
                    email: adminEmail,
                    phone: adminPhone || 'Not provided',
                    platform: platformText || 'Not specified',
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending'
                },
                hasUnreviewedWebsiteAccess: true,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Admin contact details submitted successfully! We will contact them to coordinate tracking installation.');
        } catch (error) {
            console.error('Error sending admin details:', error);
            alert('Error sending details. Please try again.');
        }
    }

    // Email Access Details
    async function emailAccessDetails() {
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

        if (!window.currentClientId) {
            alert('Error: Client ID not found');
            return;
        }

        const platformText = platform === 'other' ? platformOther : platform;

        try {
            // Save to client document for admin dashboard display
            await db.collection('clients').doc(window.currentClientId).update({
                websiteAccessMethod: 'direct-access',
                websiteDirectAccess: {
                    websiteUrl: websiteUrl,
                    loginUrl: loginUrl || 'Not provided',
                    username: username,
                    password: password,
                    platform: platformText || 'Not specified',
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending'
                },
                hasUnreviewedWebsiteAccess: true,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Website access details submitted successfully! We will install tracking and remove our access immediately.');
        } catch (error) {
            console.error('Error sending access details:', error);
            alert('Error sending details. Please try again.');
        }
    }

    // Fireworks display
    function triggerFireworks() {
        const colors = ['#F2A922', '#05908C', '#85C7B3', '#EEF4D9', '#012E40'];
        const fireworksContainer = document.createElement('div');
        fireworksContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999;';
        document.body.appendChild(fireworksContainer);

        function createFirework(x, y) {
            const particleCount = 30;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.cssText = `
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    width: 8px;
                    height: 8px;
                    background: ${color};
                    border-radius: 50%;
                    pointer-events: none;
                `;

                const angle = (Math.PI * 2 * i) / particleCount;
                const velocity = 100 + Math.random() * 100;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;

                particle.style.animation = `fireworkParticle 1s ease-out forwards`;
                particle.style.setProperty('--tx', tx + 'px');
                particle.style.setProperty('--ty', ty + 'px');

                fireworksContainer.appendChild(particle);

                setTimeout(() => particle.remove(), 1000);
            }
        }

        // Launch multiple fireworks
        const launchCount = 15;
        for (let i = 0; i < launchCount; i++) {
            setTimeout(() => {
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight * 0.6;
                createFirework(x, y);
            }, i * 200);
        }

        // Remove container after all animations
        setTimeout(() => fireworksContainer.remove(), 4000);
    }

    // Approve Creatives
    function approveCreatives() {
        if (confirm('Approve creatives for launch?')) {
            markStepComplete(6);
            triggerFireworks();
            setTimeout(() => {
                alert('🎉 Approved! Your campaign will launch within 24-48 hours.');
            }, 500);
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
        const supportEmail = APP_SETTINGS?.support?.email || 'nicolas@driveleadmedia.com';
        window.open(`mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(notes)}`);
    }

    // Submit Revision Request from Modal
    window.submitRevisionRequest = async function(event) {
        event.preventDefault();

        if (!window.currentClientId) {
            alert('Error: Client ID not found');
            return;
        }

        // Collect selected changes
        const selectedChanges = [];
        document.querySelectorAll('input[name="change"]:checked').forEach(checkbox => {
            selectedChanges.push(checkbox.value);
        });

        // Get additional notes
        const notes = document.getElementById('revisionNotes').value.trim();

        // Get timeline
        const timeline = document.querySelector('input[name="timeline"]:checked')?.value || 'standard';

        // Validate: must have at least one change selected or notes
        if (selectedChanges.length === 0 && !notes) {
            alert('Please select at least one change or add notes about what you\'d like revised.');
            return;
        }

        try {
            // Show loading state on submit button
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            // Upload files to Firebase Storage
            const uploadedFileUrls = [];
            const fileInput = document.getElementById('revisionFiles');

            if (fileInput && fileInput.files.length > 0) {
                const storageRef = firebase.storage().ref();

                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    const fileName = `${Date.now()}-${file.name}`;
                    const fileRef = storageRef.child(`revisions/${window.currentClientId}/${fileName}`);

                    await fileRef.put(file);
                    const fileUrl = await fileRef.getDownloadURL();

                    uploadedFileUrls.push({
                        name: file.name,
                        url: fileUrl,
                        size: file.size,
                        type: file.type
                    });
                }
            }

            // Get client data for notification
            const clientDoc = await db.collection('clients').doc(window.currentClientId).get();
            const clientData = clientDoc.data();
            const clientName = clientData.clientName || 'Client';

            // Save revision request to Firestore
            await db.collection('revisionRequests').add({
                clientId: window.currentClientId,
                clientName: clientName,
                selectedChanges: selectedChanges,
                notes: notes,
                timeline: timeline,
                attachments: uploadedFileUrls,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                resolvedAt: null
            });

            // Update client document to indicate pending revision
            await db.collection('clients').doc(window.currentClientId).update({
                hasPendingRevision: true,
                lastRevisionRequestAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Create notification for admin
            if (window.createNotification) {
                await window.createNotification({
                    type: 'REVISION_REQUEST',
                    recipientId: 'admin',
                    recipientType: 'admin',
                    message: `${clientName} requested creative revisions`,
                    actionUrl: `admin.html?tab=clients`,
                    relatedId: window.currentClientId,
                    metadata: {
                        clientName: clientName,
                        changeCount: selectedChanges.length,
                        hasNotes: !!notes,
                        hasAttachments: uploadedFileUrls.length > 0,
                        timeline: timeline
                    }
                });
                console.log('Admin notification created for revision request');
            }

            // Close modal and show success
            closeRevisionModal();

            // Show success message
            alert('Revision request submitted successfully! We\'ll review your feedback and get back to you within 2-3 business days.');

            // Reset form
            document.getElementById('revisionRequestForm').reset();
            selectedFiles = [];
            document.getElementById('fileList').innerHTML = '';

            // Restore button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

        } catch (error) {
            console.error('Error submitting revision request:', error);
            alert('Error submitting revision request. Please try again or contact support.');

            // Restore button
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request 🚀';
        }
    };

    // Initialize on DOM ready - USES FIREBASE LOADING
    document.addEventListener('DOMContentLoaded', async function() {
        await loadSettings(); // Load settings from Firestore first
        await loadState(); // This loads from Firebase
        updateStepStates();
        
        // Set default DocuSign DPA link if no custom link
        const dpaBtn = document.getElementById('dpaBtn');
        if (dpaBtn && portalState.docuSignLinks && !portalState.docuSignLinks.dpa) {
            if (APP_SETTINGS?.docuSign?.dpa) {
                dpaBtn.href = APP_SETTINGS.docuSign.dpa;
            }
        }
        
        // Initialize Service Agreement
        updateServiceButton();
        
        // Set contact info
        const contactEmail = document.getElementById('contactEmail');
        const contactPhone = document.getElementById('contactPhone');
        if (contactEmail) contactEmail.textContent = APP_SETTINGS?.support?.email || 'nicolas@driveleadmedia.com';
        if (contactPhone) contactPhone.textContent = APP_SETTINGS?.support?.phone || '(555) 123-4567';
        
        // Event listeners
        document.querySelectorAll('input[name="serviceTerm"]').forEach(radio => {
            radio.addEventListener('change', updateServiceButton);
        });
        
        document.querySelectorAll('input[name="paymentType"]').forEach(radio => {
            radio.addEventListener('change', updatePaymentButton);
        });
        
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
        
        console.log('Portal initialized successfully with Firebase');
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
        const clientId = urlParams.get('id') || urlParams.get('c'); // Support both new 'id' and legacy 'c' parameter

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
    const messageForm = document.getElementById('clientMessageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const urlParams = new URLSearchParams(window.location.search);
            const clientId = urlParams.get('id') || urlParams.get('c'); // Support both new 'id' and legacy 'c' parameter

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

            // Create notification for admin about new client message
            if (window.createNotification) {
                await window.createNotification({
                    type: 'MESSAGE_RECEIVED',
                    recipientId: 'admin',
                    recipientType: 'admin',
                    message: `${clientName} sent you a message`,
                    actionUrl: `admin.html?tab=clients#messages`,
                    relatedId: clientId,
                    metadata: {
                        clientName: clientName,
                        messagePreview: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
                    }
                });
                console.log('Admin notification created for new client message');
            }

            input.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        }
        });
    }

    // Brand Kit Functions
    window.handleLogoUpload = async function(input) {
        const file = input.files[0];
        if (!file) return;

        const previewContainer = document.getElementById('logoPreviewContainer');
        const previewImg = document.getElementById('logoPreviewImg');
        const fileName = document.getElementById('logoFileName');

        try {
            // Show preview with loading state
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                fileName.innerHTML = `${file.name} <span style="color: #F2A922; font-size: 0.8rem;">⏳ Uploading...</span>`;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);

            // Upload to Firebase Storage
            const urlParams = new URLSearchParams(window.location.search);
            const clientId = urlParams.get('id') || urlParams.get('c');

            if (!clientId) return;

            const storageRef = firebase.storage().ref();
            const logoRef = storageRef.child(`clients/${clientId}/brand-logo-${Date.now()}-${file.name}`);

            await logoRef.put(file);
            const logoUrl = await logoRef.getDownloadURL();

            // Save logo URL to Firestore
            await db.collection('clients').doc(clientId).update({
                brandLogoUrl: logoUrl,
                brandLogoFileName: file.name,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update UI to show success
            fileName.innerHTML = `${file.name} <span style="color: #05908C; font-size: 0.8rem;">✓ Uploaded</span>`;
            console.log('Logo uploaded successfully');

        } catch (error) {
            console.error('Error uploading logo:', error);
            // Update UI to show error
            if (fileName) {
                fileName.innerHTML = `${file.name} <span style="color: #F2584E; font-size: 0.8rem;">✗ Upload failed</span>`;
            }
            alert('Error uploading logo. Please try again.');
        }
    };

    // Sync color picker with hex input (new multi-color version)
    window.syncBrandColorFromHex = function(index) {
        const hexInput = document.getElementById(`brandColor${index}Hex`);
        const colorPicker = document.getElementById(`brandColor${index}`);

        let hexValue = hexInput.value.trim();

        // Add # if missing
        if (!hexValue.startsWith('#')) {
            hexValue = '#' + hexValue;
        }

        // Validate hex color
        if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
            colorPicker.value = hexValue;
            hexInput.value = hexValue;
            saveBrandColors();
        } else {
            alert('Please enter a valid hex color (e.g., #05908C)');
        }
    };

    // Add brand color
    window.addBrandColor = function() {
        const container = document.getElementById('brandColorsContainer');
        const colorItems = container.querySelectorAll('.brand-color-item');
        const currentCount = colorItems.length;

        if (currentCount >= 5) {
            alert('You can add up to 5 brand colors');
            return;
        }

        const newIndex = currentCount;
        const colorDiv = document.createElement('div');
        colorDiv.className = 'brand-color-item';
        colorDiv.setAttribute('data-index', newIndex);
        colorDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <label for="brandColor${newIndex}" style="color: #012E40; font-size: 0.9rem;">Additional Color ${newIndex - 1}</label>
                <button type="button" onclick="window.removeBrandColor(${newIndex})" style="background: #ef4444; color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Remove</button>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="color" id="brandColor${newIndex}" class="brand-color-picker" value="#000000" style="width: 60px; height: 60px; border: 2px solid #000000; border-radius: 8px; cursor: pointer;">
                <input type="text" id="brandColor${newIndex}Hex" class="brand-color-hex" value="#000000" placeholder="#000000" style="flex: 1; padding: 10px; border: 1.5px solid #d1d5db; border-radius: 8px; font-family: monospace;" onchange="window.syncBrandColorFromHex(${newIndex})">
            </div>
        `;

        container.appendChild(colorDiv);

        // Add event listeners for the new color picker
        const colorPicker = document.getElementById(`brandColor${newIndex}`);
        const colorHex = document.getElementById(`brandColor${newIndex}Hex`);

        colorPicker.addEventListener('change', function() {
            colorHex.value = this.value;
            saveBrandColors();
        });

        // Hide add button if at max
        if (currentCount + 1 >= 5) {
            document.getElementById('addColorBtn').style.display = 'none';
        }

        saveBrandColors();
    };

    // Remove brand color
    window.removeBrandColor = function(index) {
        const item = document.querySelector(`.brand-color-item[data-index="${index}"]`);
        if (item) {
            item.remove();
            document.getElementById('addColorBtn').style.display = 'flex';
            saveBrandColors();
        }
    };

    // Save brand colors to Firestore (updated for multiple colors)
    async function saveBrandColors() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('id') || urlParams.get('c');

        if (!clientId) return;

        const brandColors = [];
        const colorPickers = document.querySelectorAll('.brand-color-picker');

        colorPickers.forEach(picker => {
            if (picker.value) {
                brandColors.push(picker.value);
            }
        });

        try {
            await db.collection('clients').doc(clientId).update({
                brandColors: brandColors,
                // Keep old fields for backwards compatibility
                brandPrimaryColor: brandColors[0] || null,
                brandSecondaryColor: brandColors[1] || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Brand colors saved');
        } catch (error) {
            console.error('Error saving brand colors:', error);
        }
    }

    // Listen for color picker changes
    document.addEventListener('DOMContentLoaded', function() {
        // Add listeners to existing color pickers
        const colorPickers = document.querySelectorAll('.brand-color-picker');
        colorPickers.forEach((picker, index) => {
            const hexInput = document.getElementById(`brandColor${index}Hex`);
            if (hexInput) {
                picker.addEventListener('change', function() {
                    hexInput.value = this.value;
                    saveBrandColors();
                });
            }
        });
    });

    // Toggle advanced brand kit section
    window.toggleAdvancedBrandKit = function() {
        const section = document.getElementById('advancedBrandKitSection');
        const icon = document.getElementById('advancedToggleIcon');

        if (section.style.display === 'none') {
            section.style.display = 'block';
            icon.textContent = '▲';
        } else {
            section.style.display = 'none';
            icon.textContent = '▼';
        }
    };

    // Handle brand assets upload
    window.handleBrandAssetsUpload = async function(input) {
        const files = Array.from(input.files);

        if (files.length === 0) return;

        // Validate file count
        if (files.length > 10) {
            alert('You can upload up to 10 files at a time');
            return;
        }

        // Validate file sizes
        const maxSize = 10 * 1024 * 1024; // 10MB
        const oversizedFiles = files.filter(f => f.size > maxSize);
        if (oversizedFiles.length > 0) {
            alert(`These files are too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('id') || urlParams.get('c');

        if (!clientId) {
            alert('Error: Client ID not found');
            return;
        }

        try {
            const storageRef = firebase.storage().ref();
            const uploadedFiles = [];

            // Show upload progress
            const fileListContainer = document.getElementById('brandAssetsFileList');
            const filesContainer = document.getElementById('brandAssetsFiles');
            fileListContainer.style.display = 'block';
            filesContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">Uploading files...</p>';

            // Upload each file
            for (const file of files) {
                const fileName = `${Date.now()}-${file.name}`;
                const fileRef = storageRef.child(`clients/${clientId}/brand-assets/${fileName}`);

                await fileRef.put(file);
                const fileUrl = await fileRef.getDownloadURL();

                uploadedFiles.push({
                    name: file.name,
                    url: fileUrl,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                });
            }

            // Save file metadata to Firestore
            const clientDoc = await db.collection('clients').doc(clientId).get();
            const existingAssets = clientDoc.data()?.brandAssets || [];

            await db.collection('clients').doc(clientId).update({
                brandAssets: [...existingAssets, ...uploadedFiles],
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Display uploaded files
            displayBrandAssets([...existingAssets, ...uploadedFiles]);

            alert(`Successfully uploaded ${files.length} file(s)!`);

        } catch (error) {
            console.error('Error uploading brand assets:', error);
            alert('Error uploading files. Please try again.');
        }
    };

    // Display brand assets
    function displayBrandAssets(assets) {
        const fileListContainer = document.getElementById('brandAssetsFileList');
        const filesContainer = document.getElementById('brandAssetsFiles');

        if (!assets || assets.length === 0) {
            fileListContainer.style.display = 'none';
            return;
        }

        fileListContainer.style.display = 'block';
        filesContainer.innerHTML = assets.map((file, index) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span style="font-size: 1.2rem;">${getFileIcon(file.type || file.name)}</span>
                    <div style="flex: 1; min-width: 0;">
                        <div style="color: #012E40; font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</div>
                        <div style="color: #6b7280; font-size: 0.75rem;">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <a href="${file.url}" target="_blank" style="padding: 6px 12px; background: #05908C; color: white; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 600; white-space: nowrap;">Download</a>
            </div>
        `).join('');
    }

    // Get file icon based on type
    function getFileIcon(type) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('font') || type.includes('ttf') || type.includes('otf') || type.includes('woff')) return '🔤';
        if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('svg')) return '🖼️';
        return '📁';
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Download file function
    window.downloadFile = async function(url, filename) {
        try {
            const storageRef = firebase.storage().refFromURL(url);
            const metadata = await storageRef.getMetadata();

            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';

            xhr.onload = function() {
                const blob = xhr.response;
                const blobUrl = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename || metadata.name || 'download';
                document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);
            };

            xhr.onerror = function() {
                console.error('Download failed, opening in new tab');
                window.open(url, '_blank');
            };

            xhr.open('GET', url);
            xhr.send();
        } catch (error) {
            console.error('Error downloading:', error);
            window.open(url, '_blank');
        }
    };

    // Display creatives gallery
    function displayCreativesGallery(creatives) {
        const placeholder = document.getElementById('galleryPlaceholder');
        const gallery = document.getElementById('creativesGallery');
        const grid = document.getElementById('creativesGrid');

        if (!creatives || creatives.length === 0) {
            if (placeholder) placeholder.style.display = 'block';
            if (gallery) gallery.style.display = 'none';
            return;
        }

        if (placeholder) placeholder.style.display = 'none';
        if (gallery) gallery.style.display = 'block';

        if (grid) {
            grid.innerHTML = creatives.map((creative, index) => {
                const isVideo = creative.type && creative.type.startsWith('video/');

                return `
                <div style="background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.06); transition: all 0.3s ease;">
                    ${isVideo ? `
                        <div style="position: relative; width: 100%; aspect-ratio: 1/1; background: #000;">
                            <video src="${creative.url}" style="width: 100%; height: 100%; object-fit: cover; display: block;"></video>
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.5rem; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); pointer-events: none;">▶️</div>
                        </div>
                    ` : `
                        <img src="${creative.url}" alt="${creative.name}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block;">
                    `}
                    <div style="padding: 4px;">
                        <div style="color: #012E40; font-weight: 600; font-size: 0.6rem; margin-bottom: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${isVideo ? '🎬 ' : ''}${creative.name || `Creative ${index + 1}`}</div>
                        <div style="color: #6b7280; font-size: 0.55rem; margin-bottom: 4px;">${isVideo ? 'Video' : (creative.type || 'Image')}</div>
                        <div style="display: flex; gap: 2px;">
                            <button onclick="window.openLightbox(${index})" style="flex: 1; padding: 3px 4px; background: #E8F5F3; color: #05908C; border: 1px solid #05908C; border-radius: 2px; font-size: 0.6rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#D1F2EB'" onmouseout="this.style.background='#E8F5F3'">
                                👁️
                            </button>
                            <button onclick="downloadFile('${creative.url}', '${creative.name || `creative-${index + 1}`}')" style="flex: 1; padding: 3px 4px; background: #05908C; color: white; border: none; border-radius: 2px; font-size: 0.6rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#047a77'" onmouseout="this.style.background='#05908C'">
                                📥
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }

        // Store creatives globally for lightbox
        window.currentCreatives = creatives;
    }

    // Open lightbox to view creative full-size
    window.openLightbox = function(index) {
        const creatives = window.currentCreatives;
        if (!creatives || !creatives[index]) return;

        const creative = creatives[index];
        const isVideo = creative.type && creative.type.startsWith('video/');

        const lightbox = document.createElement('div');
        lightbox.id = 'creativeLightbox';
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(1, 46, 64, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        lightbox.innerHTML = `
            <div style="position: relative; max-width: 90vw; max-height: 90vh;">
                <button onclick="window.closeLightbox()" style="position: absolute; top: -40px; right: 0; background: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">&times;</button>
                ${isVideo ? `
                    <video src="${creative.url}" controls autoplay style="max-width: 100%; max-height: 90vh; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                        Your browser does not support the video tag.
                    </video>
                ` : `
                    <img src="${creative.url}" alt="${creative.name}" style="max-width: 100%; max-height: 90vh; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                `}
                <div style="text-align: center; margin-top: 15px; color: white;">
                    <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 5px;">${isVideo ? '🎬 ' : ''}${creative.name || `Creative ${index + 1}`}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${index + 1} of ${creatives.length}</div>
                </div>
            </div>
        `;

        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';

        // Close on background click
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                window.closeLightbox();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', handleLightboxEscape);
    };

    function handleLightboxEscape(e) {
        if (e.key === 'Escape') {
            window.closeLightbox();
        }
    }

    // Close lightbox
    window.closeLightbox = function() {
        const lightbox = document.getElementById('creativeLightbox');
        if (lightbox) {
            lightbox.remove();
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleLightboxEscape);
        }
    };

    // Setup drag & drop for brand assets
    document.addEventListener('DOMContentLoaded', function() {
        const dropZone = document.getElementById('brandAssetsDropZone');
        const fileInput = document.getElementById('brandAssetsInput');

        if (dropZone && fileInput) {
            dropZone.onclick = () => fileInput.click();

            dropZone.ondragover = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#F2A922';
                dropZone.style.background = '#FBE9D1';
            };

            dropZone.ondragleave = () => {
                dropZone.style.borderColor = '#F2A922';
                dropZone.style.background = 'white';
            };

            dropZone.ondrop = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#F2A922';
                dropZone.style.background = 'white';
                fileInput.files = e.dataTransfer.files;
                window.handleBrandAssetsUpload(fileInput);
            };
        }
    });

    // Reset Portal Data Function
    window.resetClientPortal = async function() {
        if (!confirm('Are you sure you want to reset all portal data? This action cannot be undone.')) {
            return;
        }

        try {
            const clientId = new URLSearchParams(window.location.search).get('id');
            if (!clientId) {
                alert('No client ID found');
                return;
            }

            // Reset all client data to initial state
            await db.collection('clients').doc(clientId).update({
                currentStep: 0,
                completedSteps: [],
                agreementsAccepted: false,
                paymentCompleted: false,
                brandKitCompleted: false,
                metaSetupCompleted: false,
                trackingSetupCompleted: false,
                creativesApproved: false,
                brandColors: [],
                brandPrimaryColor: null,
                brandSecondaryColor: null,
                brandLogoUrl: null,
                brandAssets: [],
                creatives: [],
                metaBusinessManagerId: null,
                metaAdAccountId: null,
                metaPageId: null,
                metaPixelId: null,
                ga4PropertyId: null,
                ga4MeasurementId: null,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Portal data has been reset successfully. The page will now reload.');
            window.location.reload();
        } catch (error) {
            console.error('Error resetting portal:', error);
            alert('Error resetting portal data: ' + error.message);
        }
    };

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

    // Global error boundary - catch unhandled errors
    window.addEventListener('error', function(event) {
        console.error('Critical error:', event.error);
        showErrorBoundary('An unexpected error occurred. Please refresh the page or contact support.');
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        showErrorBoundary('A connection error occurred. Please check your internet connection and try again.');
    });

    function showErrorBoundary(message) {
        const errorBoundary = document.getElementById('errorBoundary');
        const errorMessage = document.getElementById('errorMessage');
        const loadingScreen = document.getElementById('loadingScreen');

        if (errorMessage) {
            errorMessage.textContent = message;
        }
        if (errorBoundary) {
            errorBoundary.style.display = 'flex';
        }
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
})();
