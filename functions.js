// ===== COMPLETE FIREWORKS SYSTEM & EVENT LISTENERS =====

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

    // STEP 1: Load state FIRST
    window.loadState();
    console.log('📁 State loaded:', window.portalState);

    // STEP 2: Initialize external links
    const msaBtn = document.getElementById('msaBtn');
    const dpaBtn = document.getElementById('dpaBtn');
    
    if (msaBtn) msaBtn.href = window.DLM_CONFIG.docuSign.msa;
    if (dpaBtn) dpaBtn.href = window.DLM_CONFIG.docuSign.dpa;

    // Set Google Drive Upload URL (custom or default)
    const googleDriveLink = window.portalState.googleDriveLink || window.DLM_CONFIG.uploads.driveFileRequestUrl;
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.href = googleDriveLink;

    // STEP 3: Initialize UI components
    window.updateSOWButton();
    window.updatePaymentOptions();

    // STEP 4: Update step states AND progress bar
    window.updateStepStates();
    
    // STEP 5: Force progress bar update
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

    // STEP 6: Initialize animations and sidebar if enabled
    if (window.DLM_CONFIG.ui.enableAnimations) {
        console.log('🎨 Initializing animations...');
        window.initializeSidebar();
        window.updateSidebar();
        
        // Add sidebar hover effects
        const sidebar = document.getElementById('floatingSidebar');
        if (sidebar) {
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
    
    // FINAL DEBUG: Log current progress state
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
