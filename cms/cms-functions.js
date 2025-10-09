// ============================================
// CMS CORE FUNCTIONS
// Handles content loading, saving, and management
// ============================================

const db = firebase.firestore();
const storage = firebase.storage();

// ============================================
// AUTHENTICATION & ACCESS
// ============================================

// Get current CMS client info from session
window.getCurrentCMSClient = function() {
    const clientId = sessionStorage.getItem('cmsClientId');
    const clientName = sessionStorage.getItem('cmsClientName');

    if (!clientId) {
        window.location.href = 'login.html';
        return null;
    }

    return { clientId, clientName };
};

// Verify CMS access and redirect if unauthorized
window.verifyCMSAccess = async function() {
    const user = firebase.auth().currentUser;

    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const cmsAccessQuery = await db.collection('cmsClients')
            .where('email', '==', user.email)
            .where('active', '==', true)
            .limit(1)
            .get();

        if (cmsAccessQuery.empty) {
            alert('You do not have access to the CMS.');
            await firebase.auth().signOut();
            window.location.href = 'login.html';
            return false;
        }

        const clientData = cmsAccessQuery.docs[0].data();
        const clientId = cmsAccessQuery.docs[0].id;

        sessionStorage.setItem('cmsClientId', clientId);
        sessionStorage.setItem('cmsClientName', clientData.clientName);

        return true;
    } catch (error) {
        console.error('Error verifying CMS access:', error);
        return false;
    }
};

// Logout
window.logoutCMS = async function() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await firebase.auth().signOut();
            sessionStorage.clear();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        }
    }
};

// ============================================
// CONTENT MANAGEMENT
// ============================================

// Load page content
window.loadPageContent = async function(clientId, pageName) {
    try {
        const doc = await db.collection('websiteContent')
            .doc(clientId)
            .collection('pages')
            .doc(pageName)
            .get();

        if (doc.exists) {
            return doc.data();
        } else {
            // Return default empty structure
            return getDefaultPageContent(pageName);
        }
    } catch (error) {
        console.error('Error loading page content:', error);
        throw error;
    }
};

// Save page content
window.savePageContent = async function(clientId, pageName, content) {
    try {
        await db.collection('websiteContent')
            .doc(clientId)
            .collection('pages')
            .doc(pageName)
            .set({
                ...content,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: firebase.auth().currentUser.email
            }, { merge: true });

        console.log('✓ Page content saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving page content:', error);
        throw error;
    }
};

// Get default page content structure
function getDefaultPageContent(pageName) {
    const defaults = {
        homepage: {
            heroHeadline: 'Welcome to Our Company',
            heroSubheadline: 'We deliver exceptional results',
            heroImage: '',
            heroButtonText: 'Get Started',
            heroButtonLink: '/contact',

            aboutHeadline: 'About Us',
            aboutText: 'We are a leading company in our industry...',
            aboutImage: '',

            servicesHeadline: 'Our Services',
            services: [
                {
                    title: 'Service 1',
                    description: 'Description of service 1',
                    icon: '🔧',
                    image: ''
                },
                {
                    title: 'Service 2',
                    description: 'Description of service 2',
                    icon: '⚙️',
                    image: ''
                }
            ],

            testimonials: [
                {
                    name: 'Customer Name',
                    company: 'Company Inc.',
                    text: 'Great service and results!',
                    rating: 5,
                    image: ''
                }
            ]
        },

        about: {
            pageTitle: 'About Us',
            metaDescription: 'Learn more about our company',
            headline: 'Our Story',
            mainContent: 'Company history and mission...',
            team: []
        },

        services: {
            pageTitle: 'Our Services',
            metaDescription: 'Explore our services',
            headline: 'What We Offer',
            services: []
        },

        contact: {
            pageTitle: 'Contact Us',
            metaDescription: 'Get in touch with us',
            headline: 'Get In Touch',
            showContactForm: true,
            showMap: false
        }
    };

    return defaults[pageName] || {};
}

// ============================================
// SITE SETTINGS
// ============================================

// Load site settings
window.loadSiteSettings = async function(clientId) {
    try {
        const doc = await db.collection('websiteContent')
            .doc(clientId)
            .collection('settings')
            .doc('siteConfig')
            .get();

        if (doc.exists) {
            return doc.data();
        } else {
            return getDefaultSiteSettings();
        }
    } catch (error) {
        console.error('Error loading site settings:', error);
        throw error;
    }
};

// Save site settings
window.saveSiteSettings = async function(clientId, settings) {
    try {
        await db.collection('websiteContent')
            .doc(clientId)
            .collection('settings')
            .doc('siteConfig')
            .set({
                ...settings,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: firebase.auth().currentUser.email
            }, { merge: true });

        console.log('✓ Site settings saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving site settings:', error);
        throw error;
    }
};

// Get default site settings
function getDefaultSiteSettings() {
    return {
        siteName: 'My Company',
        logo: '',
        favicon: '',

        primaryColor: '#05908C',
        secondaryColor: '#F2A922',
        textColor: '#012E40',
        backgroundColor: '#ffffff',

        phone: '',
        email: '',
        address: '',

        facebook: '',
        instagram: '',
        linkedin: '',
        twitter: '',

        menuItems: [
            { label: 'Home', link: '/' },
            { label: 'About', link: '/about' },
            { label: 'Services', link: '/services' },
            { label: 'Contact', link: '/contact' }
        ],

        googleAnalyticsId: '',
        facebookPixelId: '',

        enableBlog: false,
        enableChat: false,
        enableBooking: false
    };
}

// ============================================
// MEDIA MANAGEMENT
// ============================================

// Upload image to Firebase Storage
window.uploadImage = async function(clientId, file, folder = 'images') {
    try {
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image must be smaller than 5MB');
        }

        // Create reference
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`websiteContent/${clientId}/${folder}/${fileName}`);

        // Upload file
        const snapshot = await imageRef.put(file);

        // Get download URL
        const downloadURL = await snapshot.ref.getDownloadURL();

        // Save to media library
        await db.collection('websiteContent')
            .doc(clientId)
            .collection('media')
            .add({
                fileName: file.name,
                storagePath: `websiteContent/${clientId}/${folder}/${fileName}`,
                downloadURL: downloadURL,
                fileSize: file.size,
                fileType: file.type,
                folder: folder,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                uploadedBy: firebase.auth().currentUser.email
            });

        console.log('✓ Image uploaded successfully:', downloadURL);
        return downloadURL;

    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// Get media library
window.getMediaLibrary = async function(clientId, folder = null) {
    try {
        let query = db.collection('websiteContent')
            .doc(clientId)
            .collection('media')
            .orderBy('uploadedAt', 'desc');

        if (folder) {
            query = query.where('folder', '==', folder);
        }

        const snapshot = await query.get();

        const media = [];
        snapshot.forEach(doc => {
            media.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return media;
    } catch (error) {
        console.error('Error loading media library:', error);
        throw error;
    }
};

// Delete image
window.deleteImage = async function(clientId, mediaId, storagePath) {
    try {
        // Delete from storage
        const storageRef = storage.ref();
        const imageRef = storageRef.child(storagePath);
        await imageRef.delete();

        // Delete from Firestore
        await db.collection('websiteContent')
            .doc(clientId)
            .collection('media')
            .doc(mediaId)
            .delete();

        console.log('✓ Image deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate URL-friendly slug
window.generateSlug = function(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/--+/g, '-')     // Replace multiple hyphens with single
        .trim();
};

// Validate URL
window.validateURL = function(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

// Format file size
window.formatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Show toast notification
window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✓ CMS Functions loaded');
