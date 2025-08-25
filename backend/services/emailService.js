const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
let transporter;

// Initialize email transporter
const initializeTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Email result
 */
const sendEmail = async (to, subject, text, html = null, options = {}) => {
  try {
    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email service not configured - skipping email');
      return null;
    }

    const emailTransporter = initializeTransporter();

    // Prepare email payload
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text,
      ...options
    };

    // Send email
    const result = await emailTransporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${to}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

/**
 * Send session invitation email
 * @param {string} email - Student email
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @param {object} tutor - Tutor details
 * @returns {Promise<object>} - Email result
 */
const sendSessionInvitationEmail = async (email, session, student, tutor) => {
  const subject = '🎓 New Session Invitation';
  const text = `Hi ${student.firstName},\n\nYou have been invited to a new session:\n\n📚 Topic: ${session.topic}\n👨‍🏫 Tutor: ${tutor.firstName} ${tutor.lastName}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n⏱️ Duration: ${session.duration} minutes\n\nPlease confirm your attendance.\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">🎓 New Session Invitation</h2>
      <p>Hi ${student.firstName},</p>
      <p>You have been invited to a new session:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📚 Topic:</strong> ${session.topic}</p>
        <p><strong>👨‍🏫 Tutor:</strong> ${tutor.firstName} ${tutor.lastName}</p>
        <p><strong>📅 Date:</strong> ${new Date(session.startTime).toLocaleDateString()}</p>
        <p><strong>⏰ Time:</strong> ${new Date(session.startTime).toLocaleTimeString()}</p>
        <p><strong>⏱️ Duration:</strong> ${session.duration} minutes</p>
      </div>
      <p>Please confirm your attendance.</p>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

/**
 * Send session reminder email
 * @param {string} email - Student email
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Email result
 */
const sendSessionReminderEmail = async (email, session, student) => {
  const subject = '⏰ Session Reminder';
  const text = `Hi ${student.firstName},\n\nThis is a reminder for your upcoming session:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n⏱️ Duration: ${session.duration} minutes\n\nPlease be on time!\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FF9800;">⏰ Session Reminder</h2>
      <p>Hi ${student.firstName},</p>
      <p>This is a reminder for your upcoming session:</p>
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📚 Topic:</strong> ${session.topic}</p>
        <p><strong>📅 Date:</strong> ${new Date(session.startTime).toLocaleDateString()}</p>
        <p><strong>⏰ Time:</strong> ${new Date(session.startTime).toLocaleTimeString()}</p>
        <p><strong>⏱️ Duration:</strong> ${session.duration} minutes</p>
      </div>
      <p>Please be on time!</p>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

/**
 * Send payment reminder email
 * @param {string} email - Student email
 * @param {object} payment - Payment details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Email result
 */
const sendPaymentReminderEmail = async (email, payment, student) => {
  const subject = '💰 Payment Reminder';
  const text = `Hi ${student.firstName},\n\nThis is a friendly reminder about your pending payment:\n\n📋 Invoice: ${payment.invoiceNumber}\n💵 Amount: ${payment.currency} ${payment.amount}\n📅 Due Date: ${new Date(payment.dueDate).toLocaleDateString()}\n\nPlease complete your payment to avoid any service interruptions.\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">💰 Payment Reminder</h2>
      <p>Hi ${student.firstName},</p>
      <p>This is a friendly reminder about your pending payment:</p>
      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📋 Invoice:</strong> ${payment.invoiceNumber}</p>
        <p><strong>💵 Amount:</strong> ${payment.currency} ${payment.amount}</p>
        <p><strong>📅 Due Date:</strong> ${new Date(payment.dueDate).toLocaleDateString()}</p>
      </div>
      <p>Please complete your payment to avoid any service interruptions.</p>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

/**
 * Send overdue payment alert email
 * @param {string} email - Student email
 * @param {object} payment - Payment details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Email result
 */
const sendOverduePaymentAlertEmail = async (email, payment, student) => {
  const daysOverdue = payment.getDaysOverdue();
  const subject = '⚠️ Payment Overdue';
  const text = `Hi ${student.firstName},\n\nYour payment is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}:\n\n📋 Invoice: ${payment.invoiceNumber}\n💵 Amount: ${payment.currency} ${payment.amount}\n📅 Due Date: ${new Date(payment.dueDate).toLocaleDateString()}\n\nPlease complete your payment immediately to restore access to services.\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f44336;">⚠️ Payment Overdue</h2>
      <p>Hi ${student.firstName},</p>
      <p>Your payment is overdue by <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</strong>:</p>
      <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📋 Invoice:</strong> ${payment.invoiceNumber}</p>
        <p><strong>💵 Amount:</strong> ${payment.currency} ${payment.amount}</p>
        <p><strong>📅 Due Date:</strong> ${new Date(payment.dueDate).toLocaleDateString()}</p>
      </div>
      <p>Please complete your payment immediately to restore access to services.</p>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

/**
 * Send attendance confirmation email
 * @param {string} email - Student email
 * @param {object} attendance - Attendance details
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Email result
 */
const sendAttendanceConfirmationEmail = async (email, attendance, session, student) => {
  const statusEmoji = {
    present: '✅',
    absent: '❌',
    late: '⏰',
    excused: '📝'
  };

  const subject = `${statusEmoji[attendance.status]} Attendance Confirmed`;
  const text = `Hi ${student.firstName},\n\nYour attendance has been recorded for:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n📊 Status: ${attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}\n\nThank you for attending!\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">${statusEmoji[attendance.status]} Attendance Confirmed</h2>
      <p>Hi ${student.firstName},</p>
      <p>Your attendance has been recorded for:</p>
      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📚 Topic:</strong> ${session.topic}</p>
        <p><strong>📅 Date:</strong> ${new Date(session.startTime).toLocaleDateString()}</p>
        <p><strong>⏰ Time:</strong> ${new Date(session.startTime).toLocaleTimeString()}</p>
        <p><strong>📊 Status:</strong> ${attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}</p>
      </div>
      <p>Thank you for attending!</p>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

/**
 * Send general announcement email
 * @param {string} email - Recipient email
 * @param {string} announcement - Announcement content
 * @param {string} recipientName - Recipient name
 * @returns {Promise<object>} - Email result
 */
const sendAnnouncementEmail = async (email, announcement, recipientName) => {
  const subject = '📢 Announcement';
  const text = `Hi ${recipientName},\n\n${announcement}\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">📢 Announcement</h2>
      <p>Hi ${recipientName},</p>
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>${announcement}</p>
      </div>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

/**
 * Send bulk emails
 * @param {Array} recipients - Array of recipient objects with email and name
 * @param {string} subject - Email subject
 * @param {string} message - Message content
 * @param {object} options - Additional options
 * @returns {Promise<Array>} - Array of email results
 */
const sendBulkEmails = async (recipients, subject, message, options = {}) => {
  try {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const personalizedMessage = message.replace('{name}', recipient.name);
        const result = await sendEmail(recipient.email, subject, personalizedMessage, null, options);
        results.push({ success: true, recipient, result });
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        results.push({ success: false, recipient, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Bulk emails failed:', error);
    throw error;
  }
};

/**
 * Send session cancellation email
 * @param {string} email - Student email
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>} - Email result
 */
const sendSessionCancellationEmail = async (email, session, student, reason = '') => {
  const subject = '❌ Session Cancelled';
  const text = `Hi ${student.firstName},\n\nYour session has been cancelled:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n\n${reason ? `Reason: ${reason}\n\n` : ''}We apologize for any inconvenience. A new session will be scheduled soon.\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f44336;">❌ Session Cancelled</h2>
      <p>Hi ${student.firstName},</p>
      <p>Your session has been cancelled:</p>
      <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📚 Topic:</strong> ${session.topic}</p>
        <p><strong>📅 Date:</strong> ${new Date(session.startTime).toLocaleDateString()}</p>
        <p><strong>⏰ Time:</strong> ${new Date(session.startTime).toLocaleTimeString()}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p>We apologize for any inconvenience. A new session will be scheduled soon.</p>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

/**
 * Send feedback request email
 * @param {string} email - Student email
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Email result
 */
const sendFeedbackRequestEmail = async (email, session, student) => {
  const subject = '📝 Feedback Request';
  const text = `Hi ${student.firstName},\n\nWe hope you enjoyed your recent session:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n\nPlease take a moment to share your feedback. Your input helps us improve our services.\n\nBest regards,\nEducation Management Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #9C27B0;">📝 Feedback Request</h2>
      <p>Hi ${student.firstName},</p>
      <p>We hope you enjoyed your recent session:</p>
      <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📚 Topic:</strong> ${session.topic}</p>
        <p><strong>📅 Date:</strong> ${new Date(session.startTime).toLocaleDateString()}</p>
      </div>
      <p>Please take a moment to share your feedback. Your input helps us improve our services.</p>
      <p>Best regards,<br>Education Management Team</p>
    </div>
  `;

  return await sendEmail(email, subject, text, html);
};

module.exports = {
  sendEmail,
  sendSessionInvitationEmail,
  sendSessionReminderEmail,
  sendPaymentReminderEmail,
  sendOverduePaymentAlertEmail,
  sendAttendanceConfirmationEmail,
  sendAnnouncementEmail,
  sendBulkEmails,
  sendSessionCancellationEmail,
  sendFeedbackRequestEmail
};