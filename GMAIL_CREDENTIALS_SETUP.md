# Gmail Credentials Setup for Firebase Functions

## ⚠️ CRITICAL: Configure Email Credentials

**Status:** 🔴 REQUIRED FOR EMAIL NOTIFICATIONS
**Priority:** HIGH
**Impact:** Email notifications will fail without proper configuration

---

## What This Fixes

The Cloud Functions now **require** proper Gmail credentials to be configured. The functions will fail fast with a clear error message if credentials are missing, instead of silently failing with an empty password.

---

## Setup Instructions

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Under "Signing in to Google", click **App passwords**
5. Click **Select app** → Choose **Mail**
6. Click **Select device** → Choose **Other (Custom name)**
7. Enter: `Drive Lead Media Portal`
8. Click **Generate**
9. **Copy the 16-character app password** (format: xxxx xxxx xxxx xxxx)

⚠️ **IMPORTANT**:
- This is NOT your regular Gmail password
- You can only see this password once - copy it now!
- This is more secure than using your actual Gmail password

### Step 2: Configure Firebase Functions

In your terminal, run:

```bash
# Navigate to your project directory
cd /Users/nicolasleroo/Desktop/Client-portal/Client-portal/Client-portal

# Set the email address
firebase functions:config:set gmail.email="nicolas@driveleadmedia.com"

# Set the app password (replace with your actual app password)
firebase functions:config:set gmail.password="your-16-char-app-password"
```

### Step 3: Verify Configuration

Check that the config was set correctly:

```bash
firebase functions:config:get
```

You should see:

```json
{
  "gmail": {
    "email": "nicolas@driveleadmedia.com",
    "password": "your-app-password"
  }
}
```

### Step 4: Deploy Functions

After setting the config, redeploy your functions:

```bash
firebase deploy --only functions
```

---

## Testing Email Functionality

### Test Website Quote Email

1. Go to the website quote form
2. Fill out all fields with test data
3. Submit the form
4. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```
5. Look for: `📧 Creating email transport for: nicolas@driveleadmedia.com`
6. Check your email inbox for the notification

### Test Creative Ready Email

1. In admin dashboard, set a client's `step5Complete` to `true`
2. Check Firebase Functions logs for email send confirmation
3. Verify client receives the "Creatives Ready" email

---

## Troubleshooting

### Error: "Email credentials not configured"

**Cause:** Gmail credentials not set in Firebase config

**Fix:**
```bash
firebase functions:config:set gmail.email="..." gmail.password="..."
firebase deploy --only functions
```

### Error: "Invalid login" or "Application-specific password required"

**Cause:** Using regular Gmail password instead of app password

**Fix:**
1. Generate a new app password (see Step 1)
2. Update the config:
   ```bash
   firebase functions:config:set gmail.password="new-app-password"
   firebase deploy --only functions
   ```

### Error: "Less secure app access"

**Cause:** Google account security settings

**Fix:**
- Use app passwords (NOT less secure app access)
- Enable 2-Step Verification first
- Generate app password as described in Step 1

### Emails not sending (no error)

**Cause:** Function may be failing silently

**Check:**
1. Firebase Console → Functions → Logs
2. Look for any error messages
3. Verify config is set: `firebase functions:config:get`

---

## Security Best Practices

✅ **DO:**
- Use app passwords (16-character generated passwords)
- Store credentials only in Firebase config (never in code)
- Enable 2-Step Verification on Gmail account
- Revoke old app passwords you're not using
- Monitor Firebase Functions logs for unauthorized access

❌ **DON'T:**
- Commit credentials to git
- Use your actual Gmail password
- Share app passwords
- Store passwords in environment variables on client side
- Hardcode fallback passwords in the code

---

## Alternative: Use SendGrid or AWS SES

If you prefer not to use Gmail, you can switch to:

### SendGrid (Recommended for production)

```javascript
// In functions/index.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(functions.config().sendgrid.apikey);

function sendEmail(to, subject, html) {
  return sgMail.send({
    to,
    from: 'noreply@driveleadmedia.com',
    subject,
    html
  });
}
```

### AWS SES

```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({
  accessKeyId: functions.config().aws.accesskey,
  secretAccessKey: functions.config().aws.secretkey,
  region: 'us-east-1'
});
```

---

## Monitoring

After setup, monitor email delivery:

1. Firebase Console → Functions → Logs
2. Look for successful sends: `✓ Email sent to...`
3. Set up log-based metrics for email failures
4. Consider adding delivery confirmation webhooks

---

## Estimated Time

- **Setup**: 10 minutes
- **Testing**: 5 minutes
- **Total**: 15 minutes

---

## Support

If you encounter issues:
- [Firebase Functions Config Documentation](https://firebase.google.com/docs/functions/config-env)
- [Gmail App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Nodemailer Gmail Setup](https://nodemailer.com/usage/using-gmail/)
