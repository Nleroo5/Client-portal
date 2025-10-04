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
        dpa: "",
        service6: "",
        service12: "",
        // Month-to-Month Portal Links
        serviceAgreement: ""
    },
    // Stripe Links for Contract Portal (6/12 month)
    stripeLinks: {
        service6: {
            monthly: "",
            upfront: ""
        },
        service12: {
            monthly: "",
            upfront: ""
        },
        // Month-to-Month Invoice Link
        invoiceLink: ""
    },
    googleDrive: {
        defaultUploadLink: "https://drive.google.com/drive/folders/1jds7K6SdV6G_SwTyZZjxqjuftqIHiaPY?usp=sharing"
    },
    support: {
        opsEmail: "Nicolas@driveleadmedia.com",
        opsPhone: "(678) 650-6411"
    }
};
