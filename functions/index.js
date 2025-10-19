const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
admin.initializeApp();

const db = admin.firestore();

/**
 * Get email transporter with credentials from config
 */
function getMailTransport() {
  const gmailEmail = functions.config().gmail?.email || 'nicolas@driveleadmedia.com';
  const gmailPassword = functions.config().gmail?.password || '';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailPassword
    }
  });
}

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

/**
 * Cloud Function to send email notification when website quote is completed
 * Triggered when a website quote status changes to 'completed'
 */
exports.sendWebsiteQuoteEmail = functions.firestore
  .document('websiteQuotes/{quoteId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const quoteId = context.params.quoteId;

    // Only trigger when status changes to 'completed'
    if (before.status === 'completed' || after.status !== 'completed') {
      return null;
    }

    try {
      const businessName = after.businessName || 'Unknown Business';
      const ownerName = after.ownerName || 'Not provided';
      const email = after.email || 'Not provided';
      const phone = after.phone || 'Not provided';
      const budgetRange = after.budgetRange || 'Not specified';
      const businessType = after.businessType || 'Not specified';
      const locations = after.locations || 'Not specified';

      // Check update needs and recommend CMS if appropriate
      const updateFrequency = after.updateFrequency || '';
      const wantToUpdate = after.wantToUpdate || [];
      const whoUpdates = after.whoUpdates || '';

      let cmsRecommendation = '';
      const needsCMS = (
        updateFrequency && (updateFrequency.toLowerCase().includes('weekly') || updateFrequency.toLowerCase().includes('daily')) ||
        wantToUpdate.length > 2 ||
        whoUpdates.toLowerCase().includes('myself') || whoUpdates.toLowerCase().includes('our team')
      );

      if (needsCMS) {
        cmsRecommendation = `
          <div class="info-box" style="background: #FEF3C7; border-left: 4px solid #F59E0B;">
            <p style="margin: 0;"><strong>💡 CMS Recommendation:</strong></p>
            <p style="margin: 10px 0 0 0;">Based on their update needs (<strong>${updateFrequency || 'frequent updates'}</strong>), consider proposing a CMS solution (WordPress, Webflow, etc.) so they can manage content updates themselves.</p>
          </div>
        `;
      }

      // Format reference websites
      let referenceWebsitesHtml = 'None provided';
      if (after.referenceWebsites && Array.isArray(after.referenceWebsites) && after.referenceWebsites.length > 0) {
        referenceWebsitesHtml = after.referenceWebsites.map(url => `<li><a href="${url}">${url}</a></li>`).join('');
        referenceWebsitesHtml = `<ul>${referenceWebsitesHtml}</ul>`;
      }

      const mailOptions = {
        from: '"Drive Lead Media Portal" <nicolas@driveleadmedia.com>',
        to: 'nicolas@driveleadmedia.com',
        subject: `🎯 New Website Discovery Form Submitted - ${businessName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #012E40 0%, #05908C 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; border-left: 4px solid #05908C; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .label { font-weight: bold; color: #012E40; }
              .button { display: inline-block; background: linear-gradient(135deg, #05908C 0%, #47a5a3 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎯 New Website Discovery Form</h1>
                <p style="margin: 10px 0 0 0;">A potential client has completed the form!</p>
              </div>

              <div class="content">
                <div class="info-box">
                  <p><span class="label">Business Name:</span> ${businessName}</p>
                  <p><span class="label">Owner Name:</span> ${ownerName}</p>
                  <p><span class="label">Email:</span> <a href="mailto:${email}">${email}</a></p>
                  <p><span class="label">Phone:</span> ${phone}</p>
                </div>

                <div class="info-box">
                  <p><span class="label">Business Type:</span> ${businessType}</p>
                  <p><span class="label">Locations:</span> ${locations}</p>
                  <p><span class="label">Budget Range:</span> ${budgetRange}</p>
                </div>

                <div class="info-box">
                  <p><span class="label">Reference Websites:</span></p>
                  ${referenceWebsitesHtml}
                </div>

                ${cmsRecommendation}

                <div style="text-align: center;">
                  <a href="https://portal.driveleadmedia.com/admin.html?tab=website-forms" class="button">
                    View Full Details in Admin Dashboard
                  </a>
                </div>

                <div class="footer">
                  <p>Quote ID: ${quoteId}</p>
                  <p>Submitted: ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };

      // Get mail transport and send
      const transporter = getMailTransport();
      await transporter.sendMail(mailOptions);
      console.log(`✓ Email sent to nicolas@driveleadmedia.com for quote ${quoteId}`);

      return null;
    } catch (error) {
      console.error('Error sending email:', error);
      return null;
    }
  });

/**
 * Cloud Function to send email notification when creatives are ready for approval
 * Triggered when step5Complete changes to true (unlocks Step 6 - Creative Approval)
 */
exports.sendCreativeReadyEmail = functions.firestore
  .document('clients/{clientId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const clientId = context.params.clientId;

    // Only trigger when step5Complete changes from false to true
    if (before.step5Complete === true || after.step5Complete !== true) {
      return null;
    }

    // Check if client has an email address
    if (!after.email) {
      console.log(`No email address for client ${clientId}, skipping notification`);
      return null;
    }

    try {
      const clientName = after.clientName || 'Valued Client';
      const clientEmail = after.email;

      // Generate portal URL
      const portalUrl = `https://portal.driveleadmedia.com/index-contract.html?id=${clientId}`;

      const mailOptions = {
        from: '"Drive Lead Media" <nicolas@driveleadmedia.com>',
        to: clientEmail,
        subject: `🎨 Your Ad Creatives Are Ready for Review!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #012E40 0%, #05908C 100%); color: white; padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; border-left: 4px solid #05908C; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .button { display: inline-block; background: linear-gradient(135deg, #F2A922 0%, #85C7B3 100%); color: #012E40; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; font-size: 1.1rem; }
              .button:hover { transform: translateY(-2px); }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.9rem; padding: 20px; border-top: 1px solid #e5e7eb; }
              h1 { margin: 0; font-size: 2rem; }
              h2 { color: #012E40; margin-top: 0; }
              p { margin: 10px 0; }
              ul { margin: 10px 0; padding-left: 20px; }
              li { margin: 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎨 Creatives Ready!</h1>
                <p style="margin: 15px 0 0 0; font-size: 1.1rem;">Your ad campaign is one step closer to going live</p>
              </div>

              <div class="content">
                <h2>Hi ${clientName},</h2>

                <p>Great news! Our creative team has finished designing your ad creatives, and they're ready for your review and approval.</p>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #05908C;">📋 What's Next:</h3>
                  <ul style="color: #012E40;">
                    <li><strong>Review Your Creatives:</strong> Check out the ad designs we've created for your campaign</li>
                    <li><strong>Provide Feedback:</strong> Let us know if you'd like any changes or adjustments</li>
                    <li><strong>Approve to Launch:</strong> Once approved, we'll launch your campaign!</li>
                  </ul>
                </div>

                <p>Please click the button below to access your portal and review the creatives:</p>

                <div style="text-align: center;">
                  <a href="${portalUrl}" class="button">
                    Review Creatives Now
                  </a>
                </div>

                <div class="info-box" style="background: #E8F5F3; border-left-color: #05908C; margin-top: 30px;">
                  <p style="margin: 0; color: #012E40;">
                    <strong>💡 Tip:</strong> The faster you review and approve, the sooner we can launch your campaign and start driving results!
                  </p>
                </div>

                <p style="margin-top: 30px;">If you have any questions or need assistance, don't hesitate to reach out.</p>

                <p style="margin-top: 20px;">Looking forward to your feedback!</p>

                <p style="margin-top: 20px;">
                  <strong>Best regards,</strong><br>
                  The Drive Lead Media Team
                </p>

                <div class="footer">
                  <p><strong>Drive Lead Media</strong></p>
                  <p>📧 nicolas@driveleadmedia.com</p>
                  <p style="margin-top: 15px; font-size: 0.85rem; color: #9ca3af;">
                    You're receiving this email because your onboarding portal has been updated.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };

      // Get mail transport and send
      const transporter = getMailTransport();
      await transporter.sendMail(mailOptions);
      console.log(`✓ Creative ready email sent to ${clientEmail} for client ${clientId}`);

      return null;
    } catch (error) {
      console.error('Error sending creative ready email:', error);
      return null;
    }
  });
