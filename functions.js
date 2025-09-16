// ===== DRIVE LEAD MEDIA PORTAL FUNCTIONS =====
// All the JavaScript functionality for the portal

// ===== ADMIN FUNCTIONS =====
window.toggleAdminPanel = function() {
    console.log('Admin panel toggle clicked!');
    const panel = document.getElementById('adminPanel');
    const isVisible = panel.style.display !== 'none';

    if (isVisible) {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';

        // Check if already logged in
        if (window.isAdminLoggedIn()) {
            document.getElementById('adminControls').style.display = 'block';
            document.getElementById('adminLogin').style.display = 'none';
            window.loadAdminLinks();
        } else {
            document.getElementById('adminControls').style.display = 'none';
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminPassword').value = '';
        }
    }
};

window.isAdminLoggedIn = function() {
    const loginTime = localStorage.getItem('dlm_admin_login');
    if (!loginTime) return false;

    const now = Date.now();
    const elapsed = now - parseInt(loginTime);

    if (elapsed > window.DLM_CONFIG.admin.sessionTimeout) {
        localStorage.removeItem('dlm_admin_login');
        return false;
    }

    return true;
};

window.adminLogin = function() {
    console.log('Admin login attempted');
    const password = document.getElementById('adminPassword').value;

    if (password === window.DLM_CONFIG.admin.password) {
        localStorage.setItem('dlm_admin_login', Date.now().toString());
        document.getElementById('adminControls').style.display = 'block';
        document.getElementById('adminLogin').style.display = 'none';

        window.loadAdminLinks();
        window.showAdminStatus('✓ Admin logged in', 'success');
    } else {
        window.showAdminStatus('✗ Invalid password', 'error');
        document.getElementById('adminPassword').value = '';
    }
};

window.loadAdminLinks = function() {
    // Load creative link
    const existingCreativeLink = window.portalState.creativeLink;
    if (existingCreativeLink) {
        document.getElementById('creativeLink').value = existingCreativeLink;
    }

    // Load Google Drive link
    const existingGoogleDriveLink = window.portalState.googleDriveLink;
    if (existingGoogleDriveLink) {
        document.getElementById('googleDriveLink').value = existingGoogleDriveLink;
    }

    // Load Stripe links
    const stripeLinks = window.portalState.stripeLinks;
    if (stripeLinks.sow6.monthly) {
        document.getElementById('stripe6Monthly').value = stripeLinks.sow6.monthly;
    }
    if (stripeLinks.sow6.upfront) {
        document.getElementById('stripe6Upfront').value = stripeLinks.sow6.upfront;
    }
    if (stripeLinks.sow12.monthly) {
        document.getElementById('stripe12Monthly').value = stripeLinks.sow12.monthly;
    }
    if (stripeLinks.sow12.upfront) {
        document.getElementById('stripe12Upfront').value = stripeLinks.sow12.upfront;
    }
};

window.showAdminStatus = function(message, type) {
    const status = document.getElementById('adminStatus');
    status.textContent = message;
    status.className = `admin-status ${type}`;
    status.style.display = 'block';

    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
};

// ===== CREATIVE LINK MANAGEMENT =====
window.setCreativeLink = function() {
    const link = document.getElementById('creativeLink').value.trim();

    if (!link) {
        window.showAdminStatus('✗ Please enter a link', 'error');
        return;
    }

    try {
        new URL(link);
    } catch {
        window.showAdminStatus('✗ Please enter a valid URL', 'error');
        return;
    }

    window.portalState.creativeLink = link;
    window.saveState();
    window.updateCreativeGallery(link);
    window.showAdminStatus('✓ Creative link set successfully', 'success');
};

window.removeCreativeLink = function() {
    window.portalState.creativeLink = null;
    window.saveState();
    window.updateCreativeGallery(null);
    document.getElementById('creativeLink').value = '';
    window.showAdminStatus('✓ Creative link removed', 'success');
};

