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

// ===== STRIPE LINK MANAGEMENT (NEW) =====
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
    document.getElementById('paymentTermText').textContent = termText;
    
    // Update the payment button
    window.updatePaymentButton();
};

window.updatePaymentButton = function() {
    const sowTerm = window.getCurrentSOWTerm();
    const paymentType = window.getCurrentPaymentType();
    const stripeBtn = document.getElementById('stripeBtn');
    
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
    uploadBtn.href = link;
};

window.updateCreativeGallery = function(link) {
    const gallery = document.getElementById('galleryPlaceholder');
    
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
    progressFill.style.width = percentage + '%';
    
    // Update progress text
    const progressText = document.getElementById('progressText');
    progressText.textContent = `${completedSteps} of ${totalSteps} steps completed`;
    
    // Update percentage
    const progressPercent = document.getElementById('progressPercent');
    progressPercent.textContent = percentage + '%';
    
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
    
    // Update progress bar
    window.updateProgressBar();
};

window.showSuccessMessage = function() {
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('successMessage').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
};

window.markStepComplete = function(stepNum) {
    window.portalState[stepNum.toString()] = true;
    window.saveState();
    window.updateStepStates();
    
    // Show completion feedback
    const stepElement = document.getElementById(`step${stepNum}`);
    const completeBtn = stepElement.querySelector('.btn-complete');
    
    // Add visual feedback
    completeBtn.style.transform = 'scale(1.05)';
    completeBtn.style.background = '#85C7B3';
    
    setTimeout(() => {
        completeBtn.style.transform = '';
    }, 200);
    
    // Check if all steps are complete
    const allComplete = Object.keys(window.portalState).filter(key => 
        key !== 'admin' && key !== 'creativeLink' && key !== 'stripeLinks' && key !== 'googleDriveLink' && window.portalState[key]
    ).length === 5;
    
    if (allComplete) {
        setTimeout(() => {
            window.showSuccessMessage();
        }, 500);
    }
    
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
            document.getElementById('existingBusinessSuite').style.display = 'none';
            document.getElementById('newBusinessSuite').style.display = 'none';
            document.getElementById('unsureBusinessSuiteDiv').style.display = 'none';
            
            // Show appropriate form
            if (this.value === 'yes') {
                document.getElementById('existingBusinessSuite').style.display = 'block';
            } else if (this.value === 'no') {
                document.getElementById('newBusinessSuite').style.display = 'block';
            } else if (this.value === 'unsure') {
                document.getElementById('unsureBusinessSuiteDiv').style.display = 'block';
            }
        });
    });

    // Website access options
    const websiteRadios = document.querySelectorAll('input[name="websiteAccess"]');
    websiteRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Hide all forms first
            document.getElementById('connectAdminForm').style.display = 'none';
            document.getElementById('tempAccessForm').style.display = 'none';
            
            // Show appropriate form
            if (this.value === 'connect') {
                document.getElementById('connectAdminForm').style.display = 'block';
            } else if (this.value === 'temporary') {
                document.getElementById('tempAccessForm').style.display = 'block';
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

    // Help buttons
    const helpButtons = ['metaHelpBtn', 'checkHelpBtn'];
    helpButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const mailtoLink = `mailto:${window.DLM_CONFIG.support.opsEmail}?subject=Need Help with Meta Business Suite Setup`;
                window.open(mailtoLink);
            });
        }
    });

    // Setup help button
    const setupHelpBtn = document.getElementById('setupHelpBtn');
    if (setupHelpBtn) {
        setupHelpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.emailSetupRequest();
        });
    }

    // Approve button
    const approveBtn = document.getElementById('approveBtn');
    if (approveBtn) {
        approveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to approve these creatives for launch?')) {
                window.markStepComplete(5);
                alert('Creatives approved! Your campaign will launch within 24-48 hours.');
            }
        });
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portal initializing...');
    
    // Load state first
    window.loadState();
    
    // Initialize external links
    document.getElementById('msaBtn').href = window.DLM_CONFIG.docuSign.msa;
    document.getElementById('dpaBtn').href = window.DLM_CONFIG.docuSign.dpa;
    
    // Set Google Drive Upload URL (custom or default)
    const googleDriveLink = window.portalState.googleDriveLink || window.DLM_CONFIG.uploads.driveFileRequestUrl;
    document.getElementById('uploadBtn').href = googleDriveLink;
    
    // Initialize SOW button and payment options
    window.updateSOWButton();
    window.updatePaymentOptions();
    
    // Display config values
    document.getElementById('metaEmailDisplay').textContent = window.DLM_CONFIG.support.opsEmail;
    document.getElementById('contactEmail').textContent = window.DLM_CONFIG.support.opsEmail;
    document.getElementById('contactPhone').textContent = window.DLM_CONFIG.support.opsPhone;
    
    // Initialize UI
    window.updateStepStates();
    
    // Initialize creative gallery
    if (window.portalState.creativeLink) {
        window.updateCreativeGallery(window.portalState.creativeLink);
    }
    
    // Setup all event listeners
    window.setupEventListeners();
    
    // Password field Enter key
    document.getElementById('adminPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.adminLogin();
        }
    });
    
    console.log('Portal initialization complete!');
});

// Close admin panel when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('adminPanel');
    const toggle = document.getElementById('adminToggle');
    
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
        panel.style.display = 'none';
    }
});
