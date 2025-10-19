# Email Notification Setup Guide

## Overview
Your website discovery form now sends you an email notification at `nicolas@driveleadmedia.com` whenever someone completes the form!

---

## What Was Changed

### 1. **Completion Screen** ([index-website-quote.html](index-website-quote.html#L1813-L1831))
   - Simplified to show personalized thank you message
   - Shows client's name: "Thank You, [Client Name]!"
   - Includes your contact info
   - Removed ballpark quote estimate section

### 2. **Email Notification Function** ([functions/index.js](functions/index.js#L174-L276))
   - Triggers when quote status changes to 'completed'
   - Sends beautifully formatted HTML email
   - Includes:
     - Business name, owner, email, phone
     - Budget range, business type, locations
     - Reference websites (all URLs they provided)
     - Direct link to admin dashboard
     - Quote ID and timestamp

### 3. **Dependencies** ([functions/package.json](functions/package.json#L19))
   - Added `nodemailer` for email sending

---

## Setup Instructions

### **Step 1: Install Dependencies**

Navigate to your functions folder and install the new package:

```bash
cd functions
npm install
```

### **Step 2: Set Up Gmail App Password**

You need to create a Gmail App Password for nodemailer to work:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Click **Generate** and select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Enter "Firebase Functions"
5. Copy the 16-character password (example: `abcd efgh ijkl mnop`)

### **Step 3: Configure Firebase with Gmail Credentials**

Run these commands from your project root (NOT in the functions folder):

```bash
# Set your Gmail email
firebase functions:config:set gmail.email="nicolas@driveleadmedia.com"

# Set your Gmail App Password (replace with your actual password)
firebase functions:config:set gmail.password="abcd efgh ijkl mnop"

# Verify configuration
firebase functions:config:get
```

**Expected output:**
```json
{
  "gmail": {
    "email": "nicolas@driveleadmedia.com",
    "password": "abcd efgh ijkl mnop"
  }
}
```

### **Step 4: Deploy Functions**

Deploy the updated Cloud Functions:

```bash
firebase deploy --only functions
```

**Expected output:**
```
✔  Deploy complete!

Functions:
✔  functions[sendWebsiteQuoteEmail(us-central1)]
```

---

## Testing the Email System

### **Test 1: Complete a Form**
1. Open your website quote form
2. Fill in all required fields
3. Submit the form
4. Check `nicolas@driveleadmedia.com` inbox

### **Test 2: Check Firebase Logs**
```bash
firebase functions:log --only sendWebsiteQuoteEmail
```

Look for:
- `✓ Email sent to nicolas@driveleadmedia.com for quote WQ_...`
- Any error messages

---

## What the Email Looks Like

**Subject:** 🎯 New Website Discovery Form Submitted - [Business Name]

**Body:**
- 🎯 Header with "New Website Discovery Form"
- Business details (name, owner, email, phone)
- Project details (business type, locations, budget)
- Reference websites (all URLs they added)
- **"View Full Details in Admin Dashboard"** button
- Quote ID and timestamp

---

## Troubleshooting

### **Problem: Email not sending**

**Check 1: Firebase Function Logs**
```bash
firebase functions:log
```

**Check 2: Gmail Configuration**
```bash
firebase functions:config:get
```

**Check 3: Less Secure Apps**
- Gmail may block nodemailer even with app password
- Try enabling "Less secure app access" temporarily

### **Problem: "Invalid login" error**

**Solution:**
- Verify your Gmail app password is correct
- Make sure 2-Step Verification is enabled
- Regenerate app password if needed

### **Problem: Email goes to spam**

**Solution:**
- Add `nicolas@driveleadmedia.com` to your contacts
- Mark as "Not spam" in Gmail
- Consider using SendGrid for production (more reliable)

---

## Alternative: Use SendGrid (Recommended for Production)

If Gmail doesn't work or for better reliability:

### **1. Sign up for SendGrid**
- Free tier: 100 emails/day
- https://sendgrid.com/

### **2. Get API Key**
- Create API key in SendGrid dashboard
- Full Access permissions

### **3. Update Firebase Config**
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### **4. Update functions/index.js**

Replace the email configuration section with:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(functions.config().sendgrid.key);

// In the sendWebsiteQuoteEmail function, replace mailTransport.sendMail() with:
await sgMail.send(mailOptions);
```

### **5. Update package.json**
```bash
cd functions
npm install @sendgrid/mail
```

---

## Summary

✅ **Completion screen simplified** - Clean thank you message with your contact info
✅ **Email notification added** - You'll receive an email for every completed form
✅ **Ready to deploy** - Just follow the setup steps above

---

## Need Help?

If you run into issues:
1. Check Firebase Functions logs: `firebase functions:log`
2. Test locally first: `firebase emulators:start --only functions`
3. Verify Gmail app password is correct
4. Consider switching to SendGrid for production

---

**Next Steps:**
1. Run `cd functions && npm install`
2. Set up Gmail app password
3. Configure Firebase with `firebase functions:config:set`
4. Deploy with `firebase deploy --only functions`
5. Test by submitting a form!
