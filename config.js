// ===== DRIVE LEAD MEDIA PORTAL CONFIGURATION =====
// Edit this file to change emails, links, and settings

window.DLM_CONFIG = {
    // DocuSign Agreement Links
    docuSign: {
        msa: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=a78e28e4-f9a0-4e5a-8795-d31c45721130&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        dpa: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=143e9c27-bc1d-4f0e-aab5-65a344a4f3e3&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        sow6: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=a135e495-2882-46e5-96b0-c91d4498d030&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        sow12: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=7894201c-9ab2-4d7e-8126-18094731fd82&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2"
    },

    // Payment Settings
    stripeUrl: "https://stripe-payment-link",

    // File Upload Settings  
    uploads: {
        driveFileRequestUrl: "https://drive.google.com/drive/folders/1jds7K6SdV6G_SwTyZZjxqjuftqIHiaPY?usp=sharing"
    },

    // Tracking Settings
    tracking: {
        ga4MeasurementId: "G-XXXXXXX",
        pixelId: "1234567890"
    },

    // Contact Information (CHANGE THESE AS NEEDED)
    support: {
        opsEmail: "Nicolas@driveleadmedia.com",
        opsPhone: "(678) 650-6411",
        webhookUrl: ""
    },

    // Admin Settings (CHANGE PASSWORD!)
    admin: {
        password: "dlm2024",
        sessionTimeout: 30 * 60 * 1000  // 30 minutes
    }
};

// Storage and State Settings
window.STORAGE_KEY = 'dlm_portal_v1';
window.portalState = {
    "1": false,
    "2": false,
    "3": false,
    "4": false,
    "5": false,
    "admin": {},
    "creativeLink": null,
    "stripePaymentLink": null
};
