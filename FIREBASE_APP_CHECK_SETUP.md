# Firebase App Check Setup Guide

## ⚠️ CRITICAL SECURITY: Enable Firebase App Check

**Status:** 🔴 NOT CONFIGURED
**Priority:** CRITICAL
**Risk:** API keys can be abused from unauthorized origins

---

## What is Firebase App Check?

Firebase App Check helps protect your backend resources (Firestore, Storage, Cloud Functions) from abuse by ensuring requests come from your authentic app and not from unauthorized sources.

Without App Check:
- ❌ Anyone can use your Firebase API key from any website
- ❌ Potential for quota exhaustion attacks
- ❌ Unauthorized data access attempts
- ❌ Cost overruns from abuse

With App Check:
- ✅ Only requests from your verified domains are accepted
- ✅ Protection against quota exhaustion
- ✅ Better security posture
- ✅ Rate limiting and abuse prevention

---

## Setup Instructions

### Step 1: Enable App Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **drive-lead-media-crm**
3. Navigate to **Build** → **App Check** in the left sidebar
4. Click **Get Started**

### Step 2: Register Your Web App

1. In App Check dashboard, select your web app
2. Choose **reCAPTCHA Enterprise** as the provider (recommended) or **reCAPTCHA v3**
3. Click **Save**

### Step 3: Get Site Keys

#### For reCAPTCHA v3 (Easier):
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Click **+** to create a new site
3. Choose **reCAPTCHA v3**
4. Add your domains:
   - `portal.driveleadmedia.com`
   - `drive-lead-media-crm.web.app`
   - `drive-lead-media-crm.firebaseapp.com`
   - `localhost` (for testing)
5. Copy the **Site Key**

#### For reCAPTCHA Enterprise (More secure):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **reCAPTCHA Enterprise API**
3. Create reCAPTCHA Enterprise key
4. Add same domains as above
5. Copy the **Site Key**

### Step 4: Add App Check to Your Web Apps

Add this code to **ALL** HTML files BEFORE Firebase initialization:

```html
<!-- Add this BEFORE Firebase SDK scripts -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check-compat.js"></script>

<!-- Then in your config.js or inline: -->
<script>
    // Initialize Firebase first
    firebase.initializeApp(firebaseConfig);

    // Initialize App Check immediately after
    const appCheck = firebase.appCheck();
    appCheck.activate(
        'YOUR-RECAPTCHA-SITE-KEY-HERE', // Replace with your reCAPTCHA site key
        true // Enable automatic token refresh
    );
</script>
```

### Step 5: Enforce App Check on Backend

Update Firestore Security Rules to require App Check:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require App Check for all requests
    match /{document=**} {
      allow read, write: if request.auth != null || request.app != null;
    }

    // Your existing rules...
  }
}
```

### Step 6: Enable App Check for All Services

In Firebase Console → App Check, enable for:
- ✅ Firestore
- ✅ Cloud Storage
- ✅ Cloud Functions
- ✅ Realtime Database (if used)

### Step 7: Test in Debug Mode First

Before enforcing, test with debug tokens:

1. In Firebase Console → App Check → Apps → Web
2. Click **Manage debug tokens**
3. Click **Add debug token**
4. In your browser console, run:
   ```javascript
   self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
   ```
5. Reload the page and copy the debug token from console
6. Add this token to Firebase Console
7. Test all portal functionality

### Step 8: Monitor Metrics

After enabling:
1. Go to Firebase Console → App Check → Metrics
2. Monitor:
   - Valid requests (should be 100%)
   - Invalid requests (should be 0%)
   - Any spikes indicate potential abuse attempts

---

## Files to Update

### 1. index-contract.html
Add App Check initialization after line 500 (after Firebase init)

### 2. index-m2m.html
Add App Check initialization after line 497

### 3. index-website-quote.html
Add App Check initialization in the `<head>` section

### 4. admin.html
Add App Check initialization (admin portal should also be protected)

### 5. sales-dashboard.html
Add App Check initialization

---

## Testing Checklist

After implementing App Check:

- [ ] Client portals load correctly
- [ ] Firestore reads/writes work
- [ ] File uploads to Storage work
- [ ] Cloud Functions trigger successfully
- [ ] Email notifications send
- [ ] No console errors related to App Check
- [ ] Debug tokens work in development
- [ ] Production domains verified

---

## Rollback Plan

If App Check causes issues:

1. In Firebase Console → App Check
2. Click on each service (Firestore, Storage, etc.)
3. Switch from **Enforce** to **Monitor** mode
4. Fix issues while monitoring
5. Re-enable Enforce mode

---

## Additional Security (After App Check)

1. **Domain Restrictions**: In Google Cloud Console → Credentials, restrict API key to specific domains
2. **Rate Limiting**: Enable Firestore/Storage quotas
3. **Budget Alerts**: Set up billing alerts in Google Cloud
4. **Audit Logs**: Enable Cloud Audit Logs for sensitive operations

---

## Support

If you encounter issues:
- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/v3)
- Firebase Support: support@firebase.google.com

---

## Estimated Time to Complete

- **Setup**: 30-45 minutes
- **Testing**: 15-30 minutes
- **Deployment**: 5 minutes

**Total**: ~1.5 hours

---

**⚠️ DO NOT SKIP THIS**: App Check is critical for preventing API abuse and protecting your Firebase resources from unauthorized access.