// ===== GOOGLE DRIVE LINK MANAGEMENT =====
window.setGoogleDriveLink = function() {
    const link = document.getElementById('googleDriveLink').value.trim();

    if (!link) {
        window.showAdminStatus('✗ Please enter a Google Drive link', 'error');
        return;
    }

    try {
        new URL(link);
    } catch {
        window.showAdminStatus('✗ Please enter a valid URL', 'error');
        return;
    }

    window.portalState.googleDriveLink = link;
    window.saveState();
    window.updateUploadButton(link);
    window.showAdminStatus('✓ Google Drive link set successfully', 'success');
};

window.removeGoogleDriveLink = function() {
    window.portalState.googleDriveLink = null;
    window.saveState();
    window.updateUploadButton(window.DLM_CONFIG.uploads.driveFileRequestUrl);
    document.getElementById('googleDriveLink').value = '';
    window.showAdminStatus('✓ Google Drive link reset to default', 'success');
};

// ===== STRIPE LINK MANAGEMENT (ENHANCED) =====
window.setStripeLink = function(sowTerm, paymentType) {
    const inputId = `stripe${sowTerm === 'sow6' ? '6' : '12'}${paymentType === 'monthly' ? 'Monthly' : 'Upfront'}`;
    const link = document.getElementById(inputId).value.trim();

    if (!link) {
        window.showAdminStatus(`✗ Please enter a ${sowTerm} ${paymentType} link`, 'error');
        return;
    }

    try {
        new URL(link);
    } catch {
        window.showAdminStatus('✗ Please enter a valid URL', 'error');
        return;
    }

    window.portalState.stripeLinks[sowTerm][paymentType] = link;
    window.saveState();
    window.updatePaymentButton();
    window.showAdminStatus(`✓ ${sowTerm} ${paymentType} link set successfully`, 'success');
};

window.removeStripeLink = function(sowTerm, paymentType) {
    const inputId = `stripe${sowTerm === 'sow6' ? '6' : '12'}${paymentType === 'monthly' ? 'Monthly' : 'Upfront'}`;

    window.portalState.stripeLinks[sowTerm][paymentType] = null;
    window.saveState();
    document.getElementById(inputId).value = '';
    window.updatePaymentButton();
    window.showAdminStatus(`✓ ${sowTerm} ${paymentType} link reset to default`, 'success');
};

// ===== PAYMENT SYSTEM FUNCTIONS =====
window.getCurrentSOWTerm = function() {
    const sow12Radio = document.getElementById('sow12');
    return (sow12Radio && sow12Radio.checked) ? 'sow12' : 'sow6';
};

window.getCurrentPaymentType = function() {
    const upfrontRadio = document.getElementById('paymentUpfront');
    return (upfrontRadio && upfrontRadio.checked) ? 'upfront' : 'monthly';
};

window.updatePaymentOptions = function() {
    const sowTerm = window.getCurrentSOWTerm();
    const termText = sowTerm === 'sow12' ? '12-Month' : '6-Month';

    // Update the payment term display
    const paymentTermTextElement = document.getElementById('paymentTermText');
    if (paymentTermTextElement) {
        paymentTermTextElement.textContent = termText;
    }

    // Update the payment button
    window.updatePaymentButton();
};

window.updatePaymentButton = function() {
    const sowTerm = window.getCurrentSOWTerm();
    const paymentType = window.getCurrentPaymentType();
    const stripeBtn = document.getElementById('stripeBtn');

    if (!stripeBtn) return;

    // Get the appropriate link (custom or default)
    let paymentLink;
    const customLink = window.portalState.stripeLinks[sowTerm][paymentType];
    if (customLink) {
        paymentLink = customLink;
    } else {
        paymentLink = window.DLM_CONFIG.stripeLinks[sowTerm][paymentType];
    }

    // Update button text
    const termText = sowTerm === 'sow12' ? '12-Month' : '6-Month';
    const typeText = paymentType === 'upfront' ? 'Upfront Payment (5% Discount)' : 'Monthly Payment';
    stripeBtn.textContent = `Set Up ${typeText}`;
    stripeBtn.href = paymentLink;
};

// ===== BUTTON UPDATE FUNCTIONS =====
window.updateUploadButton = function(link) {
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.href = link;
    }
};

