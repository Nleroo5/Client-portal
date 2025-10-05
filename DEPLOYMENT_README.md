# 🚀 Deployment Guide - Drive Lead Media Portal

## ⚠️ CRITICAL: You MUST Deploy These Changes

This commit includes **server-side security rules** and **cloud functions** that are **required** for the system to work correctly and securely.

---

## 📋 Pre-Deployment Checklist

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase in this project (if not already done)
```bash
cd /Users/nicolasleroo/Desktop/Client-portal
firebase init

# Select:
# - Firestore (rules)
# - Functions
# - Hosting (if using Firebase hosting)
```

### 3. Install Cloud Functions Dependencies
```bash
cd functions
npm install
cd ..
```

---

## 🔐 Step-by-Step Deployment

### STEP 1: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

**What This Does:**
- Enforces who can read/write data
- Prevents reps from accessing other reps' data
- Blocks reps from moving deals past Discovery Scheduled stage
- Makes scorecard admin-only

**Expected Output:**
```
✔  firestore: released rules firestore.rules to cloud.firestore
✔  Deploy complete!
```

---

### STEP 2: Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**What This Does:**
- Creates 4 cloud functions:
  1. `setRepCustomClaims` - Sets role on new rep
  2. `updateRepCustomClaims` - Updates role when changed
  3. `autoIncrementScorecard` - Auto-updates metrics
  4. `createDealAuditTrail` - Logs all changes

**Expected Output:**
```
✔  functions[setRepCustomClaims(us-central1)] Successful create operation.
✔  functions[updateRepCustomClaims(us-central1)] Successful create operation.
✔  functions[autoIncrementScorecard(us-central1)] Successful create operation.
✔  functions[createDealAuditTrail(us-central1)] Successful create operation.
```

**Deployment Time:** 2-5 minutes

---

### STEP 3: Update Existing Sales Reps with Roles

**IMPORTANT:** Existing reps in your database don't have a `role` field yet. You need to add it manually.

#### Option A: Firebase Console (Easiest)
1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Navigate to `salesReps` collection
5. For each rep document, click Edit
6. Add new field: `role` → `"rep"` (or `"admin"` for admins)
7. Save

#### Option B: Run This Script in Browser Console
1. Open your admin dashboard in browser
2. Open DevTools (F12)
3. Go to Console tab
4. Paste and run this code:

```javascript
// Update all existing reps with default role
const updateRepsWithRoles = async () => {
  const db = firebase.firestore();
  const repsSnapshot = await db.collection('salesReps').get();

  console.log(`Updating ${repsSnapshot.size} reps...`);

  for (const doc of repsSnapshot.docs) {
    const data = doc.data();

    // Set role to 'admin' if email contains 'admin', otherwise 'rep'
    const role = data.email && data.email.toLowerCase().includes('admin') ? 'admin' : 'rep';

    await doc.ref.update({ role: role });
    console.log(`✓ Updated ${data.name}: role=${role}`);
  }

  console.log('Done! All reps updated.');
};

updateRepsWithRoles();
```

---

### STEP 4: Verify Deployment

#### Check Security Rules
```bash
firebase firestore:rules
```

Should show your rules are deployed.

#### Check Functions
```bash
firebase functions:list
```

Should show 4 functions:
- `setRepCustomClaims`
- `updateRepCustomClaims`
- `autoIncrementScorecard`
- `createDealAuditTrail`

#### Test Function Logs
```bash
firebase functions:log --limit 10
```

---

## ✅ Post-Deployment Testing

### Test 1: Rep Permissions
1. Login as a sales rep
2. Try to view another rep's deals → Should see NONE
3. Try to move a deal to "Campaign Live" → Should see error alert
4. Try to edit scorecard → Should fail (read-only)

### Test 2: Admin Permissions
1. Login as admin
2. Should see ALL deals from ALL reps
3. Can move deals to any stage
4. Can edit scorecard values

### Test 3: Auto-Increment Scorecard
1. As admin, move a deal to "Discovery Scheduled"
2. Check that rep's scorecard in Firestore
3. `discoveryScheduled` should increment by 1
4. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only autoIncrementScorecard
   ```

### Test 4: Audit Trail
1. Update any deal (change stage, MRR, etc.)
2. Go to Firestore → `dealAudit` collection
3. Should see new document with change log

---

## 🚨 Troubleshooting

### Error: "Permission Denied"
**Cause:** Firestore rules deployed but rep doesn't have `role` field

**Fix:** Complete STEP 3 above (add role to all reps)

---

### Error: "Function failed to deploy"
**Cause:** Node version incompatibility

**Fix:**
```bash
# Check Node version
node --version

# Should be v16 or v18
# If not, install correct version:
nvm install 18
nvm use 18

# Retry deployment
firebase deploy --only functions
```

---

### Error: "Scorecard not updating automatically"
**Check:**
```bash
firebase functions:log --only autoIncrementScorecard
```

**Common causes:**
- Deal doesn't have `assignedTo` field
- Function needs time to trigger (wait 10-30 seconds)
- Function error (check logs above)

---

### Cloud Function Costs
**Current Setup:**
- Free tier: 2,000,000 invocations/month
- Your usage: ~10-50 invocations/day (very low)
- **Cost: $0/month** (well within free tier)

---

## 📊 Monitoring

### View Function Activity
```bash
# All function logs
firebase functions:log

# Specific function
firebase functions:log --only setRepCustomClaims

# Follow logs in real-time
firebase functions:log --follow
```

### View Database Activity
- Firebase Console → Firestore → Usage tab
- Check read/write counts
- Monitor security rule denials

---

## 🔄 Rollback Plan

If something goes wrong:

### Rollback Security Rules
```bash
# Find your previous rules
git log --oneline firestore.rules

# Checkout previous version
git show HEAD~1:firestore.rules > firestore.rules.backup

# Deploy backup
firebase deploy --only firestore:rules
```

### Disable Cloud Functions
```bash
# Delete specific function
firebase functions:delete autoIncrementScorecard

# Or delete all
firebase functions:delete setRepCustomClaims updateRepCustomClaims autoIncrementScorecard createDealAuditTrail
```

---

## 📞 Support

**Firebase Documentation:**
- Rules: https://firebase.google.com/docs/firestore/security/get-started
- Functions: https://firebase.google.com/docs/functions

**Common Commands:**
```bash
# Check deployment status
firebase deploy:status

# View project info
firebase projects:list

# Switch projects
firebase use <project-id>

# Test rules locally
firebase emulators:start --only firestore
```

---

## ✨ What Changed (Summary)

**Before:**
- ❌ No security rules (anyone could access any data)
- ❌ Manual scorecard updates
- ❌ No audit trail
- ❌ Session storage security (easily bypassed)

**After:**
- ✅ Server-side security enforcement
- ✅ Automatic scorecard updates
- ✅ Complete audit trail
- ✅ Role-based access control

**Result:** Production-ready, secure CRM system
