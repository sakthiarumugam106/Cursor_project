const twilio = require('twilio');
require('dotenv').config();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Support either TWILIO_WHATSAPP_FROM or TWILIO_PHONE_NUMBER for backward compatibility
const rawFromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER || '';

// Ensure the from number is prefixed with "whatsapp:" as required by Twilio's WhatsApp API
const twilioPhoneNumber = rawFromNumber.startsWith('whatsapp:') ? rawFromNumber : (rawFromNumber ? `whatsapp:${rawFromNumber}` : undefined);

/**
 * Send WhatsApp message using Twilio
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} message - Message content
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Twilio message object
 */
const sendWhatsAppMessage = async (to, message, options = {}) => {
  try {
    // Check if WhatsApp service is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('WhatsApp service not configured - skipping message');
      return null;
    }

    // Format phone number for WhatsApp
    let formattedPhone = to;
    if (!to.startsWith('whatsapp:')) {
      formattedPhone = `whatsapp:${to}`;
    }

    // Prepare message payload
    // If contentSid is provided, prefer Content API (templated message)
    const { contentSid, contentVariables, ...restOptions } = options || {};

    const messagePayload = contentSid
      ? {
          from: twilioPhoneNumber,
          to: formattedPhone,
          contentSid,
          // contentVariables must be a JSON string per Twilio API
          ...(contentVariables ? { contentVariables: typeof contentVariables === 'string' ? contentVariables : JSON.stringify(contentVariables) } : {}),
          ...restOptions
        }
      : {
          from: twilioPhoneNumber,
          to: formattedPhone,
          body: message,
          ...restOptions
        };

    // Send message
    const result = await twilioClient.messages.create(messagePayload);
    
    console.log(`WhatsApp message sent successfully to ${to}:`, result.sid);
    return result;
  } catch (error) {
    console.error('WhatsApp message failed:', error);
    throw error;
  }
};

/**
 * Send session invitation via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @param {object} tutor - Tutor details
 * @returns {Promise<object>} - Message result
 */
const sendSessionInvitation = async (phone, session, student, tutor) => {
  const message = `🎓 Session Invitation\n\nHi ${student.firstName},\n\nYou have been invited to a new session:\n\n📚 Topic: ${session.topic}\n👨‍🏫 Tutor: ${tutor.firstName} ${tutor.lastName}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n⏱️ Duration: ${session.duration} minutes\n\nPlease confirm your attendance.\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send session reminder via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Message result
 */
const sendSessionReminder = async (phone, session, student) => {
  const message = `⏰ Session Reminder\n\nHi ${student.firstName},\n\nThis is a reminder for your upcoming session:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n⏱️ Duration: ${session.duration} minutes\n\nPlease be on time!\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send payment reminder via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} payment - Payment details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Message result
 */
const sendPaymentReminder = async (phone, payment, student) => {
  const message = `💰 Payment Reminder\n\nHi ${student.firstName},\n\nThis is a friendly reminder about your pending payment:\n\n📋 Invoice: ${payment.invoiceNumber}\n💵 Amount: ${payment.currency} ${payment.amount}\n📅 Due Date: ${new Date(payment.dueDate).toLocaleDateString()}\n\nPlease complete your payment to avoid any service interruptions.\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send overdue payment alert via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} payment - Payment details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Message result
 */
const sendOverduePaymentAlert = async (phone, payment, student) => {
  const daysOverdue = payment.getDaysOverdue();
  const message = `⚠️ Payment Overdue\n\nHi ${student.firstName},\n\nYour payment is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}:\n\n📋 Invoice: ${payment.invoiceNumber}\n💵 Amount: ${payment.currency} ${payment.amount}\n📅 Due Date: ${new Date(payment.dueDate).toLocaleDateString()}\n\nPlease complete your payment immediately to restore access to services.\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send attendance confirmation via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} attendance - Attendance details
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Message result
 */
const sendAttendanceConfirmation = async (phone, attendance, session, student) => {
  const statusEmoji = {
    present: '✅',
    absent: '❌',
    late: '⏰',
    excused: '📝'
  };

  const message = `${statusEmoji[attendance.status]} Attendance Confirmed\n\nHi ${student.firstName},\n\nYour attendance has been recorded for:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n📊 Status: ${attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}\n\nThank you for attending!\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send general announcement via WhatsApp
 * @param {string} phone - Recipient phone number
 * @param {string} announcement - Announcement content
 * @param {string} recipientName - Recipient name
 * @returns {Promise<object>} - Message result
 */
const sendAnnouncement = async (phone, announcement, recipientName) => {
  const message = `📢 Announcement\n\nHi ${recipientName},\n\n${announcement}\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send bulk WhatsApp messages
 * @param {Array} recipients - Array of recipient objects with phone and name
 * @param {string} message - Message content
 * @param {object} options - Additional options
 * @returns {Promise<Array>} - Array of message results
 */
const sendBulkWhatsAppMessages = async (recipients, message, options = {}) => {
  try {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const personalizedMessage = message.replace('{name}', recipient.name);
        const result = await sendWhatsAppMessage(recipient.phone, personalizedMessage, options);
        results.push({ success: true, recipient, result });
      } catch (error) {
        console.error(`Failed to send message to ${recipient.phone}:`, error);
        results.push({ success: false, recipient, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Bulk WhatsApp messages failed:', error);
    throw error;
  }
};

/**
 * Send session cancellation notice via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>} - Message result
 */
const sendSessionCancellation = async (phone, session, student, reason = '') => {
  const message = `❌ Session Cancelled\n\nHi ${student.firstName},\n\nYour session has been cancelled:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n⏰ Time: ${new Date(session.startTime).toLocaleTimeString()}\n\n${reason ? `Reason: ${reason}\n\n` : ''}We apologize for any inconvenience. A new session will be scheduled soon.\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send session rescheduling notice via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} oldSession - Old session details
 * @param {object} newSession - New session details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Message result
 */
const sendSessionRescheduling = async (phone, oldSession, newSession, student) => {
  const message = `🔄 Session Rescheduled\n\nHi ${student.firstName},\n\nYour session has been rescheduled:\n\n📚 Topic: ${oldSession.topic}\n\n📅 Old Date: ${new Date(oldSession.startTime).toLocaleDateString()}\n⏰ Old Time: ${new Date(oldSession.startTime).toLocaleTimeString()}\n\n📅 New Date: ${new Date(newSession.startTime).toLocaleDateString()}\n⏰ New Time: ${new Date(newSession.startTime).toLocaleTimeString()}\n\nPlease update your calendar accordingly.\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

/**
 * Send feedback request via WhatsApp
 * @param {string} phone - Student phone number
 * @param {object} session - Session details
 * @param {object} student - Student details
 * @returns {Promise<object>} - Message result
 */
const sendFeedbackRequest = async (phone, session, student) => {
  const message = `📝 Feedback Request\n\nHi ${student.firstName},\n\nWe hope you enjoyed your recent session:\n\n📚 Topic: ${session.topic}\n📅 Date: ${new Date(session.startTime).toLocaleDateString()}\n\nPlease take a moment to share your feedback. Your input helps us improve our services.\n\nBest regards,\nEducation Management Team`;

  return await sendWhatsAppMessage(phone, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendSessionInvitation,
  sendSessionReminder,
  sendPaymentReminder,
  sendOverduePaymentAlert,
  sendAttendanceConfirmation,
  sendAnnouncement,
  sendBulkWhatsAppMessages,
  sendSessionCancellation,
  sendSessionRescheduling,
  sendFeedbackRequest
};