window.updateCreativeGallery = function(link) {
    const gallery = document.getElementById('galleryPlaceholder');
    
    if (!gallery) return;

    if (link) {
        gallery.innerHTML = `
            <div style="text-align: center;">
                <p style="color: #012E40; margin-bottom: 15px; font-weight: 600;">🎨 Your Creative Previews Are Ready!</p>
                <a href="${link}" class="btn" target="_blank" rel="noopener" style="margin-bottom: 15px;">
                    View Creative Previews
                </a>
                <p style="font-size: 0.9rem; color: #85C7B3;">
                    Review all creatives, then return here to approve or request changes
                </p>
            </div>
        `;
    } else {
        gallery.innerHTML = `
            <p>Creative previews will be shared via secure link</p>
            <p style="font-size: 0.9rem; color: #85C7B3; margin-top: 10px;">
                Links will be provided once creatives are ready for review
            </p>
        `;
    }
};

// ===== PROGRESS BAR FUNCTIONS =====
window.updateProgressBar = function() {
    const completedSteps = Object.keys(window.portalState).filter(key => 
        key !== 'admin' && key !== 'creativeLink' && key !== 'stripeLinks' && key !== 'googleDriveLink' && window.portalState[key]
    ).length;

    const totalSteps = 5;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    // Update progress bar fill
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }

    // Update progress text
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = `${completedSteps} of ${totalSteps} steps completed`;
    }

    // Update percentage
    const progressPercent = document.getElementById('progressPercent');
    if (progressPercent) {
        progressPercent.textContent = percentage + '%';
    }

    return { completedSteps, totalSteps, percentage };
};

// ===== UTILITY FUNCTIONS =====
window.loadState = function() {
    try {
        const saved = localStorage.getItem(window.STORAGE_KEY);
        if (saved) {
            const savedState = JSON.parse(saved);
            // Merge with default state to ensure new properties exist
            window.portalState = { 
                ...window.portalState, 
                ...savedState,
                // Ensure stripeLinks structure exists
                stripeLinks: {
                    ...window.portalState.stripeLinks,
                    ...savedState.stripeLinks
                }
            };
        }
    } catch (e) {
        console.warn('Could not load portal state:', e);
    }
};

window.saveState = function() {
    try {
        localStorage.setItem(window.STORAGE_KEY, JSON.stringify(window.portalState));
    } catch (e) {
        console.warn('Could not save portal state:', e);
    }
};

window.updateStepStates = function() {
    for (let i = 1; i <= 5; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (!stepElement) continue;
        
        const isCompleted = window.portalState[i.toString()];
        const isUnlocked = i === 1 || window.portalState[(i - 1).toString()];

        stepElement.classList.toggle('completed', isCompleted);
        stepElement.classList.toggle('locked', !isUnlocked);

        // Update complete button text if step is completed
        const completeBtn = stepElement.querySelector('.btn-complete');
        if (completeBtn) {
            if (isCompleted) {
                completeBtn.textContent = `✓ Step ${i} Completed`;
                completeBtn.disabled = true;
            } else {
                completeBtn.textContent = `Mark Step ${i} Complete`;
                completeBtn.disabled = false;
            }
        }
    }

    // Update progress bar and sidebar
    window.updateProgressBar();
    if (window.updateSidebar) {
        window.updateSidebar();
    }
};

window.showSuccessMessage = function() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.style.display = 'block';
        successMessage.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
};

window.markStepComplete = function(stepNum) {
    window.portalState[stepNum.toString()] = true;
    window.saveState();
    window.updateStepStates();

    // Show completion feedback
    const stepElement = document.getElementById(`step${stepNum}`);
    if (stepElement) {
        const completeBtn = stepElement.querySelector('.btn-complete');
        if (completeBtn) {
            // Add visual feedback
            completeBtn.style.transform = 'scale(1.05)';
            completeBtn.style.background = '#85C7B3';

            setTimeout(() => {
                completeBtn.style.transform = '';
            }, 200);
        }
    }

    // Trigger animations if enabled
    if (window.DLM_CONFIG.ui.enableAnimations) {
        if (window.animateStepCompletion) {
            window.animateStepCompletion(stepNum);
        }
    }

    // Check if all steps are complete
    const allComplete = Object.keys(window.portalState).filter(key => 
        key !== 'admin' && key !== 'creativeLink' && key !== 'stripeLinks' && key !== 'googleDriveLink' && window.portalState[key]
    ).length === 5;

    if (allComplete) {
        setTimeout(() => {
            window.showSuccessMessage();
        }, 500);
    }

    // Send webhook if configured
    if (window.DLM_CONFIG.support.webhookUrl) {
        window.sendWebhook({
            step: stepNum,
            completedAt: new Date().toISOString(),
            action: 'step_completed'
        });
    }
};

