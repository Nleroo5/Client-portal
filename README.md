# Drive Lead Media Portal - Complete Setup Guide

## 🎯 Quick File Reference

### **Need to change...** → **Edit this file:**

| What You Want to Change | File | Line (approx) |
|-------------------------|------|---------------|
| **Email addresses** | `config.js` | 32 |
| **Phone numbers** | `config.js` | 33 |
| **Admin password** | `config.js` | 38 |
| **DocuSign links** | `config.js` | 5-8 |
| **Stripe payment links** | `config.js` | 12-19 |
| **Google Drive upload link** | `config.js` | 23 |
| **Step content/text** | `index.html` | Find the step section |
| **Button colors** | `styles.css` | 160-190 |
| **Background colors** | `styles.css` | 15-45 |
| **Enable/disable animations** | `config.js` | 43-47 |

## 📂 Complete File Structure

```
drive-lead-media-portal/
├── index.html     # Main page structure & all steps
├── styles.css     # All colors, fonts, design & animations  
├── config.js      # Settings: emails, links, passwords, features
├── functions.js   # All JavaScript functionality & animations
└── README.md      # This complete guide
```

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
