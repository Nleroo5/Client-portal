// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6nhisBnue09mvJuFzBb7m6zcMtqBRZEQ",
    authDomain: "client-portal-2fa80.firebaseapp.com",
    projectId: "client-portal-2fa80",
    storageBucket: "client-portal-2fa80.firebasestorage.app",
    messagingSenderId: "417272730660",
    appId: "1:417272730660:web:9530a097347fbbf72f5771"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Portal Configuration
const DLM_CONFIG = {
    docuSign: {
        dpa: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=143e9c27-bc1d-4f0e-aab5-65a344a4f3e3&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        service6: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=a135e495-2882-46e5-96b0-c91d4498d030&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2",
        service12: "https://na4.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=7894201c-9ab2-4d7e-8126-18094731fd82&env=na4&acct=ab9821cd-da5d-4091-8f74-e8602b87929d&v=2"
    },
    stripeLinks: {
        service6: {
            monthly: "https://buy.stripe.com/test_6month_monthly",
            upfront: "https://buy.stripe.com/test_6month_upfront"
        },
        service12: {
            monthly: "https://buy.stripe.com/test_12month_monthly",
            upfront: "https://buy.stripe.com/test_12month_upfront"
        }
    },
    googleDrive: {
        defaultUploadLink: "https://drive.google.com/drive/folders/1jds7K6SdV6G_SwTyZZjxqjuftqIHiaPY?usp=sharing"
    },
    support: {
        opsEmail: "Nicolas@driveleadmedia.com",
        opsPhone: "(678) 650-6411"
    }
};