// ===== SOW BUTTON UPDATE FUNCTION =====
window.updateSOWButton = function() {
    const sow6Radio = document.getElementById('sow6');
    const sow12Radio = document.getElementById('sow12');
    const sowBtn = document.getElementById('sowBtn');

    if (!sowBtn) return;

    if (sow12Radio && sow12Radio.checked) {
        sowBtn.textContent = 'Sign SOW (12-month)';
        sowBtn.href = window.DLM_CONFIG.docuSign.sow12;
    } else {
        sowBtn.textContent = 'Sign SOW (6-month)';
        sowBtn.href = window.DLM_CONFIG.docuSign.sow6;
    }

    // Update payment options when SOW term changes
    window.updatePaymentOptions();
};

// ===== EMAIL FUNCTIONS =====
window.emailAdminDetails = function() {
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
    const body = `Website Admin Contact Details:


Name: ${adminName || 'Not provided'}
Email: ${adminEmail}
Phone: ${adminPhone || 'Not provided'}
Platform: ${platformText || 'Not specified'}

Please contact them to coordinate tracking installation.`;

    const mailtoLink = `mailto:${window.DLM_CONFIG.support.opsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
};

window.emailAccessDetails = function() {
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
    const body = `Temporary Website Access Details:


Website URL: ${websiteUrl}
Login URL: ${loginUrl || 'Not provided'}
Username: ${username}
Password: ${password}
Platform: ${platformText || 'Not specified'}

Please install tracking and remove access when complete.`;

    const mailtoLink = `mailto:${window.DLM_CONFIG.support.opsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
};

window.emailRevisionRequest = function() {
    const name = document.getElementById('revisionName').value;
    const email = document.getElementById('revisionEmail').value;
    const notes = document.getElementById('revisionNotes').value;

    if (!name || !email || !notes) {
        alert('Please fill in all required fields');
        return;
    }

    const subject = 'Creative Revision Request - Client Portal';
    const body = `Creative Revision Request:


Client Name: ${name}
Client Email: ${email}

Revision Notes:
${notes}`;

    const mailtoLink = `mailto:${window.DLM_CONFIG.support.opsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
};

window.emailSetupRequest = function() {
    // Get selected days
    const selectedDays = [];
    document.querySelectorAll('input[name="setupDays"]:checked').forEach(checkbox => {
        selectedDays.push(checkbox.value);
    });

    const setupTime = document.getElementById('setupTime').value;
    const setupPhone = document.getElementById('setupPhone').value;
    const setupTimezone = document.getElementById('setupTimezone').value;

    if (selectedDays.length === 0 || !setupTime || !setupPhone || !setupTimezone) {
        alert('Please fill in all fields to schedule your setup call');
        return;
    }

    const subject = 'Meta Business Suite Setup Call Request - Client Portal';
    const body = `Meta Business Suite Setup Call Request:

Preferred Days: ${selectedDays.join(', ')}
Best Time: ${setupTime}
Phone Number: ${setupPhone}
Time Zone: ${setupTimezone}

Please schedule a setup call to help create Meta Business Suite account.`;

    const mailtoLink = `mailto:${window.DLM_CONFIG.support.opsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
};

// ===== COPY TO CLIPBOARD FUNCTION =====
window.copyRevisionToClipboard = function() {
    const name = document.getElementById('revisionName').value;
    const email = document.getElementById('revisionEmail').value;
    const notes = document.getElementById('revisionNotes').value;

    if (!name || !email || !notes) {
        alert('Please fill in all required fields');
        return;
    }

    const text = `Creative Revision Request:


Client Name: ${name}
Client Email: ${email}

Revision Notes:
${notes}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Revision details copied to clipboard!');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
};

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        alert('Revision details copied to clipboard!');
    } catch (err) {
        alert('Could not copy to clipboard. Please copy manually.');
    }
    document.body.removeChild(textArea);
}

// ===== WEBHOOK FUNCTION =====
window.sendWebhook = function(data) {
    if (!window.DLM_CONFIG.support.webhookUrl) return;

    fetch(window.DLM_CONFIG.support.webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch(err => {
        console.warn('Webhook failed:', err);
    });
};

// ===== RESET PROGRESS FUNCTION =====
window.resetProgress = function() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        localStorage.removeItem(window.STORAGE_KEY);
        localStorage.removeItem('dlm_admin_login');
        location.reload();
    }
};

// ===== ENHANCED ANIMATIONS SYSTEM =====
let isFireworksActive = false;

// ===== SIDEBAR MANAGEMENT =====
window.initializeSidebar = function() {
    const sidebarSteps = document.getElementById('sidebarSteps');
    if (!sidebarSteps) return;
    
    const stepLabels = ['Agreements', 'Payment', 'Meta Setup', 'Tracking', 'Approval'];
    
    sidebarSteps.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const stepDiv = document.createElement('div');
        stepDiv.className = getStepClass(i);
        stepDiv.textContent = i;
        stepDiv.onclick = () => navigateToStep(i);
        
        const label = document.createElement('div');
        label.className = 'step-label';
        label.textContent = stepLabels[i - 1];
        stepDiv.appendChild(label);
        
        sidebarSteps.appendChild(stepDiv);
    }
};

function getStepClass(stepNum) {
    if (window.portalState && window.portalState[stepNum.toString()]) return 'sidebar-step completed';
    
    // Check if step is currently active (unlocked)
    const isUnlocked = stepNum === 1 || (window.portalState && window.portalState[(stepNum - 1).toString()]);
    if (isUnlocked && (!window.portalState || !window.portalState[stepNum.toString()])) return 'sidebar-step active';
    if (stepNum <= 5) return 'sidebar-step upcoming';
    return 'sidebar-step locked';
}

window.updateSidebar = function() {
    const sidebarSteps = document.querySelectorAll('.sidebar-step');
    const currentStepDisplay = document.getElementById('currentStepDisplay');
    
    // Calculate current step based on progress
    let activeStep = 1;
    if (window.portalState) {
        for (let i = 1; i <= 5; i++) {
            if (!window.portalState[i.toString()]) {
                activeStep = i;
                break;
            }
            if (i === 5) activeStep = 5; // All complete
        }
    }
    
    if (currentStepDisplay) {
        currentStepDisplay.textContent = activeStep;
    }
    
    sidebarSteps.forEach((step, index) => {
        step.className = getStepClass(index + 1);
    });
};

function navigateToStep(stepNum) {
    const isCompleted = window.portalState && window.portalState[stepNum.toString()];
    const isUnlocked = stepNum === 1 || (window.portalState && window.portalState[(stepNum - 1).toString()]);
    
    if (isCompleted || isUnlocked) {
        const stepElement = document.getElementById(`step${stepNum}`);
        if (stepElement) {
            stepElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

// ===== STEP COMPLETION ANIMATION =====
window.animateStepCompletion = function(stepNum) {
    if (!window.DLM_CONFIG.ui.enableAnimations) return;
    
    const stepElement = document.getElementById(`step${stepNum}`);
    if (!stepElement) return;
    
    const button = stepElement.querySelector('.btn-complete');
    if (button) {
        // Button celebration animation
        button.style.transform = 'scale(1.1)';
        button.style.background = '#85C7B3';
        
        setTimeout(() => {
            button.style.transform = '';
        }, 300);
    }
    
    // Mini celebration particles
    if (window.DLM_CONFIG.ui.enableParticleEffects) {
        createMiniCelebration(stepElement);
    }
};

function createMiniCelebration(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: #F2A922;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
        `;
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / 20;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 50;
        
        animateParticle(particle, vx, vy);
    }
}

function animateParticle(particle, vx, vy) {
    let x = 0, y = 0;
    const gravity = 2;
    let opacity = 1;
    
    function update() {
        vy += gravity;
        x += vx * 0.02;
        y += vy * 0.02;
        opacity -= 0.02;
        
        particle.style.transform = `translate(${x}px, ${y}px)`;
        particle.style.opacity = opacity;
        
        if (opacity > 0) {
            requestAnimationFrame(update);
        } else {
            particle.remove();
        }
    }
    
    requestAnimationFrame(update);
}

// ===== FIREWORKS SYSTEM =====
window.startFireworksShow = function() {
    if (!window.DLM_CONFIG.ui.enableFireworks || isFireworksActive) return;
    isFireworksActive = true;
    
    const canvas = document.getElementById('fireworksCanvas');
    const overlay = document.getElementById('celebrationOverlay');
    const message = document.getElementById('celebrationMessage');
    const subtitle = document.getElementById('celebrationSubtitle');
    
    if (!canvas) return;
    
    // Setup canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    // Show overlay and canvas
    overlay.classList.add('active');
    canvas.classList.add('active');
    
    // Show message after delay
    setTimeout(() => {
        message.classList.add('show');
        setTimeout(() => subtitle.classList.add('show'), 800);
    }, 1000);
    
    // Start fireworks
    const fireworks = [];
    const particles = [];
    
    // Firework class
    class Firework {
        constructor(x, y, targetX, targetY, color) {
            this.x = x;
            this.y = y;
            this.targetX = targetX;
            this.targetY = targetY;
            this.color = color;
            this.trail = [];
            this.speed = 3;
            this.angle = Math.atan2(targetY - y, targetX - x);
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }
        
        update() {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 10) this.trail.shift();
            
            this.x += this.vx;
            this.y += this.vy;
            
            const distance = Math.sqrt((this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2);
            
            if (distance < 10) {
                this.explode();
                return false;
            }
            return true;
        }
        
        explode() {
            const particleCount = 30 + Math.random() * 20;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(this.targetX, this.targetY, this.color));
            }
        }
        
        draw(ctx) {
            // Draw trail
            this.trail.forEach((point, index) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, (index / this.trail.length) * 3, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            });
        }
    }
    
    // Particle class
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
            this.life = 1;
            this.decay = Math.random() * 0.015 + 0.01;
            this.size = Math.random() * 3 + 2;
            this.gravity = 0.1;
        }
        
        update() {
            this.vx *= 0.99;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            return this.life > 0;
        }
        
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Brand colors for fireworks
    const colors = ['#F2A922', '#05908C', '#85C7B3', '#EEF4D9'];
    
    // Launch fireworks
    function launchFirework() {
        const startX = Math.random() * canvas.width;
        const startY = canvas.height;
        const targetX = Math.random() * canvas.width;
        const targetY = Math.random() * canvas.height * 0.6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        fireworks.push(new Firework(startX, startY, targetX, targetY, color));
    }
    
    // Animation loop
    function animate() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw fireworks
        for (let i = fireworks.length - 1; i >= 0; i--) {
            if (!fireworks[i].update()) {
                fireworks.splice(i, 1);
            } else {
                fireworks[i].draw(ctx);
            }
        }
        
        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].update()) {
                particles.splice(i, 1);
            } else {
                particles[i].draw(ctx);
            }
        }
        
        if (isFireworksActive) {
            requestAnimationFrame(animate);
        }
    }
    
    // Start animation
    animate();
    
    // Launch fireworks at intervals
    const launchInterval = setInterval(() => {
        if (Math.random() < 0.7) launchFirework();
    }, 300);
    
    // Launch multiple fireworks initially
    for (let i = 0; i < 5; i++) {
        setTimeout(() => launchFirework(), i * 200);
    }
    
    // End celebration after 8 seconds
    setTimeout(() => {
        clearInterval(launchInterval);
        
        setTimeout(() => {
            isFireworksActive = false;
            canvas.classList.remove('active');
            overlay.classList.remove('active');
            message.classList.remove('show');
            subtitle.classList.remove('show');
        }, 2000);
    }, 6000);
};

