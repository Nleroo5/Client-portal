# Website Quote Portal Guide

## Overview
The Website Quote Portal allows clients to fill out a comprehensive discovery form about their website needs. This helps you gather all necessary information to create accurate quotes and build custom websites.

## Files Created
- `index-website-quote.html` - Client-facing discovery form
- `website-quote-functions.js` - Form logic, auto-save, and Firebase integration
- Updated `admin.html` - Added "Website Quotes" tab for management

## How It Works

### For Clients
1. You send them a link: `https://portal.driveleadmedia.com/index-website-quote.html?c=QUOTE_ID`
2. They fill out the multi-step form (6 sections so far):
   - Section 1: The Business
   - Section 2: Project Details
   - Section 3: Current Website (if applicable)
   - Section 4: Websites They Like
   - Section 5: Look & Feel
   - Section 6: Your Customers
3. Form auto-saves every 30 seconds
4. They can return anytime to continue where they left off
5. Progress bar shows completion percentage

### For You (Admin)
1. Log into admin dashboard at `https://portal.driveleadmedia.com/admin.html`
2. Click "Website Quotes" tab
3. See all quote requests with stats:
   - Incomplete
   - Completed
   - Quote Sent
   - Won
4. Filter quotes by status
5. For each quote you can:
   - **View Details** - See all their answers
   - **Generate AI Prompt** - Auto-create a prompt for Claude to build the website
   - **Copy Link** - Get the form URL to send to client
   - **Change Status** - Update quote status

## Key Features

### Auto-Save
- Saves every 30 seconds automatically
- Saves when user clicks away from a field
- Shows "Saving..." and "Saved ✓" indicators
- Client can close browser and come back later

### Progress Tracking
- Calculates completion % based on required fields
- Visual progress bar
- Shows current section

### Conditional Logic
- "Do you have a current website?" → Shows/hides related questions
- Smart form that only asks relevant questions

### AI Prompt Generator
The most powerful feature! When you click "Generate AI Prompt":
1. It pulls all the client's answers
2. Creates a structured prompt for Claude Code
3. You copy it and paste into Claude
4. Claude builds the website based on their exact specifications

**Example Generated Prompt:**
```
I need a website for Joe's Pizza, a Restaurant in Chicago, IL...

BUSINESS OVERVIEW:
Joe's Pizza is a Restaurant that's been in business for 5-10 years...

DESIGN DIRECTION:
The site should feel Modern and Clean, Warm and Friendly, similar to www.dominos.com...

Use these colors:
- Main: Red (#FF0000)
- Secondary: White
- Accent: Gold
...
```

## Creating a New Quote Request

### Method 1: Send Link Directly
Send client: `https://portal.driveleadmedia.com/index-website-quote.html?c=NEW`
- System will auto-generate a unique ID
- Client fills out form
- Appears in your admin dashboard

### Method 2: Create Manually (Future Feature)
- Add "Create New Quote" button in admin dashboard
- Enter client email
- System sends them the link automatically

## Database Structure

### Collection: `websiteQuotes`
Each quote document contains:
```javascript
{
  quoteId: "WQ_1696724800000",
  status: "incomplete" | "completed" | "quote-sent" | "won" | "lost",
  completionPercent: 75,
  createdAt: timestamp,
  lastUpdated: timestamp,

  // Business Info
  businessName: "Joe's Pizza",
  ownerName: "Joe Smith",
  email: "joe@joespizza.com",
  phone: "(555) 123-4567",

  // All their form answers...
}
```

## Status Workflow

```
Incomplete → Completed → Quote Sent → Won
                              ↓
                            Lost
```

1. **Incomplete** - Client hasn't finished the form
2. **Completed** - Client finished, ready for your review
3. **Quote Sent** - You sent them a quote
4. **Won** - They accepted, project starts
5. **Lost** - They declined or went with competitor

## Next Steps to Complete

### Add More Sections (7-16)
The template has 16 sections total. Currently implemented: 1-6
Still to add:
- Section 7: Pages Needed
- Section 8: Features & Functionality
- Section 9: Content
- Section 10: Updates & Maintenance
- Section 11: Marketing & SEO
- Section 12: Technical Needs
- Section 13: Competition
- Section 14: Goals & Success
- Section 15: Problems to Solve
- Section 16: Special Requests

### Add Quote Calculator
Automatically calculate estimated price based on:
- Number of pages
- E-commerce features
- Custom integrations
- Budget range

### Add PDF Quote Generator
Generate professional PDF with:
- Cover page with their logo
- Project scope
- Timeline
- Investment breakdown
- Terms & conditions

### Add Email Notifications
- Client: Welcome, progress reminder, completion confirmation
- Admin: New quote, quote completed alerts

## Testing Checklist

- [ ] Create new quote form
- [ ] Fill out sections 1-6
- [ ] Verify auto-save works
- [ ] Close browser and reopen - data persists
- [ ] Complete form and see completion screen
- [ ] Check admin dashboard shows the quote
- [ ] Filter quotes by status
- [ ] View quote details
- [ ] Generate AI prompt
- [ ] Copy prompt to clipboard
- [ ] Copy quote link
- [ ] Change quote status
- [ ] Test on mobile device

## Security

- Client can only access their own quote via unique URL
- Admin must be logged in to view all quotes
- Firebase security rules prevent unauthorized access
- Auto-save runs client-side, data encrypted in transit

## Support

For questions or issues:
- Email: Nicolas@driveleadmedia.com
- Phone: (678) 650-6411

## Version History

**v1.0 - October 2025**
- Initial release
- Sections 1-6 implemented
- Auto-save functionality
- Admin dashboard integration
- AI prompt generator
- Status management
