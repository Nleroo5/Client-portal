// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDV7180vzQwQrx0TeDqODDZKBhs_B6SATI",
    authDomain: "drive-lead-media-crm.firebaseapp.com",
    projectId: "drive-lead-media-crm",
    storageBucket: "drive-lead-media-crm.firebasestorage.app",
    messagingSenderId: "876210797921",
    appId: "1:876210797921:web:a8583d957f7c2136569920"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Portal Configuration
const DLM_CONFIG = {
    // DocuSign Links for Contract Portal (6/12 month)
    docuSign: {
        dpa: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=143e9c27-bc1d-4f0e-aab5-65a344a4f3e3&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        service6: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=a135e495-2882-46e5-96b0-c91d4498d030&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        service12: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=7894201c-9ab2-4d7e-8126-18094731fd82&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        // Month-to-Month Portal Links
        serviceAgreement: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=YOUR_M2M_SERVICE_AGREEMENT&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2"
    },
    // Stripe Links for Contract Portal (6/12 month)
    stripeLinks: {
        service6: {
            monthly: "https://buy.stripe.com/test_6month_monthly",
            upfront: "https://buy.stripe.com/test_6month_upfront"
        },
        service12: {
            monthly: "https://buy.stripe.com/test_12month_monthly",
            upfront: "https://buy.stripe.com/test_12month_upfront"
        },
        // Month-to-Month Invoice Link
        invoiceLink: "https://buy.stripe.com/test_m2m_invoice"
    },
    googleDrive: {
        defaultUploadLink: "https://drive.google.com/drive/folders/1jds7K6SdV6G_SwTyZZjxqjuftqIHiaPY?usp=sharing"
    },
    support: {
        opsEmail: "Nicolas@driveleadmedia.com",
        opsPhone: "(678) 650-6411"
    }
};