// ===== SCROLL MANAGEMENT =====
function handleScroll() {
    const scrollY = window.scrollY;
    const sidebar = document.getElementById('floatingSidebar');
    
    if (!sidebar) return;
    
    // Show/hide sidebar based on scroll
    if (scrollY > 100) {
        sidebar.classList.add('visible');
    } else {
        sidebar.classList.remove('visible');
    }
}

// ===== SETUP ALL EVENT LISTENERS =====
window.setupEventListeners = function() {
    // SOW term selection
    const sowRadios = document.querySelectorAll('input[name="sowTerm"]');
    sowRadios.forEach(radio => {
        radio.addEventListener('change', window.updateSOWButton);
    });

    // Payment type selection
    const paymentRadios = document.querySelectorAll('input[name="paymentType"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', window.updatePaymentButton);
    });

    // Meta setup options
    const metaRadios = document.querySelectorAll('input[name="metaSetup"]');
    metaRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Hide all forms first
            const existingForm = document.getElementById('existingBusinessSuite');
            const newForm = document.getElementById('newBusinessSuite');
            const unsureForm = document.getElementById('unsureBusinessSuiteDiv');
            
            if (existingForm) existingForm.style.display = 'none';
            if (newForm) newForm.style.display = 'none';
            if (unsureForm) unsureForm.style.display = 'none';

            // Show appropriate form
            if (this.value === 'yes' && existingForm) {
                existingForm.style.display = 'block';
            } else if (this.value === 'no' && newForm) {
                newForm.style.display = 'block';
            } else if (this.value === 'unsure' && unsureForm) {
                unsureForm.style.display = 'block';
            }
        });
    });

    // Website access options
    const websiteRadios = document.querySelectorAll('input[name="websiteAccess"]');
    websiteRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Hide all forms first
            const connectForm = document.getElementById('connectAdminForm');
            const tempForm = document.getElementById('tempAccessForm');
            
            if (connectForm) connectForm.style.display = 'none';
            if (tempForm) tempForm.style.display = 'none';

            // Show appropriate form
            if (this.value === 'connect' && connectForm) {
                connectForm.style.display = 'block';
            } else if (this.value === 'temporary' && tempForm) {
                tempForm.style.display = 'block';
            }
        });
    });

    // Platform selection handlers
    const platformSelects = [
        { select: 'websitePlatform', other: 'websitePlatformOther' },
        { select: 'sitePlatform', other: 'sitePlatformOther' }
    ];

    platformSelects.forEach(({ select, other }) => {
        const selectElement = document.getElementById(select);
        const otherInput = document.getElementById(other);

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

    // Info button toggles
    const infoButtons = [
        { btn: 'brandKitInfoBtn', info: 'brandKitInfo' },
        { btn: 'ga4InfoBtn', info: 'ga4Info' },
        { btn: 'pixelInfoBtn', info: 'pixelInfo' }
    ];

    infoButtons.forEach(({ btn, info }) => {
        const button = document.getElementById(btn);
        const infoDiv = document.getElementById(info);

        if (button && infoDiv) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const isVisible = infoDiv.style.display !== 'none';
                infoDiv.style.display = isVisible ? 'none' : 'block';
            });
        }
    });

    // Revision form toggle
    const revisionBtn = document.getElementById('revisionBtn');
    const revisionForm = document.getElementById('revisionForm');

    if (revisionBtn && revisionForm) {
        revisionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isVisible = revisionForm.style.display !== 'none';
            revisionForm.style.display = isVisible ? 'none' : 'block';
        });
    }

    // Email and copy buttons
    const emailAdminBtn = document.getElementById('emailAdminInfo');
    if (emailAdminBtn) {
        emailAdminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.emailAdminDetails();
        });
    }

    const emailAccessBtn = document.getElementById('emailAccessInfo');
    if (emailAccessBtn) {
        emailAccessBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.emailAccessDetails();
        });
    }

    const emailRevisionBtn = document.getElementById('emailRevision');
    if (emailRevisionBtn) {
        emailRevisionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.emailRevisionRequest();
        });
    }

    const copyRevisionBtn = document.getElementById('copyRevision');
    if (copyRevisionBtn) {
        copyRevisionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.copyRevisionToClipboard();
        });
    }

    // Reset progress
    const resetBtn = document.getElementById('resetProgress');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.resetProgress();
        });
    }

    // Setup help button
    const setupHelpBtn = document.getElementById('setupHelpBtn');
    if (setupHelpBtn) {
        setupHelpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.emailSetupRequest();
        });
    }

    // Approve button with fireworks
    const approveBtn = document.getElementById('approveBtn');
    if (approveBtn) {
        approveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.add('celebrating');
            
            if (window.DLM_CONFIG.ui.enableFireworks) {
                window.startFireworksShow();
                // Complete step after fireworks
                setTimeout(() => {
                    window.markStepComplete(5);
                }, 3000);
            } else {
                // Complete step immediately if fireworks disabled
                window.markStepComplete(5);
            }
        });
    }

    // Password field Enter key
    const adminPassword = document.getElementById('adminPassword');
    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.adminLogin();
            }
        });
    }

    // Scroll listener for sidebar
    if (window.DLM_CONFIG.ui.enableFloatingSidebar) {
        window.addEventListener('scroll', handleScroll);
    }

    // Handle window resize for canvas
    window.addEventListener('resize', () => {
        const canvas = document.getElementById('fireworksCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Portal initializing...');

    // ⭐ STEP 1: Load state FIRST
    window.loadState();
    console.log('📁 State loaded:', window.portalState);

    // ⭐ STEP 2: Initialize external links
    const msaBtn = document.getElementById('msaBtn');
    const dpaBtn = document.getElementById('dpaBtn');
    
    if (msaBtn) msaBtn.href = window.DLM_CONFIG.docuSign.msa;
    if (dpaBtn) dpaBtn.href = window.DLM_CONFIG.docuSign.dpa;

    // Set Google Drive Upload URL (custom or default)
    const googleDriveLink = window.portalState.googleDriveLink || window.DLM_CONFIG.uploads.driveFileRequestUrl;
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.href = googleDriveLink;

    // ⭐ STEP 3: Initialize UI components
    window.updateSOWButton();
    window.updatePaymentOptions();

    // ⭐ STEP 4: Update step states AND progress bar
    window.updateStepStates();
    
    // ⭐ STEP 5: Force progress bar update (CRITICAL FIX!)
    const progressResults = window.updateProgressBar();
    console.log('📊 Progress bar updated:', progressResults);

    // Display config values
    const metaEmailDisplay = document.getElementById('metaEmailDisplay');
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    
    if (metaEmailDisplay) metaEmailDisplay.textContent = window.DLM_CONFIG.support.opsEmail;
    if (contactEmail) contactEmail.textContent = window.DLM_CONFIG.support.opsEmail;
    if (contactPhone) contactPhone.textContent = window.DLM_CONFIG.support.opsPhone;

    // Initialize creative gallery if link exists
    if (window.portalState.creativeLink) {
        window.updateCreativeGallery(window.portalState.creativeLink);
    }

    // ⭐ STEP 6: Initialize animations and sidebar if enabled
    if (window.DLM_CONFIG.ui.enableAnimations) {
        console.log('🎨 Initializing animations...');
        window.initializeSidebar();
        window.updateSidebar();
        
        // Add sidebar hover effects
        const sidebar = document.getElementById('floatingSidebar');
        if (sidebar) {
            sidebar.addEventListener('mouseenter', () => {
                sidebar.classList.add('expanded');
            });
            
            sidebar.addEventListener('mouseleave', () => {
                sidebar.classList.remove('expanded');
            });
        }
    }

    // Setup all event listeners
    window.setupEventListeners();

    console.log('✅ Portal initialization complete!');
    console.log('🎯 Progress bar should now be working...');
    
    // ⭐ FINAL DEBUG: Log current progress state
    setTimeout(() => {
        const finalProgressResults = window.updateProgressBar();
        console.log('🔍 Final progress check:', finalProgressResults);
        
        // Check if progress bar elements exist and have values
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressPercent = document.getElementById('progressPercent');
        
        console.log('🎛️ Progress bar elements:', {
            progressFill: progressFill ? progressFill.style.width : 'NOT FOUND',
            progressText: progressText ? progressText.textContent : 'NOT FOUND',
            progressPercent: progressPercent ? progressPercent.textContent : 'NOT FOUND'
        });
    }, 100);
});

// Close admin panel when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('adminPanel');
    const toggle = document.getElementById('adminToggle');

    if (panel && toggle && !panel.contains(e.target) && !toggle.contains(e.target)) {
        panel.style.display = 'none';
    }
});
