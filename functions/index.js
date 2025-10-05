const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function to set custom claims when a new sales rep is created
 * Triggered when a document is created in /salesReps collection
 */
exports.setRepCustomClaims = functions.firestore
  .document('salesReps/{repId}')
  .onCreate(async (snap, context) => {
    const repData = snap.data();
    const repId = context.params.repId;

    try {
      // Set custom claim based on role
      await admin.auth().setCustomUserClaims(repId, {
        role: repData.role || 'rep',
        repId: repId
      });

      console.log(`Custom claims set for ${repData.name}: role=${repData.role}`);

      return null;
    } catch (error) {
      console.error('Error setting custom claims:', error);
      return null;
    }
  });

/**
 * Cloud Function to update custom claims when rep data changes
 */
exports.updateRepCustomClaims = functions.firestore
  .document('salesReps/{repId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const repId = context.params.repId;

    try {
      // Update custom claim if role changed
      await admin.auth().setCustomUserClaims(repId, {
        role: newData.role || 'rep',
        repId: repId
      });

      console.log(`Custom claims updated for ${newData.name}: role=${newData.role}`);

      return null;
    } catch (error) {
      console.error('Error updating custom claims:', error);
      return null;
    }
  });

/**
 * Cloud Function to auto-increment scorecard when deal stage changes
 * Triggered when a deal document is updated
 */
exports.autoIncrementScorecard = functions.firestore
  .document('deals/{dealId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if stage changed
    if (before.stage === after.stage) {
      return null;
    }

    const assignedTo = after.assignedTo;
    if (!assignedTo) {
      console.log('Deal has no assignedTo, skipping scorecard update');
      return null;
    }

    // Calculate current week ID
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setUTCHours(0, 0, 0, 0);

    const yearStart = new Date(Date.UTC(monday.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((monday - yearStart) / 86400000) + 1) / 7);
    const weekId = `${monday.getUTCFullYear()}-W${weekNumber}`;
    const scorecardId = `${assignedTo}_${weekId}`;

    const scorecardRef = db.collection('scorecard').doc(scorecardId);

    try {
      // Increment appropriate metric based on new stage
      const updates = {
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      switch (after.stage) {
        case 'discovery-scheduled':
          updates.discoveryScheduled = admin.firestore.FieldValue.increment(1);
          break;
        case 'discovery-completed':
          updates.discoveryCompleted = admin.firestore.FieldValue.increment(1);
          break;
        case 'onboarding-portal':
          updates.dealsToOnboarding = admin.firestore.FieldValue.increment(1);
          break;
        case 'campaign-live':
          updates.dealsLive = admin.firestore.FieldValue.increment(1);
          break;
      }

      if (Object.keys(updates).length > 1) { // More than just lastUpdated
        await scorecardRef.set(updates, { merge: true });
        console.log(`Scorecard updated for ${assignedTo}: ${after.stage}`);
      }

      return null;
    } catch (error) {
      console.error('Error updating scorecard:', error);
      return null;
    }
  });

/**
 * Cloud Function to create audit trail when deal changes
 */
exports.createDealAuditTrail = functions.firestore
  .document('deals/{dealId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const dealId = context.params.dealId;

    // Determine what changed
    const changes = {};
    if (before.stage !== after.stage) changes.stage = { from: before.stage, to: after.stage };
    if (before.companyName !== after.companyName) changes.companyName = { from: before.companyName, to: after.companyName };
    if (before.mrr !== after.mrr) changes.mrr = { from: before.mrr, to: after.mrr };
    if (before.assignedTo !== after.assignedTo) changes.assignedTo = { from: before.assignedTo, to: after.assignedTo };

    if (Object.keys(changes).length === 0) {
      return null; // No significant changes
    }

    try {
      await db.collection('dealAudit').add({
        dealId: dealId,
        companyName: after.companyName,
        changes: changes,
        changedBy: after.lastUpdatedBy || 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Audit trail created for deal ${dealId}`);
      return null;
    } catch (error) {
      console.error('Error creating audit trail:', error);
      return null;
    }
  });
