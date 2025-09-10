# Drive Lead Media Portal - Edit Guide

## 🎯 Quick File Reference

### **Need to change...** → **Edit this file:**

| What You Want to Change | File | Line (approx) |
|-------------------------|------|---------------|
| **Email addresses** | `config.js` | 23 |
| **Phone numbers** | `config.js` | 24 |
| **Admin password** | `config.js` | 29 |
| **DocuSign links** | `config.js` | 4-9 |
| **Stripe payment link** | `config.js` | 12 |
| **Google Drive upload link** | `config.js` | 15-17 |
| **Step content/text** | `index.html` | Find the step section |
| **Button colors** | `styles.css` | 120-140 |
| **Background colors** | `styles.css` | 20-40 |
| **All functionality** | `functions.js` | As needed |

## 📂 File Structure

```
drive-lead-media-portal/
├── index.html     # Main page structure & all steps
├── styles.css     # All colors, fonts, and design  
├── config.js      # Settings: emails, links, passwords
├── functions.js   # All JavaScript functionality
└── README.md      # This guide
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
**File:** `config.js` **Line:** 23
```javascript
opsEmail: "newEmail@driveleadmedia.com",  // ← Change this
```

### **Change Phone Number**
**File:** `config.js` **Line:** 24  
```javascript
opsPhone: "(555) 123-4567",  // ← Change this
```

### **Change Admin Password**
**File:** `config.js` **Line:** 29
```javascript
password: "newPassword123",  // ← Change this
```

### **Update Step 3 Heading**
**File:** `index.html` **Line:** ~165
```html
<h2>Meta Access & Brand Kit</h2>  <!-- ← Change this -->
```

### **Change Button Color**
**File:** `styles.css` **Line:** ~125
```css
.btn {
    background: #NEW_COLOR;  /* ← Change this */
}
```

### **Change Background Color**
**File:** `styles.css` **Line:** ~15
```css
body {
    background: linear-gradient(135deg, #NEW_COLOR1 0%, #NEW_COLOR2 100%);
}
```

## 🎨 Color Reference (Current Colors)

```css
Primary Blue: #012E40
Teal: #05908C  
Light Teal: #85C7B3
Orange/Gold: #F2A922
Light Cream: #EEF4D9
```

## 🔍 Finding Specific Content

### **To find Step content:**
1. Open `index.html`
2. Use Ctrl+F (or Cmd+F on Mac)
3. Search for the text you want to change
4. Edit directly

### **To find email/phone settings:**
1. Open `config.js`
2. Look in the `support:` section (around line 23)

### **To find colors:**
1. Open `styles.css`
2. Search for the current color code (like `#012E40`)

## ⚠️ Safety Tips

### **✅ Safe to Edit:**
- Text content in `index.html`
- Colors in `styles.css`
- Settings in `config.js`
- Email addresses, phone numbers, links

### **⚠️ Be Careful With:**
- Anything with `{` `}` brackets
- JavaScript function names
- HTML tags (things with `<` `>`)

### **🆘 If Something Breaks:**
1. Go to your GitHub repository
2. Click **"Commits"** tab
3. Click **"Revert"** on the last change
4. Everything goes back to working!

## 📞 Need Help?

1. **Small Changes**: Use this guide and edit directly
2. **Big Changes**: Ask Claude to help (now you won't hit rate limits!)
3. **Broken Something**: Use GitHub's revert feature

## 🎉 Benefits of This Structure

✅ **Edit one line** instead of rewriting 2000+ lines  
✅ **No rate limits** - make unlimited small changes  
✅ **Safe experimentation** - easy to undo mistakes  
✅ **GitHub tracks everything** - see exactly what changed  
✅ **No coding software needed** - edit directly in browser

---

**Happy editing!** 🚀 This structure will make your life much easier for managing the portal.
