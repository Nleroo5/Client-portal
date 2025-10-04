# Sales Dashboard - Complete Feature Guide

## 🎯 Overview

Your sales dashboard is now a **complete, actionable system** that helps reps know exactly what to do every day. It tracks both **activity** (calls, emails) and **results** (deals, conversions).

---

## 📊 Tab 1: My Deals (Pipeline)

### 🔥 Focus Zone (Top Priority)
Shows what needs attention TODAY:
- **Stalled deals** - Deals sitting >7 days in same stage
- **Discovery calls today** - Count of scheduled calls
- **Quick wins** - Deals close to closing (in onboarding/live stages)

**Empty state:** "✅ You're all caught up! Add more deals to your pipeline."

### Deal Cards Intelligence
Each deal card shows:
- **Company name** and contact
- **📅 Days in stage** - How long in current stage
- **⏱️ Last activity** - "Today", "Yesterday", or "X days ago"
- **🔥 STALLING badge** - Red alert if >7 days in stage

### Quick Action Buttons (on each card)
- **📞 Call** - Logs call in scorecard + updates lastUpdated timestamp
- **✉️ Email** - Logs email in scorecard + updates lastUpdated
- **→ Next** - Moves deal to next pipeline stage

### 8 Pipeline Stages:
1. Qualified
2. Cold Outreach
3. Follow-Up
4. Discovery Scheduled
5. Discovery Completed
6. Onboarding Portal
7. Campaign Live
8. Follow-Up & Resell

---

## 📈 Tab 2: This Week (Metrics)

### 6 Key Metrics with Progress Bars:

#### Activity Metrics (Leading Indicators):
1. **📞 Calls Made**
   - Target: 50/week (default)
   - Tracks outreach volume
   - 0.1 point per call

2. **✉️ Emails Sent**
   - Target: 30/week (default)
   - Tracks email prospecting
   - 0.1 point per email

#### Engagement Metrics:
3. **📅 Discovery Calls Scheduled**
   - Target: Set by admin
   - 3 points per scheduled call

4. **✅ Discovery Calls Completed**
   - Target: Set by admin
   - 5 points per completed call
   - Shows % of scheduled calls held

#### Conversion Metrics (Results):
5. **🎯 Deals to Onboarding**
   - Target: Set by admin
   - 10 points per deal

6. **🚀 Deals Gone Live**
   - Target: Set by admin
   - 20 points per live deal

### Color-Coded Status:
- 🟢 **Green** - 100%+ of target (Target hit!)
- 🟡 **Yellow** - 70-99% of target (Close - shows "You need X more")
- 🔴 **Red** - <70% of target (Behind - shows "You need X more")
- ⚪ **Gray** - No target set

### Quick Log Buttons:
- 📞 **Call Made** - Increments calls, updates scorecard
- ✉️ **Email Sent** - Increments emails, updates scorecard
- ✓ **Discovery Scheduled**
- ✓ **Discovery Completed**
- ✓ **To Onboarding**
- ✓ **Gone Live**

**Auto-updates** metrics in real-time with visual feedback.

---

## 🏆 Tab 3: Team (Leaderboard)

### Point System (Activity + Results):
- **Calls Made:** 0.1 pt each
- **Emails Sent:** 0.1 pt each
- **Discovery Scheduled:** 3 pts
- **Discovery Completed:** 5 pts
- **Deals to Onboarding:** 10 pts
- **Deals Gone Live:** 20 pts

### Leaderboard Table:
| Rank | Rep Name | Calls | Emails | Disc | Onboard | Live | Points |
|------|----------|-------|--------|------|---------|------|--------|
| 🥇   | John     | 65    | 42     | 8    | 3       | 2    | 113.7  |
| 🥈   | Sarah    | 58    | 38     | 6    | 2       | 1    | 89.6   |
| 🥉   | Mike     | 45    | 30     | 5    | 2       | 1    | 67.5   |

### Features:
- **Medals** - 🥇🥈🥉 for top 3 performers
- **Highlighted row** - Your row has teal background + "(You)" label
- **Rank display** - Shows your current rank in header
- **Gap to #1** - If not winning, shows "X points behind #1"
- **Week dates** - Shows current week (Mon-Sun)

---

## ✅ Tab 4: Action Items

### 🔥 Stuck Deals (Priority #1)
**NEW!** Shows deals sitting >7 days in same stage:
- Company name
- Days stuck
- Current stage
- Quick actions: **📞 Call** and **→ Next Stage**

**Example:** "ACME Corp - 12 days in Discovery Scheduled"

### 🔴 Overdue
Auto-generated tasks past due date:
- Based on last activity + stage
- Shows days overdue
- Actions: **✓ Done** and **Snooze**

