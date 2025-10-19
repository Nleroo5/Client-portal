# Quick Deploy Instructions

## Step 1: Re-authenticate with Firebase

Run this command (it will open a browser):

```bash
firebase login --reauth
```

Follow the browser prompts to log in with your Google account.

---

## Step 2: Configure Gmail Credentials

First, get your Gmail App Password:
1. Go to: https://myaccount.google.com/apppasswords
2. Create a new app password named "Firebase Functions"
3. Copy the 16-character password (example: `bkac bcox cxuz emhh`)

Then run these commands (replace with your actual app password):

```bash
firebase functions:config:set gmail.email="nicolas@driveleadmedia.com"
firebase functions:config:set gmail.password="bkac bcox cxuz emhh"
```

**Note:** The password should be 16 characters (the one you shared earlier looks correct!)

---

## Step 3: Verify Configuration

Check that the config was saved:

```bash
firebase functions:config:get
```

You should see:
```json
{
  "gmail": {
    "email": "nicolas@driveleadmedia.com",
    "password": "bkac bcox cxuz emhh"
  }
}
```

---

## Step 4: Deploy Functions

Deploy the email notification function:

```bash
firebase deploy --only functions
```

This will take 1-2 minutes. You should see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/drive-lead-media-crm/overview
Functions:
✔  functions[sendWebsiteQuoteEmail(us-central1)]
```

---

## Step 5: Test It!

1. Go to your website quote form
2. Fill it out and submit
3. Check your email at `nicolas@driveleadmedia.com`

You should receive a beautiful email notification!

---

## Troubleshooting

### If deployment fails:

```bash
# Check Firebase project
firebase use

# Should show: drive-lead-media-crm

# If wrong project, set it:
firebase use drive-lead-media-crm

# Try deploy again
firebase deploy --only functions
```

### If email doesn't send:

```bash
# Check function logs
firebase functions:log --only sendWebsiteQuoteEmail

# Look for "✓ Email sent" message
```

### If you see authentication errors:

```bash
# Clear cache and re-login
firebase logout
firebase login
```

---

## Summary

**Commands to run in order:**

```bash
# 1. Re-authenticate
firebase login --reauth

# 2. Configure Gmail (use your actual app password)
firebase functions:config:set gmail.email="nicolas@driveleadmedia.com"
firebase functions:config:set gmail.password="bkac bcox cxuz emhh"

# 3. Verify
firebase functions:config:get

# 4. Deploy
firebase deploy --only functions

# 5. Test by submitting a form!
```

---

**Need help?** Check the logs:
```bash
firebase functions:log
```
