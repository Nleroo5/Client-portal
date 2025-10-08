(function() {
    // Form State
    let currentSection = 1;
    const totalSections = 12; // Total sections after removing Goals & Success
    let autoSaveTimer = null;
    let quoteData = {};

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', async () => {
        await loadFormData();
        updateProgressBar();
        setupAutoSave();
    });

    // Load form data from Firebase
    async function loadFormData() {
        const urlParams = new URLSearchParams(window.location.search);
        const quoteId = urlParams.get('id') || urlParams.get('c'); // Support both new 'id' and legacy 'c' parameter

        if (!quoteId) {
            // New quote - generate ID and redirect
            const newQuoteId = 'WQ_' + Date.now();
            window.location.href = `index-website-quote.html?c=${newQuoteId}`;
            return;
        }

        try {
            const doc = await db.collection('websiteQuotes').doc(quoteId).get();

            if (doc.exists) {
                // Load existing data
                quoteData = doc.data();
                populateForm(quoteData);
            } else {
                // Create new quote document
                quoteData = {
                    quoteId: quoteId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'incomplete',
                    completionPercent: 0
                };
                await db.collection('websiteQuotes').doc(quoteId).set(quoteData);
            }

            // Store quote ID globally
            window.currentQuoteId = quoteId;

            // Hide loading screen and show form
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('mainForm').style.display = 'block';

        } catch (error) {
            console.error('Error loading form:', error);
            showError('Failed to load form. Please refresh the page.');
        }
    }

    // Populate form with existing data
    function populateForm(data) {
        // Section 1: Business
        setValue('businessName', data.businessName);
        setValue('ownerName', data.ownerName);
        setValue('phone', data.phone);
        setValue('email', data.email);
        setValue('businessDescription', data.businessDescription);
        setValue('yearsInBusiness', data.yearsInBusiness);
        setValue('businessType', data.businessType);
        setValue('locations', data.locations);
        setValue('competitor1Url', data.competitor1Url);
        setValue('competitor2Url', data.competitor2Url);

        // Section 2: Current Website
        if (data.hasCurrentWebsite) {
            document.getElementById(`hasWebsite${data.hasCurrentWebsite === 'yes' ? 'Yes' : 'No'}`).checked = true;
            toggleCurrentWebsiteSection();
        }
        setValue('currentWebsiteUrl', data.currentWebsiteUrl);
        setValue('websiteAge', data.websiteAge);
        setValue('builtBy', data.builtBy);
        setValue('whatWorksWell', data.whatWorksWell);
        setValue('monthlyVisitors', data.monthlyVisitors);
        setValue('trafficSources', data.trafficSources);

        // Current website problems (checkboxes)
        if (data.currentProblems && Array.isArray(data.currentProblems)) {
            data.currentProblems.forEach(problem => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${problem}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Section 3: Websites They Like
        setValue('favoriteWebsiteUrl', data.favoriteWebsite?.url);
        setValue('likesAboutLook', data.favoriteWebsite?.likesAboutLook);

        // Restore function checkboxes
        if (data.favoriteWebsite?.likesAboutFunction && Array.isArray(data.favoriteWebsite.likesAboutFunction)) {
            data.favoriteWebsite.likesAboutFunction.forEach(func => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${func}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        setValue('likesAboutColors', data.favoriteWebsite?.likesAboutColors);
        setValue('likesAboutLayout', data.favoriteWebsite?.likesAboutLayout);

        // Restore specific features checkboxes
        if (data.favoriteWebsite?.specificFeatures && Array.isArray(data.favoriteWebsite.specificFeatures)) {
            data.favoriteWebsite.specificFeatures.forEach(feat => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${feat}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Section 5: Look & Feel
        // Restore logo file preview if exists
        if (data.logoUrl && data.logoFileName) {
            const preview = document.getElementById('logoPreview');
            const img = document.getElementById('logoPreviewImg');
            const fileName = document.getElementById('logoFileName');
            if (img && fileName && preview) {
                img.src = data.logoUrl;
                fileName.textContent = data.logoFileName;
                preview.style.display = 'block';
            }
        }

        setValue('colorMain', data.brandColors?.main);
        setValue('colorSecondary', data.brandColors?.secondary);
        setValue('colorAccent', data.brandColors?.accent);
        setValue('colorBackground', data.brandColors?.background);

        // Sync color pickers if hex colors exist
        if (data.brandColors?.main && data.brandColors.main.match(/^#[0-9A-F]{6}$/i)) {
            const picker = document.getElementById('colorMainPicker');
            if (picker) picker.value = data.brandColors.main;
        }
        if (data.brandColors?.secondary && data.brandColors.secondary.match(/^#[0-9A-F]{6}$/i)) {
            const picker = document.getElementById('colorSecondaryPicker');
            if (picker) picker.value = data.brandColors.secondary;
        }
        if (data.brandColors?.accent && data.brandColors.accent.match(/^#[0-9A-F]{6}$/i)) {
            const picker = document.getElementById('colorAccentPicker');
            if (picker) picker.value = data.brandColors.accent;
        }

        // Section 5: Customers (simplified - age + location only)
        setValue('customerAge', data.customerProfile?.ageRange);
        setValue('customerLocation', data.customerProfile?.location);

        // Restore age range sliders if data exists
        if (data.customerProfile?.ageRange) {
            const ageRange = data.customerProfile.ageRange.split('-');
            if (ageRange.length === 2) {
                const minSlider = document.getElementById('customerAgeMin');
                const maxSlider = document.getElementById('customerAgeMax');
                if (minSlider) minSlider.value = ageRange[0];
                if (maxSlider) maxSlider.value = ageRange[1].replace('+', '');
                if (typeof updateAgeRange === 'function') updateAgeRange();
            }
        }

        // Restore review checkboxes and stars
        if (data.onlineReviews && Array.isArray(data.onlineReviews)) {
            data.onlineReviews.forEach(review => {
                const checkbox = document.getElementById(`review${review.platform}`);
                const stars = document.getElementById(`review${review.platform}Stars`);
                if (checkbox) checkbox.checked = true;
                if (stars) stars.value = review.stars;
            });
        }

        // How customers find (checkboxes)
        if (data.howCustomersFind && Array.isArray(data.howCustomersFind)) {
            data.howCustomersFind.forEach(method => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${method}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Section 7: Pages Needed
        if (data.pagesNeeded && Array.isArray(data.pagesNeeded)) {
            data.pagesNeeded.forEach(page => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${page}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        setValue('otherPages', data.otherPages);
        if (data.servicePages) {
            document.querySelector(`input[name="servicePages"][value="${data.servicePages}"]`)?.setAttribute('checked', 'checked');
        }
        if (data.legalPages && Array.isArray(data.legalPages)) {
            data.legalPages.forEach(legal => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${legal}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Section 8: Features
        if (data.contactFeatures && Array.isArray(data.contactFeatures)) {
            data.contactFeatures.forEach(feature => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${feature}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        setValue('formsNeeded', data.formsNeeded);
        // Restore social media links
        if (data.socialMedia && typeof data.socialMedia === 'object') {
            Object.keys(data.socialMedia).forEach(platform => {
                const platformCapitalized = platform.charAt(0).toUpperCase() + platform.slice(1);
                const checkbox = document.getElementById(`social${platformCapitalized}`);
                const urlInput = document.getElementById(`${platform}Url`);

                if (checkbox && urlInput) {
                    checkbox.checked = true;
                    urlInput.value = data.socialMedia[platform];
                    // Show the input field
                    const inputSection = document.getElementById(`social${platformCapitalized}Input`);
                    if (inputSection) inputSection.classList.add('active');
                }
            });
        }
        if (data.specialFeatures && Array.isArray(data.specialFeatures)) {
            data.specialFeatures.forEach(feature => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${feature}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        if (data.needsEcommerce) {
            document.getElementById(`ecommerce${data.needsEcommerce === 'yes' ? 'Yes' : 'No'}`).checked = true;
            toggleEcommerceSection();
        }
        if (data.ecommerceFeatures && Array.isArray(data.ecommerceFeatures)) {
            data.ecommerceFeatures.forEach(feature => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${feature}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        setValue('productCount', data.productCount);

        // Section 8: Ecommerce & Content
        if (data.writtenContent) {
            document.querySelector(`input[name="writtenContent"][value="${data.writtenContent}"]`)?.setAttribute('checked', 'checked');
        }
        setValue('contentProvided', data.contentProvided);
        if (data.photosVideos && Array.isArray(data.photosVideos)) {
            data.photosVideos.forEach(photo => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${photo}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        setValue('documents', data.documents);

        // Section 10: Updates & Maintenance
        if (data.wantToUpdate && Array.isArray(data.wantToUpdate)) {
            data.wantToUpdate.forEach(update => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${update}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        setValue('updateFrequency', data.updateFrequency);
        setValue('whoUpdates', data.whoUpdates);

        // Section 11: Marketing & SEO
        setValue('searchKeywords', data.searchKeywords);
        setValue('serviceArea', data.serviceArea);
        if (data.currentMarketing && Array.isArray(data.currentMarketing)) {
            data.currentMarketing.forEach(marketing => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${marketing}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Section 11: Technical Needs (simplified - domain only)
        if (data.domainStatus) {
            document.querySelector(`input[name="domainStatus"][value="${data.domainStatus}"]`)?.setAttribute('checked', 'checked');
        }
        setValue('domainName', data.domainName);

        // Section 12: Special Requests
        setValue('specificWants', data.specificWants);
        setValue('dontWant', data.dontWant);
        setValue('concerns', data.concerns);
        setValue('additionalQuestions', data.additionalQuestions);
        setValue('additionalNotes', data.additionalNotes);

        updateProgressBar();
    }

    // Helper function to set value
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    }

    // Setup auto-save functionality
    function setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            saveFormData(false);
        }, 30000);

        // Also save on blur for all inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    saveFormData(false);
                }, 1000);
            });
        });

        // Save on checkbox/radio change
        const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    saveFormData(false);
                }, 1000);
            });
        });
    }

    // Save form data to Firebase
    async function saveFormData(showIndicator = true) {
        if (!window.currentQuoteId) return;

        if (showIndicator) {
            showSaveIndicator('saving');
        }

        try {
            // Collect all form data
            const formData = {
                // Section 1: Business
                businessName: getValue('businessName'),
                ownerName: getValue('ownerName'),
                phone: getValue('phone'),
                email: getValue('email'),
                businessDescription: getValue('businessDescription'),
                yearsInBusiness: getValue('yearsInBusiness'),
                businessType: getValue('businessType'),
                locations: getValue('locations'),
                budgetRange: getValue('budgetRange'),
                competitor1Url: getValue('competitor1Url'),
                competitor2Url: getValue('competitor2Url'),

                // Section 2: Current Website
                hasCurrentWebsite: getRadioValue('hasCurrentWebsite'),
                currentWebsiteUrl: getValue('currentWebsiteUrl'),
                websiteAge: getValue('websiteAge'),
                builtBy: getValue('builtBy'),
                currentProblems: getCheckboxValues(['problem1', 'problem2', 'problem3', 'problem4', 'problem5', 'problem6']),
                whatWorksWell: getValue('whatWorksWell'),
                monthlyVisitors: getValue('monthlyVisitors'),
                trafficSources: getValue('trafficSources'),

                // Section 3: Websites They Like
                favoriteWebsite: {
                    url: getValue('favoriteWebsiteUrl'),
                    likesAboutLook: getValue('likesAboutLook'),
                    likesAboutFunction: getCheckboxValues(['func1', 'func2', 'func3', 'func4', 'func5', 'func6', 'func7', 'func8', 'func9', 'func10', 'func11', 'func12', 'func13', 'func14', 'func15']),
                    likesAboutColors: getValue('likesAboutColors'),
                    likesAboutLayout: getValue('likesAboutLayout'),
                    specificFeatures: getCheckboxValues(['feat1', 'feat2', 'feat3', 'feat4', 'feat5', 'feat6', 'feat7', 'feat8', 'feat9', 'feat10', 'feat11', 'feat12', 'feat13', 'feat14', 'feat15', 'feat16'])
                },

                // Section 4: Look & Feel (simplified - logo + colors only)
                // logoUrl is saved separately during file upload
                brandColors: {
                    main: getValue('colorMain'),
                    secondary: getValue('colorSecondary'),
                    accent: getValue('colorAccent'),
                    background: getValue('colorBackground')
                },

                // Section 5: Customers (simplified - age + location only)
                customerProfile: {
                    ageRange: getValue('customerAge'),
                    location: getValue('customerLocation')
                },
                howCustomersFind: getCheckboxValues(['find1', 'find2', 'find3', 'find4', 'find5']),
                onlineReviews: getOnlineReviews(),

                // Section 6: Pages Needed
                pagesNeeded: getCheckboxValues(['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9', 'page10', 'page11']),
                otherPages: getValue('otherPages'),
                servicePages: getRadioValue('servicePages'),
                legalPages: getCheckboxValues(['legal1', 'legal2', 'legal3', 'legal4']),

                // Section 7: Features & Functionality (includes booking)
                contactFeatures: getCheckboxValues(['contact1', 'contact2', 'contact3', 'contact4', 'contact5', 'contact6', 'contact7', 'contact8']),
                formsNeeded: getValue('formsNeeded'),
                socialMedia: getSocialMediaLinks(),
                specialFeatures: getCheckboxValues(['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8', 'feature9']),

                // Section 8: Ecommerce & Content
                needsEcommerce: getRadioValue('needsEcommerce'),
                ecommerceFeatures: getCheckboxValues(['ecom1', 'ecom2', 'ecom3', 'ecom4', 'ecom5', 'ecom6', 'ecom7', 'ecom8']),
                productCount: getValue('productCount'),
                writtenContent: getRadioValue('writtenContent'),
                contentProvided: getValue('contentProvided'),
                photosVideos: getCheckboxValues(['photo1', 'photo2', 'photo3', 'photo4', 'photo5', 'photo6']),
                documents: getValue('documents'),

                // Section 9: Updates & Maintenance
                wantToUpdate: getCheckboxValues(['update1', 'update2', 'update3', 'update4', 'update5', 'update6', 'update7', 'update8']),
                updateFrequency: getValue('updateFrequency'),
                whoUpdates: getValue('whoUpdates'),

                // Section 10: Marketing & SEO
                searchKeywords: getValue('searchKeywords'),
                serviceArea: getValue('serviceArea'),
                currentMarketing: getCheckboxValues(['market1', 'market2', 'market3', 'market4', 'market5']),

                // Section 11: Technical Needs (simplified - domain only)
                domainStatus: getRadioValue('domainStatus'),
                domainName: getValue('domainName'),

                // Section 12: Special Requests
                specificWants: getValue('specificWants'),
                dontWant: getValue('dontWant'),
                concerns: getValue('concerns'),
                additionalQuestions: getValue('additionalQuestions'),
                additionalNotes: getValue('additionalNotes'),

                // Metadata
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                completionPercent: calculateCompletionPercent()
            };

            await db.collection('websiteQuotes').doc(window.currentQuoteId).update(formData);

            if (showIndicator) {
                showSaveIndicator('saved');
            }

            // Update global data
            quoteData = { ...quoteData, ...formData };

        } catch (error) {
            console.error('Error saving form:', error);
            if (showIndicator) {
                showSaveIndicator('error');
            }
        }
    }

    // Helper functions to get values
    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }

    function getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : '';
    }

    function getCheckboxValues(ids) {
        const values = [];
        ids.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox && checkbox.checked) {
                values.push(checkbox.value);
            }
        });
        return values;
    }

    function getOnlineReviews() {
        const reviews = [];
        const platforms = ['Google', 'Yelp', 'Facebook', 'Trustpilot', 'TripAdvisor'];

        platforms.forEach(platform => {
            const checkbox = document.getElementById(`review${platform}`);
            const stars = document.getElementById(`review${platform}Stars`);

            if (checkbox && checkbox.checked) {
                reviews.push({
                    platform: platform,
                    stars: stars ? parseFloat(stars.value) : 5.0
                });
            }
        });

        return reviews;
    }

    function getSocialMediaLinks() {
        const socialLinks = {};
        const platforms = ['Facebook', 'Instagram', 'X', 'Youtube', 'Linkedin', 'Tiktok'];

        platforms.forEach(platform => {
            const checkbox = document.getElementById(`social${platform}`);
            const urlInput = document.getElementById(`${platform.toLowerCase()}Url`);

            if (checkbox && checkbox.checked && urlInput && urlInput.value) {
                socialLinks[platform.toLowerCase()] = urlInput.value;
            }
        });

        return socialLinks;
    }

    // Calculate completion percentage
    function calculateCompletionPercent() {
        let totalFields = 0;
        let filledFields = 0;

        // Section 1: Business - 9 key fields
        const section1Fields = ['businessName', 'ownerName', 'phone', 'email', 'businessDescription',
                                'yearsInBusiness', 'businessType', 'locations', 'budgetRange'];
        section1Fields.forEach(field => {
            totalFields++;
            if (getValue(field)) filledFields++;
        });

        // Section 2: Current Website
        totalFields++;
        if (getRadioValue('hasCurrentWebsite')) filledFields++;

        // Section 3: Inspiration (at least 1 field)
        totalFields++;
        if (getValue('favoriteWebsiteUrl')) filledFields++;

        // Section 4: Look & Feel - Colors (at least 1 color)
        totalFields++;
        if (getValue('colorMain') || getValue('colorSecondary') || getValue('colorAccent')) filledFields++;

        // Section 5: Customers (age and location)
        totalFields += 2;
        if (getValue('customerAge')) filledFields++;
        if (getValue('customerLocation')) filledFields++;

        // Section 6: Pages (at least 1 page selected)
        totalFields++;
        const pages = getCheckboxValues(['page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8', 'page9', 'page10', 'page11']);
        if (pages.length > 0) filledFields++;

        // Section 7: Features (at least 1 feature or contact method)
        totalFields++;
        const features = getCheckboxValues(['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8', 'feature9']);
        const contactFeatures = getCheckboxValues(['contact1', 'contact2', 'contact3', 'contact4', 'contact5', 'contact6', 'contact7', 'contact8']);
        if (features.length > 0 || contactFeatures.length > 0) filledFields++;

        // Section 8: Ecommerce & Content
        totalFields += 2;
        if (getRadioValue('needsEcommerce')) filledFields++;
        if (getRadioValue('writtenContent')) filledFields++;

        // Section 9: Updates & Maintenance
        totalFields++;
        const updates = getCheckboxValues(['update1', 'update2', 'update3', 'update4', 'update5', 'update6', 'update7', 'update8']);
        if (updates.length > 0) filledFields++;

        // Section 10: Marketing & SEO
        totalFields += 2;
        if (getValue('searchKeywords')) filledFields++;
        if (getValue('serviceArea')) filledFields++;

        // Section 11: Technical
        totalFields++;
        if (getRadioValue('domainStatus')) filledFields++;

        // Section 12: Special Requests (optional, don't count)

        const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
        return percent;
    }

    // Update progress bar
    function updateProgressBar() {
        const percent = calculateCompletionPercent();
        document.getElementById('progressBar').style.width = percent + '%';
        document.getElementById('progressText').textContent = `${percent}% Complete`;
    }

    // Show save indicator
    function showSaveIndicator(status) {
        const statusSpan = document.getElementById('saveStatus');
        const indicator = document.getElementById('saveIndicator');

        if (status === 'saving') {
            statusSpan.textContent = 'Saving...';
            indicator.style.color = '#f59e0b';
        } else if (status === 'saved') {
            statusSpan.textContent = 'Saved ✓';
            indicator.style.color = '#10b981';
            setTimeout(() => {
                indicator.style.color = '#10b981';
            }, 3000);
        } else if (status === 'error') {
            statusSpan.textContent = 'Error saving';
            indicator.style.color = '#dc2626';
            indicator.style.display = 'inline';
        }
    }

    // Navigation functions
    window.nextSection = async function() {
        // Validate current section
        if (!validateCurrentSection()) {
            return;
        }

        // Save before moving
        await saveFormData(true);

        // Hide current section
        document.querySelector(`.section-content[data-section="${currentSection}"]`).classList.remove('active');

        // Show next section
        currentSection++;
        if (currentSection <= totalSections) {
            document.querySelector(`.section-content[data-section="${currentSection}"]`).classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Show completion screen
            showCompletionScreen();
        }

        updateProgressBar();
    };

    window.prevSection = function() {
        if (currentSection > 1) {
            // Hide current section
            document.querySelector(`.section-content[data-section="${currentSection}"]`).classList.remove('active');

            // Show previous section
            currentSection--;
            document.querySelector(`.section-content[data-section="${currentSection}"]`).classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Validate current section
    function validateCurrentSection() {
        const section = document.querySelector(`.section-content[data-section="${currentSection}"]`);
        const requiredInputs = section.querySelectorAll('[required]');

        let isValid = true;
        requiredInputs.forEach(input => {
            if (!input.value) {
                input.style.borderColor = '#dc2626';
                isValid = false;
            } else {
                input.style.borderColor = '#d1d5db';
            }
        });

        if (!isValid) {
            alert('Please fill in all required fields before continuing.');
        }

        return isValid;
    }

    // Toggle current website section
    window.toggleCurrentWebsiteSection = function() {
        const hasWebsite = getRadioValue('hasCurrentWebsite');
        const detailsSection = document.getElementById('currentWebsiteDetails');

        if (hasWebsite === 'yes') {
            detailsSection.classList.add('active');
        } else {
            detailsSection.classList.remove('active');
        }
    };

    // Toggle ecommerce section
    window.toggleEcommerceSection = function() {
        const needsEcommerce = getRadioValue('needsEcommerce');
        const detailsSection = document.getElementById('ecommerceDetails');

        if (needsEcommerce === 'yes') {
            detailsSection.classList.add('active');
        } else {
            detailsSection.classList.remove('active');
        }
    };

    // Show completion screen
    async function showCompletionScreen() {
        try {
            // Get the quote data
            const quoteDoc = await db.collection('websiteQuotes').doc(window.currentQuoteId).get();
            const quoteData = quoteDoc.data();

            // Update status to completed
            await db.collection('websiteQuotes').doc(window.currentQuoteId).update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Auto-create CRM Deal at "Lead" stage
            const dealData = {
                companyName: quoteData.businessName || 'Website Quote Lead',
                contactName: quoteData.ownerName || null,
                email: quoteData.email || null,
                phone: quoteData.phone || null,
                assignedTo: 'unassigned', // Will be assigned by admin
                stage: 'Lead',
                mrr: 0, // To be determined during sales process
                contractLength: 0,
                clientPortalId: null,
                websiteQuoteId: window.currentQuoteId, // Link to the website quote
                notes: `Auto-generated from Website Quote submission.\nBusiness: ${quoteData.businessName || 'N/A'}\nIndustry: ${quoteData.businessType || 'N/A'}\nLocation: ${quoteData.locations || 'N/A'}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                archived: false
            };

            const dealRef = await db.collection('deals').add(dealData);
            console.log('✓ CRM Deal auto-created from website quote');

            // Create notification for admin about new quote submission
            if (window.createNotification) {
                await window.createNotification({
                    type: 'QUOTE_SUBMITTED',
                    recipientId: 'admin',
                    recipientType: 'admin',
                    message: `New website quote from ${quoteData.businessName || 'Unknown Business'}`,
                    actionUrl: `admin.html?tab=website-quotes`,
                    relatedId: window.currentQuoteId,
                    metadata: {
                        businessName: quoteData.businessName,
                        budgetRange: quoteData.budgetRange,
                        dealId: dealRef.id
                    }
                });
                console.log('✓ Admin notification created for quote submission');
            }

            // Hide all sections
            document.querySelectorAll('.section-content').forEach(section => {
                section.classList.remove('active');
            });

            // Calculate and display ballpark quote
            calculateBallparkQuote(quoteData);

            // Show completion screen
            document.getElementById('completionScreen').classList.add('active');

        } catch (error) {
            console.error('Error in completion process:', error);
            // Still show completion screen even if deal creation fails
            document.querySelectorAll('.section-content').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('completionScreen').classList.add('active');
        }
    }

    // Calculate ballpark quote based on form data
    function calculateBallparkQuote(data) {
        let basePrice = 2000;
        let maxPrice = 4000;
        let timeline = "2-3 weeks";
        let includedItems = [];

        // Factor 1: Budget Range (client's stated budget)
        const budgetMap = {
            'under-2k': { base: 1500, max: 2000, timeline: "1-2 weeks" },
            '2k-5k': { base: 2500, max: 4500, timeline: "2-3 weeks" },
            '5k-10k': { base: 5000, max: 9000, timeline: "3-5 weeks" },
            '10k-20k': { base: 10000, max: 18000, timeline: "5-8 weeks" },
            '20k+': { base: 20000, max: 35000, timeline: "8-12 weeks" },
            'not-sure': { base: 3000, max: 6000, timeline: "3-4 weeks" }
        };

        if (data.budgetRange && budgetMap[data.budgetRange]) {
            const budget = budgetMap[data.budgetRange];
            basePrice = budget.base;
            maxPrice = budget.max;
            timeline = budget.timeline;
        }

        // Factor 2: Number of pages
        const pages = data.pagesNeeded || [];
        const pageCount = pages.length;
        includedItems.push(`${pageCount} custom pages`);

        // Adjust for page count if budget is "not-sure"
        if (data.budgetRange === 'not-sure') {
            if (pageCount <= 3) {
                basePrice = 2000;
                maxPrice = 4000;
            } else if (pageCount <= 7) {
                basePrice = 4000;
                maxPrice = 7000;
            } else {
                basePrice = 7000;
                maxPrice = 12000;
            }
        }

        // Factor 3: E-commerce
        if (data.needsEcommerce === 'yes') {
            includedItems.push('E-commerce functionality');
            const productCount = parseInt(data.productCount) || 0;
            if (productCount > 100) {
                includedItems.push(`${productCount}+ product catalog`);
            }
        }

        // Factor 4: Special Features
        const features = data.specialFeatures || [];
        if (features.includes('user-accounts')) includedItems.push('User account system');
        if (features.includes('booking')) includedItems.push('Booking/scheduling system');
        if (features.includes('search')) includedItems.push('Advanced search');
        if (features.includes('language')) includedItems.push('Multi-language support');
        if (features.includes('maps')) includedItems.push('Interactive maps');
        if (features.includes('blog')) includedItems.push('Blog functionality');

        // Factor 5: Contact Features
        const contactFeatures = data.contactFeatures || [];
        if (contactFeatures.includes('live-chat')) includedItems.push('Live chat integration');
        if (contactFeatures.includes('newsletter')) includedItems.push('Newsletter signup');

        // Standard inclusions
        includedItems.push('Mobile-responsive design');
        includedItems.push('SEO optimization');
        includedItems.push('Performance optimization');
        includedItems.push('Security best practices');

        // Update the DOM
        document.getElementById('estimatedCost').textContent = `$${basePrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
        document.getElementById('estimatedTimeline').textContent = timeline;

        // Build breakdown list
        const breakdownHTML = includedItems.map(item => `<div style="padding: 4px 0;">✓ ${item}</div>`).join('');
        document.getElementById('breakdownList').innerHTML = breakdownHTML;
    }

    // Show error message
    function showError(message) {
        document.getElementById('loadingScreen').innerHTML = `
            <div style="text-align:center; padding:50px; color:#012E40; background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div style="background: #EEF4D9; padding: 40px; border-radius: 15px; max-width: 500px;">
                    <h1 style="font-family: Young Serif, serif; margin-bottom: 20px;">Error</h1>
                    <p style="font-size: 1.1rem;">${message}</p>
                    <p style="margin-top: 20px; color: #05908C;">Contact: Nicolas@driveleadmedia.com</p>
                </div>
            </div>
        `;
    }

    // Logo File Upload Handler
    document.getElementById('logoFile')?.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('logoPreview');
            const img = document.getElementById('logoPreviewImg');
            const fileName = document.getElementById('logoFileName');

            img.src = event.target.result;
            fileName.textContent = file.name;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);

        // Upload to Firebase Storage
        try {
            const storageRef = storage.ref(`websiteQuotes/${window.currentQuoteId}/logo/${file.name}`);
            await storageRef.put(file);
            const downloadURL = await storageRef.getDownloadURL();

            // Save URL to Firestore
            await db.collection('websiteQuotes').doc(window.currentQuoteId).update({
                logoUrl: downloadURL,
                logoFileName: file.name
            });

            showSaveIndicator('saved');
        } catch (error) {
            console.error('Error uploading logo:', error);
            showSaveIndicator('error');
        }
    });

    // Color Picker Sync - Main Color
    const colorMainPicker = document.getElementById('colorMainPicker');
    const colorMainText = document.getElementById('colorMain');

    colorMainPicker?.addEventListener('input', function(e) {
        colorMainText.value = e.target.value;
    });

    colorMainText?.addEventListener('blur', function(e) {
        // If it's a hex color, update the picker
        if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
            colorMainPicker.value = e.target.value;
        }
    });

    // Color Picker Sync - Secondary Color
    const colorSecondaryPicker = document.getElementById('colorSecondaryPicker');
    const colorSecondaryText = document.getElementById('colorSecondary');

    colorSecondaryPicker?.addEventListener('input', function(e) {
        colorSecondaryText.value = e.target.value;
    });

    colorSecondaryText?.addEventListener('blur', function(e) {
        if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
            colorSecondaryPicker.value = e.target.value;
        }
    });

    // Color Picker Sync - Accent Color
    const colorAccentPicker = document.getElementById('colorAccentPicker');
    const colorAccentText = document.getElementById('colorAccent');

    colorAccentPicker?.addEventListener('input', function(e) {
        colorAccentText.value = e.target.value;
    });

    colorAccentText?.addEventListener('blur', function(e) {
        if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
            colorAccentPicker.value = e.target.value;
        }
    });

    // Age Range Slider Handler
    const ageMinSlider = document.getElementById('customerAgeMin');
    const ageMaxSlider = document.getElementById('customerAgeMax');
    const ageMinDisplay = document.getElementById('ageMin');
    const ageMaxDisplay = document.getElementById('ageMax');
    const ageHiddenField = document.getElementById('customerAge');

    function updateAgeRange() {
        let minVal = parseInt(ageMinSlider.value);
        let maxVal = parseInt(ageMaxSlider.value);

        // Ensure min is always less than max
        if (minVal >= maxVal) {
            minVal = maxVal - 1;
            ageMinSlider.value = minVal;
        }

        // Update displays
        ageMinDisplay.textContent = minVal;
        ageMaxDisplay.textContent = maxVal >= 80 ? '65+' : maxVal;

        // Update hidden field
        ageHiddenField.value = `${minVal}-${maxVal >= 80 ? '65+' : maxVal}`;
    }

    ageMinSlider?.addEventListener('input', updateAgeRange);
    ageMaxSlider?.addEventListener('input', updateAgeRange);

    // Save and Exit function
    window.saveAndExit = async function() {
        const button = event.target;
        const originalText = button.innerHTML;

        try {
            // Show saving state
            button.innerHTML = '⏳ Saving...';
            button.disabled = true;
            button.style.opacity = '0.7';

            // Force save
            await saveFormData(true);

            // Show success state
            button.innerHTML = '✓ Saved!';
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

            // Show confirmation modal
            setTimeout(() => {
                const confirmed = confirm(
                    '✓ Your progress has been saved!\n\n' +
                    'You can close this page and come back anytime using the same link.\n\n' +
                    'Click OK to close this page, or Cancel to keep working.'
                );

                if (confirmed) {
                    // Show a thank you message before closing
                    document.body.innerHTML = `
                        <div style="background: linear-gradient(135deg, #012E40 0%, #05908C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
                            <div style="background: white; padding: 60px 40px; border-radius: 20px; text-align: center; max-width: 500px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
                                <div style="font-size: 4rem; margin-bottom: 20px;">✓</div>
                                <h1 style="font-family: 'Young Serif', serif; color: #012E40; font-size: 2rem; margin-bottom: 15px;">Progress Saved!</h1>
                                <p style="color: #6b7280; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">
                                    Your progress has been saved. Use the same link to continue whenever you're ready.
                                </p>
                                <p style="color: #05908C; font-weight: 600; font-size: 0.95rem;">
                                    You can safely close this page now.
                                </p>
                            </div>
                        </div>
                    `;
                } else {
                    // Reset button
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.background = 'linear-gradient(135deg, #05908C 0%, #47a5a3 100%)';
                }
            }, 500);

        } catch (error) {
            console.error('Error saving:', error);
            button.innerHTML = '❌ Error - Try Again';
            button.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';

            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.style.opacity = '1';
                button.style.background = 'linear-gradient(135deg, #05908C 0%, #47a5a3 100%)';
            }, 3000);

            alert('There was an error saving your progress. Please try again.');
        }
    };

})();