### 🟡 Due Today
Tasks due today based on stage timing:
- Qualified/Cold Outreach → Due in 2 days
- Follow-Up → Due in 3 days
- Discovery Scheduled → Due in 1 day
- Discovery Completed → Due in 1 day
- Onboarding → Due in 7 days
- Campaign Live → Due in 7 days
- Follow-Up Resell → Due in 14 days

### ⚪ Upcoming
Shows next 10 upcoming tasks with due dates.

---

## 🎯 How Reps Should Use the Dashboard

### Daily Routine:
1. **Open Tab 1 (My Deals)**
   - Check 🔥 Focus Zone for today's priorities
   - Address any stalled deals first
   - Use quick action buttons to log activities

2. **Check Tab 4 (Action Items)**
   - Review 🔥 Stuck Deals - call these first!
   - Complete 🔴 Overdue tasks
   - Plan for 🟡 Due Today items

3. **Log Activities in Tab 2 (This Week)**
   - Use quick log buttons as you work
   - Track progress toward weekly targets
   - See real-time progress bars

4. **Check Tab 3 (Team) for Motivation**
   - See your rank
   - Check gap to #1
   - Healthy competition!

### Weekly Review:
- **Monday AM:** Set intentions based on weekly targets
- **Wednesday PM:** Check if on track for targets
- **Friday EOD:** Review week, see what hit/missed

---

## 🔧 Admin: How to Set Weekly Targets

In **admin.html → Sales Reps tab:**

When creating/editing a rep, set Weekly Targets:
- Calls Made: `50` (recommended)
- Emails Sent: `30` (recommended)
- Discovery Calls Scheduled: `5-10` (depends on your sales cycle)
- Discovery Calls Completed: `3-8`
- Deals to Onboarding: `1-3`
- Deals Gone Live: `1-2`

Targets drive the color-coded progress bars and "You need X more" messages.

---

## 📊 Firestore Data Structure

### `scorecard` Collection:
Document ID format: `{repId}_{weekId}`
```javascript
{
  repId: "uid123",
  weekId: "2025-W40",
  callsMade: 45,
  emailsSent: 28,
  discoveryScheduled: 6,
  discoveryCompleted: 4,
  dealsToOnboarding: 2,
  dealsLive: 1,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### `deals` Collection:
```javascript
{
  companyName: "ACME Corp",
  contactName: "John Doe",
  email: "john@acme.com",
  phone: "(555) 123-4567",
  stage: "discovery-scheduled",
  assignedTo: "repUid",
  createdAt: timestamp,
  lastUpdated: timestamp  // Updated when actions taken
}
```

### `salesReps` Collection:
```javascript
{
  name: "John Smith",
  email: "john@driveleadmedia.com",
  role: "rep",
  active: true,
  weeklyTargets: {
    callsMade: 50,
    emailsSent: 30,
    discoveryScheduled: 8,
    discoveryCompleted: 5,
    dealsToOnboarding: 2,
    dealsLive: 1
  }
}
```

---

## 🎨 What Makes This Dashboard Great

### 1. **Actionable Intelligence**
- Not just data - tells reps what to DO
- Focus Zone shows TODAY's priorities
- Stuck deals highlighted in red
- One-click actions on every deal

### 2. **Activity + Results Tracking**
- Measures leading indicators (calls, emails)
- Measures results (deals, revenue)
- Reps see: "If I make 50 calls, I'll get X discoveries"

### 3. **Real-Time Feedback**
- Instant updates when logging activities
- Visual feedback (✓ Logged! green toast)
- Progress bars update immediately
- See impact of each action

### 4. **Healthy Competition**
- Team leaderboard with medals
- Point system rewards both effort and results
- "Gap to #1" creates urgency
- Transparent - everyone sees everyone

### 5. **Smart Automation**
- Auto-generates action items from deals
- Calculates days in stage
- Identifies stalled deals
- Creates weekly scorecards automatically

---

## 🚀 Next Steps (Future Enhancements)

### Phase 3 Ideas:
1. **Show Rate %** - Discovery completed / Discovery scheduled
2. **Deal velocity chart** - Avg days from qualified → live
3. **Win rate tracking** - Closed-won / total closed
4. **Email templates** - One-click send pre-written emails
5. **Call scripts** - Pop-up with talking points per stage
6. **Mobile app** - Log activities on the go
7. **Notifications** - Alert when deal stuck >7 days
8. **Deal notes** - Add notes to deals
9. **File attachments** - Attach proposals to deals
10. **Revenue forecasting** - Predict monthly revenue

---

## 📞 Support

**For reps:**
- Can't log activity? Check internet connection
- Don't see your deals? Refresh the page
- Scorecard not updating? Wait 2-3 seconds, it auto-refreshes

**For admins:**
- Set realistic weekly targets based on your sales cycle
- Monitor team performance weekly
- Adjust point values if needed (in code: sales-dashboard.html line 765-771)

---

**Built with ❤️ for Drive Lead Media**

*Last updated: October 2025*
