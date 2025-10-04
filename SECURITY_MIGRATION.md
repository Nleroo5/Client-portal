# Security Migration Guide

## Critical Security Updates Applied

This document outlines the security improvements made to the Drive Lead Media Portal and steps required to complete the migration.

---

## ✅ Changes Already Implemented

### 1. **Firestore Security Rules** (`firestore.rules`)
- Created comprehensive security rules to protect database
- Admin-only access to clients collection
- Sales reps can only access their own data
- All write operations require authentication

### 2. **Server-Side Authentication Checks**
- **Admin Dashboard**: Now verifies Firebase Authentication before allowing access
- **Sales Dashboard**: Verifies user is authenticated AND is a valid sales rep
- Both dashboards redirect to login if authentication fails

### 3. **Improved Sales Rep Login**
- Now attempts Firebase Authentication first
- Falls back to legacy password check (temporary, for migration)
- Warns users if account needs migration

### 4. **Secure Logout**
- Admin and Sales Rep logout now properly signs out of Firebase
- Clears all session data

---

## 🚨 REQUIRED ACTIONS (Manual Steps)

### Step 1: Deploy Firestore Security Rules

You MUST deploy the security rules to Firebase:

1. Open Firebase Console: https://console.firebase.google.com/
2. Select project: `drive-lead-media-crm`
3. Go to **Firestore Database** → **Rules** tab
4. Copy contents from `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

**CRITICAL**: Until you do this, your database may be open to public access!

---

### Step 2: Create Firebase Auth Accounts for Existing Sales Reps

For each sales rep in your system, you need to create a Firebase Auth user:

#### Option A: Use Firebase Console (Manual)
1. Go to Firebase Console → **Authentication** → **Users**
2. Click **Add User**
3. Enter rep's email and password
4. Copy the UID
5. Update the rep's Firestore document:
   - Go to Firestore → `salesReps` collection
   - Find the rep's document
   - Change the document ID to match the Firebase Auth UID
   - Make sure `email` field is set

#### Option B: Use Firebase Admin SDK (Automated - Recommended)

Create a Node.js migration script (see below).

---

### Step 3: Migration Script (Recommended Approach)

Create a file called `migrate-reps.js`:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function migrateReps() {
  console.log('Starting sales rep migration...');

  const repsSnapshot = await db.collection('salesReps').get();

  for (const doc of repsSnapshot.docs) {
    const repData = doc.data();

    if (!repData.email) {
      console.log(`⚠️  Skipping ${repData.name} - no email`);
      continue;
    }

    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: repData.email,
        password: repData.password, // Use existing password
        displayName: repData.name
      });

      console.log(`✅ Created auth user for ${repData.name} (UID: ${userRecord.uid})`);

      // Create new document with UID as ID
      await db.collection('salesReps').doc(userRecord.uid).set({
        ...repData,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Remove plaintext password after migration
        password: admin.firestore.FieldValue.delete()
      });

      // Delete old document
      await db.collection('salesReps').doc(doc.id).delete();

      console.log(`✅ Migrated ${repData.name}`);

    } catch (error) {
      console.error(`❌ Error migrating ${repData.name}:`, error);
    }
  }

  console.log('Migration complete!');
}

migrateReps();
```

**To run:**
```bash
npm install firebase-admin
node migrate-reps.js
```

---

## 🔐 Security Improvements Summary

| Issue | Before | After | Impact |
|-------|--------|-------|--------|
| **Database Access** | Public read/write possible | Auth required, role-based access | CRITICAL |
| **Admin Access** | Client-side only check | Firebase Auth + server verification | CRITICAL |
| **Sales Rep Access** | sessionStorage only | Firebase Auth + server verification | HIGH |
| **Passwords** | Stored in plaintext | Firebase Auth (bcrypt hashed) | HIGH |
| **Session Hijacking** | Easy to bypass | Protected by Firebase | HIGH |

---

## 📋 Post-Migration Checklist

- [ ] Deploy Firestore security rules to Firebase
- [ ] Migrate all existing sales reps to Firebase Auth
- [ ] Test admin login
- [ ] Test sales rep login
- [ ] Verify unauthorized access is blocked
- [ ] Remove legacy password fallback code (after confirming all reps migrated)

---

## 🛡️ Remaining Security Improvements (Future)

These are recommended but not critical:

1. **Input Sanitization**: Add validation to prevent XSS attacks
2. **Rate Limiting**: Prevent brute force login attempts
3. **CSRF Protection**: Add tokens to forms
4. **httpOnly Cookies**: Replace sessionStorage for better security
5. **2FA**: Add two-factor authentication for admin
6. **Audit Logging**: Track all admin actions
7. **Password Requirements**: Enforce strong passwords

---

## 🆘 Troubleshooting

### "Permission denied" errors in console
→ You haven't deployed the Firestore security rules yet

### Sales rep can't login
→ Their account hasn't been migrated to Firebase Auth yet

### Admin can't access dashboard
→ Make sure you're using the exact email: `admin@driveleadmedia.com`

---

## 📞 Support

If you encounter issues during migration, check:
1. Firebase Console → Authentication (are users created?)
2. Firebase Console → Firestore → Rules (are rules published?)
3. Browser console for error messages

---

**Document Version**: 1.0
**Last Updated**: 2025-01-04
