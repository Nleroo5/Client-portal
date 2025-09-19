(function() {
    // Portal State
    let portalState = {
        "1": false,
        "2": false,
        "3": false,
        "4": false,
        "5": false,
        "creativeLink": null,
        "googleDriveLink": null,
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

    // Core Functions - FIREBASE VERSION
    async function loadState() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('c');
        
        if (!clientId) {
            document.body.innerHTML = '<div style="text-align:center; padding:50px; background:#EEF4D9; color:#012E40;"><h1>Invalid Access Link</h1><p>Please use the link provided by Drive Lead Media.</p></div>';
            return;
        }
        
        try {
            const doc = await db.collection('clients').doc(clientId).get();
            
            if (!doc.exists) {
                document.body.innerHTML = '<div style="text-align:center; padding:50px; background:#EEF4D9; color:#012E40;"><h1>Portal Not Found</h1><p>Please contact Drive Lead Media for assistance.</p></div>';
                return;
            }
            
            const data = doc.data();
            
            if (!data.active) {
                document.body.innerHTML = '<div style="text-align:center; padding:50px; background:#EEF4D9; color:#012E40;"><h1>Portal Inactive</h1><p>Please contact Drive Lead Media.</p></div>';
                return;
            }
            
            // Load progress
            portalState['1'] = data.step1Complete || false;
            portalState['2'] = data.step2Complete || false;
            portalState['3'] = data.step3Complete || false;
            portalState['4'] = data.step4Complete || false;
            portalState['5'] = data.step5Complete || false;
            
            // Load custom links
            if (data.dpaLink) {
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
            
            if (data.googleDriveLink) {
                const uploadBtn = document.getElementById('uploadBtn');
                if (uploadBtn) uploadBtn.href = data.googleDriveLink;
            }
            
            if (data.creativeLink) {
                updateCreativeGallery(data.creativeLink);
            }
            
            // Store client ID for saving
            window.currentClientId = clientId;
            
            // Initialize after loading
            updateServiceButton();
            
        } catch (error) {
            console.error('Error loading:', error);
            document.body.innerHTML = '<div style="text-align:center; padding:50px; background:#EEF4D9; color:#012E40;"><h1>Loading Error</h1><p>Please refresh the page or contact support.</p></div>';
        }
    }

    async function saveState() {
        if (!window.currentClientId) return;
        
        try {
            await db.collection('clients').doc(window.currentClientId).update({
                step1Complete: portalState['1'],
                step2Complete: portalState['2'],
                step3Complete: portalState['3'],
                step4Complete: portalState['4'],
                step5Complete: portalState['5']
            });
        } catch (error) {
            console.error('Error saving:', error);
        }
    }

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

    function updateFloatingSidebar() {
        const { completedSteps, percentage } = updateProgressBar();
        
        // Update circle
        const circle = document.getElementById('sidebarProgressCircle');
        if (circle) {
            const offset = 126 - (percentage / 100 * 126);
            circle.style.strokeDashoffset = offset;
        }
        
        // Update percentage text
        const percentText = document.getElementById('sidebarProgressPercent');
        if (percentText) percentText.textContent = percentage + '%';
        
        // Update dynamic message
        const msg = document.getElementById('sidebarProgressMessage');
        if (msg) {
            if (percentage === 0) msg.textContent = "Let's get started!";
            else if (percentage === 20) msg.textContent = "Great beginning!";
            else if (percentage === 40) msg.textContent = "Making progress";
            else if (percentage === 60) msg.textContent = "Over halfway!";
            else if (percentage === 80) msg.textContent = "Almost there!";
            else if (percentage === 100) msg.textContent = "All complete! 🎉";
        }
        
        // Update step bubbles
        for (let i = 1; i <= 5; i++) {
            const bubble = document.getElementById(`sidebarBubble${i}`);
            if (bubble) {
                bubble.className = 'sidebar-step-bubble upcoming';
                if (portalState[i.toString()]) {
                    bubble.className = 'sidebar-step-bubble completed';
                } else if (i === 1 || portalState[(i - 1).toString()]) {
                    if (!portalState[i.toString()]) {
                        bubble.className = 'sidebar-step-bubble current';
                    }
                }
            }
        }
    }

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

    function updateCreativeGallery(link) {
        const gallery = document.getElementById('galleryPlaceholder');
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

    // Service Agreement and Payment Functions
    function updateServiceButton() {
        const service12 = document.getElementById('service12');
        const serviceBtn = document.getElementById('serviceBtn');
        if (service12 && serviceBtn) {
            if (service12.checked) {
                serviceBtn.textContent = 'Sign Service Agreement (12-month)';
                serviceBtn.href = (portalState.docuSignLinks?.service12) || DLM_CONFIG.docuSign.service12;
            } else {
                serviceBtn.textContent = 'Sign Service Agreement (6-month)';
                serviceBtn.href = (portalState.docuSignLinks?.service6) || DLM_CONFIG.docuSign.service6;
            }
            updatePaymentOptions();
        }
    }

    function updatePaymentOptions() {
        const serviceTerm = document.getElementById('service12')?.checked ? 'service12' : 'service6';
        const termText = serviceTerm === 'service12' ? '12-Month' : '6-Month';
        const paymentTermText = document.getElementById('paymentTermText');
        if (paymentTermText) paymentTermText.textContent = termText;
        updatePaymentButton();
    }

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
                paymentLink = DLM_CONFIG.stripeLinks[serviceTerm][paymentType];
            }
            stripeBtn.href = paymentLink;
        }
    }

    // Step 3 Functions
    function toggleBrandKitInfo() {
        const infoBox = document.getElementById('brandKitInfo');
        const isVisible = infoBox.style.display === 'block';
        infoBox.style.display = isVisible ? 'none' : 'block';
    }

    // Step 4 Functions
    function toggleGA4Info() {
        const infoBox = document.getElementById('ga4Info');
        const isVisible = infoBox.style.display === 'block';
        infoBox.style.display = isVisible ? 'none' : 'block';
    }

    function togglePixelInfo() {
        const infoBox = document.getElementById('pixelInfo');
        const isVisible = infoBox.style.display === 'block';
        infoBox.style.display = isVisible ? 'none' : 'block';
    }

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

    // Step 5 Functions
    function approveCreatives() {
        if (confirm('Approve creatives for launch?')) {
            markStepComplete(5);
            alert('Approved! Your campaign will launch within 24-48 hours.');
        }
    }

    function requestRevisions() {
        const form = document.getElementById('revisionForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }

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
    document.addEventListener('DOMContentLoaded', function() {
        loadState();
        updateStepStates();
        
        // Set DocuSign links (use custom if available, otherwise use default)
        const dpaBtn = document.getElementById('dpaBtn');
        
        if (dpaBtn) {
            dpaBtn.href = (portalState.docuSignLinks?.dpa) || DLM_CONFIG.docuSign.dpa;
        }
        
        // Set contact info
        document.getElementById('contactEmail').textContent = DLM_CONFIG.support.opsEmail;
        document.getElementById('contactPhone').textContent = DLM_CONFIG.support.opsPhone;
        
        // Initialize Service Agreement and payment
        updateServiceButton();
        
        // Load creative gallery
        if (portalState.creativeLink) {
            updateCreativeGallery(portalState.creativeLink);
        }
        
        // Set Google Drive link if custom one exists
        if (portalState.googleDriveLink) {
            const uploadBtn = document.getElementById('uploadBtn');
            if (uploadBtn) uploadBtn.href = portalState.googleDriveLink;
        }
        
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
                document.getElementById('connectAdminForm').style.display = 
                    this.value === 'connect' ? 'block' : 'none';
                document.getElementById('tempAccessForm').style.display = 
                    this.value === 'temporary' ? 'block' : 'none';
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
        
        console.log('✓ Portal initialized successfully');
    });

    // Expose all functions globally
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
