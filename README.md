# Drive Lead Media Portal - Unified System

## 🎯 Overview

This is a **unified portal system** managing two types of client onboarding workflows:
- **Contract Portal** (`index.html`) - For 6-month or 12-month service agreements
- **Month-to-Month Portal** (`index-m2m.html`) - For month-to-month clients

Both portals share the same Firebase database and are managed through a single admin dashboard.

## 📂 File Structure

```
Client-Portal/
├── index.html          # Contract portal (6/12-month clients)
├── index-m2m.html      # Month-to-month portal
├── admin.html          # Unified admin dashboard (manages both portal types)
├── config.js           # Shared Firebase config & default links
├── functions.js        # Contract portal JavaScript logic
├── functions-m2m.js    # Month-to-month portal JavaScript logic
├── styles.css          # Shared CSS styles (used by both portals)
└── README.md           # This guide
```

## 🎯 Quick File Reference

### **Need to change...** → **Edit this file:**

| What You Want to Change | File | Notes |
|-------------------------|------|-------|
| **Email addresses** | `config.js` | Line ~42 |
| **Phone numbers** | `config.js` | Line ~43 |
| **DocuSign links (default)** | `config.js` | Lines 18-23 |
| **Stripe payment links (default)** | `config.js` | Lines 26-36 |
| **Google Drive upload link** | `config.js` | Line ~39 |
| **Contract portal content** | `index.html` | Main portal file |
| **M2M portal content** | `index-m2m.html` | Month-to-month portal |
| **Button colors** | `styles.css` | Lines 575-689 |
| **Background colors** | `styles.css` | Lines 7-30 |

## 🔒 Admin Dashboard Security

The admin dashboard is password-protected to prevent unauthorized access.

**Default Password:** `DLM2024!`

**⚠️ IMPORTANT: Change this password immediately!**

To change the password:
1. Open [admin.html](admin.html) in a text editor
2. Find line 683: `const ADMIN_PASSWORD = "DLM2024!";`
3. Change `"DLM2024!"` to your new password
4. Save the file

**How it works:**
- Password is required on first visit
- Stays logged in for the browser session
- Closing the browser tab requires re-entering password

## 🎛️ Using the Unified Admin Dashboard

### **Creating a New Client Portal**

1. Open `admin.html` in your browser (enter password when prompted)
2. Fill in the client details:
   - Client/Business Name
   - Client Email (optional)
   - **Portal Type:** Select "Contract" or "Month-to-Month"
3. The form will show different fields based on portal type:
   - **Contract Portal:** Shows 6/12-month DocuSign links and Stripe payment options
   - **Month-to-Month Portal:** Shows M2M service agreement and invoice links
4. Add custom links (optional) - leave blank to use defaults
5. Click "Create Client Portal"
6. Copy the generated portal link and send it to your client

### **Portal Type Differences**

| Feature | Contract Portal | Month-to-Month Portal |
|---------|----------------|----------------------|
| **URL** | `portal.driveleadmedia.com?c=ID` | `portal.driveleadmedia.com/index-m2m.html?c=ID` |
| **Step 1** | Sign DPA + Choose 6/12-month agreement | Sign DPA + Service Agreement |
| **Step 2** | Select payment plan (monthly/upfront with 5% discount) | Pay first invoice |
| **Stripe Links** | 4 links (6-month monthly/upfront, 12-month monthly/upfront) | 1 invoice link |

### **Managing Existing Clients**

- View all clients in the dashboard with portal type badges (Contract/M2M)
- Edit client details, progress, and links
- Activate/deactivate portals
- Copy portal links
- Delete clients (requires typing "DELETE" to confirm)

## 🚀 How to Edit (No Coding Experience Needed!)

### **Method 1: GitHub Web Editor (Easiest)**
1. Go to your file on GitHub
2. Click the **pencil icon** (✏️) to edit
3. Make your changes
4. Scroll down and click **"Commit changes"**
5. Done! Changes are live immediately

### **Method 2: Download & Re-upload**
1. Click **"Download"** button on GitHub
2. Edit files on your computer with any text editor
3. Upload back to GitHub
4. Done!

## ⚡ Common Edits - Copy & Paste Examples

### **Change Email Address**
**File:** `config.js` **Line:** 32
```javascript
opsEmail: "newEmail@driveleadmedia.com",  // ← Change this
```

### **Change Phone Number**
**File:** `config.js` **Line:** 33  
```javascript
opsPhone: "(555) 123-4567",  // ← Change this
```

### **Change Admin Password**
**File:** `config.js` **Line:** 38
```javascript
password: "newPassword123",  // ← Change this
```

### **Disable Fireworks Animation**
**File:** `config.js` **Line:** 45
```javascript
enableFireworks: false,  // ← Change to false
```

### **Disable Floating Sidebar**
**File:** `config.js` **Line:** 46
```javascript
enableFloatingSidebar: false,  // ← Change to false
```

### **Update Step Heading**
**File:** `index.html** **Search for:** the text you want to change
```html
<h2>Your New Step Title</h2>  <!-- ← Change this -->
```

### **Change Button Color**
**File:** `styles.css` **Search for:** `.btn {`
```css
.btn {
    background: #NEW_COLOR;  /* ← Change this */
}
```

### **
