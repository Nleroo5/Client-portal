# Test Email Notification Guide

## ✅ Email Function Successfully Deployed!

The `sendWebsiteQuoteEmail` Cloud Function is now live and ready to send you email notifications when website discovery forms are completed.

---

## How It Works

The function automatically triggers when:
1. A website quote document in Firestore is **updated**
2. The `status` field changes from anything → `completed`
3. Sends a beautifully formatted email to `nicolas@driveleadmedia.com`

---

## Test the Email Notification

### **Method 1: Submit a Real Form (Recommended)**

1. Go to your website discovery form URL
2. Fill out all required fields (at least the first section)
3. Complete the form all the way through
4. Click the final submit button
5. Check your email at `nicolas@driveleadmedia.com`

**Expected result:** You should receive an email within 1-2 minutes with:
- Subject: "🎯 New Website Discovery Form Submitted - [Business Name]"
- Business details, budget, reference websites
- Direct link to admin dashboard

---

### **Method 2: Manually Update Firestore (Quick Test)**

1. Go to [Firebase Console → Firestore](https://console.firebase.google.com/project/drive-lead-media-crm/firestore/databases/-default-/data)
2. Navigate to `websiteQuotes` collection
3. Find an existing quote OR create a test quote
4. Update the `status` field:
   - Change from `incomplete` → `completed`
   - Or from any other value → `completed`
5. Save the document
6. Check your email within 1-2 minutes

---

### **Method 3: Use Firebase Emulator (Development)**

If you want to test locally without affecting production:

```bash
# Start emulators
firebase emulators:start --only functions,firestore

# In another terminal, trigger the function manually
# (This requires setting up a test document)
```

---

## What the Email Looks Like

**Subject:**
```
🎯 New Website Discovery Form Submitted - [Business Name]
```

**Body:**
- **Header:** Gradient banner "New Website Discovery Form"
- **Section 1:** Business details (Name, Owner, Email, Phone)
- **Section 2:** Project details (Business Type, Locations, Budget Range)
- **Section 3:** Reference websites (all URLs client provided)
- **Button:** "View Full Details in Admin Dashboard" → Links to admin
- **Footer:** Quote ID and submission timestamp

---

## Troubleshooting

### **Email not received?**

**Check 1: Function Logs**
```bash
firebase functions:log --only sendWebsiteQuoteEmail --limit 10
```

Look for:
- ✓ `Email sent to nicolas@driveleadmedia.com for quote WQ_...`
- ❌ Error messages

**Check 2: Spam Folder**
- Check Gmail spam/promotions folder
- Add `nicolas@driveleadmedia.com` to contacts
- Mark as "Not spam"

**Check 3: Gmail App Password**
```bash
# Verify password is set correctly
firebase functions:config:get
```

Should show:
```json
{
  "gmail": {
    "email": "nicolas@driveleadmedia.com",
    "password": "bkac bcox cxuz emhh"
  }
}
```

**Check 4: Function Status**
```bash
firebase functions:list | grep sendWebsiteQuoteEmail
```

Should show status (OFFLINE is normal for Firestore triggers)

---

### **Gmail blocking the emails?**

If Gmail blocks nodemailer even with app password:

**Option A: Enable "Less secure app access"**
1. Go to: https://myaccount.google.com/lesssecureapps
2. Toggle ON (temporarily for testing)
3. Try again

**Option B: Switch to SendGrid (Production)**

SendGrid is more reliable for production:

1. Sign up: https://sendgrid.com/ (Free: 100 emails/day)
2. Get API key
3. Update function code to use SendGrid instead of nodemailer
4. Redeploy

---

## View Function Logs in Real-Time

To monitor the function as it runs:

```bash
# Stream logs in real-time
firebase functions:log --only sendWebsiteQuoteEmail

# Or view in Firebase Console
# https://console.firebase.google.com/project/drive-lead-media-crm/functions/logs
```

---

## Email Configuration Details

**Stored in:** Firebase Runtime Config (deprecated but working until March