import { Resend } from 'resend';
import fs from 'fs';

const DEBUG_LOG_PATH = 'c:/Users/adoma/OneDrive/Documents/Niena/Niena/email_debug.log';
function logEmailToFile(msg: string) {
  fs.appendFileSync(DEBUG_LOG_PATH, `[EMAIL_LIB][${new Date().toISOString()}] ${msg}\n`);
}

// Initialize Resend client
// Use a dummy key if not present to prevent crash on import. Specific functions check for the key before sending.
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

const EMAIL_LOGO_URL = 'https://res.cloudinary.com/dia6kjefj/image/upload/v1765656744/logo_jb7deb.png';

/**
 * Universal layout for all Niena emails to ensure brand consistency.
 */
function NienaEmailLayout({
  title,
  recipientName,
  content,
  buttonText,
  buttonUrl,
  footerNote = "This is an automated notification. Please do not reply directly to this email."
}: {
  title: string;
  recipientName?: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerNote?: string;
}) {
  const currentYear = new Date().getFullYear();
  const greeting = recipientName ? `<p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">Hi ${recipientName},</p>` : '';
  const button = buttonText && buttonUrl ? `
    <div style="text-align: center; margin-top: 35px;">
      <a href="${buttonUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06);">
        ${buttonText}
      </a>
    </div>` : '';

  return `
    <div style="background-color: #f8fafc; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          <img
            src="${EMAIL_LOGO_URL}"
            alt="Niena Labs"
            style="height: 60px; width: auto;"
          />
        </div>
        
        <!-- Card -->
        <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #f1f5f9;">
          <!-- Header -->
          <div style="padding: 40px 40px 0 40px;">
            <h2 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700; line-height: 1.3;">
              ${title}
            </h2>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 40px 40px 40px;">
            ${greeting}
            <div style="color: #475569; font-size: 16px; line-height: 1.7;">
              ${content}
            </div>
            ${button}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0;">© ${currentYear} Niena Labs. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;">${footerNote}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Send an email announcement to all users
 */
export async function sendAnnouncementEmail(
  title: string,
  content: string,
  recipients: string[]
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error('Email configuration missing');
  }

  try {
    const emailPromises = recipients.map((recipient) =>
      resend.emails.send({
        from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
        to: recipient,
        subject: title,
        html: NienaEmailLayout({
          title,
          content: content.replace(/\n/g, '<br>'),
          footerNote: "You received this email because you're a member of Niena Labs."
        })
      })
    );

    const results = await Promise.all(emailPromises);
    const failedCount = results.filter((r) => r.error).length;

    return { success: true, count: recipients.length - failedCount };
  } catch (error) {
    console.error('Failed to send announcement email:', error);
    throw error;
  }
}

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(to: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject: 'Niena Test Email',
      html: NienaEmailLayout({
        title: "Test Configuration",
        recipientName: "Test User",
        content: "This is a successful test of your Niena email configuration. Your server is correctly sending professional branded emails.",
        buttonText: "Visit Dashboard",
        buttonUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.nienalabs.com'
      })
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send a support ticket reply email to a user
 */
export async function sendSupportReplyEmail(
  recipientEmail: string,
  recipientName: string,
  ticketSubject: string,
  replyMessage: string,
  ticketId: string
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("⚠️ Email service not configured, skipping support email");
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Niena Support <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `Re: ${ticketSubject} - Niena Support`,
      html: NienaEmailLayout({
        title: "Support Ticket Update",
        recipientName,
        content: `
          <div style="margin-bottom: 20px;">An admin has replied to your support ticket:</div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e293b; line-height: 1.7; font-size: 15px;">
              ${replyMessage.replace(/\n/g, '<br>')}
            </p>
          </div>
          <div style="color: #64748b; font-size: 13px; font-weight: 600; margin-top: 10px;">Subject: ${ticketSubject}</div>
        `,
        buttonText: "View Support Dashboard",
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nienalabs.com'}/support`,
        footerNote: `Ticket ID: ${ticketId}. This is an automated notification from Niena Support.`
      })
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send support reply email:', error);
    return { success: false, error };
  }
}

/**
 * Send recruiter application approval email
 * @param recipientEmail - Email address of the applicant
 * @param recipientName - Name of the applicant
 */
export async function sendRecruiterApprovalEmail(
  recipientEmail: string,
  recipientName: string
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Email configuration missing');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: '🎉 Your Recruiter Application Has Been Approved!',
      html: NienaEmailLayout({
        title: "Congratulations! 🎉",
        recipientName,
        content: `
          <p style="margin-bottom: 20px;">Great news! Your application to become a recruiter on Niena has been <strong style="color: #10b981;">approved</strong>.</p>
          <p style="margin-bottom: 20px;">You can now:</p>
          <ul style="padding-left: 20px; margin-bottom: 20px;">
            <li>Post job openings</li>
            <li>Manage candidates</li>
            <li>Access recruiter dashboard</li>
            <li>Review applications</li>
          </ul>
        `,
        buttonText: "Go to Recruiter Dashboard",
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nienalabs.com'}/recruiters`,
        footerNote: "Welcome to the Niena recruiter community!"
      })
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send recruiter approval email:', error);
    return { success: false, error };
  }
}

/**
 * Send recruiter application rejection email
 * @param recipientEmail - Email address of the applicant
 * @param recipientName - Name of the applicant
 * @param reason - Reason for rejection
 */
export async function sendRecruiterRejectionEmail(
  recipientEmail: string,
  recipientName: string,
  reason: string
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Email configuration missing');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: 'Update on Your Recruiter Application',
      html: NienaEmailLayout({
        title: "Recruiter Application Update",
        recipientName,
        content: `
          <p style="margin-bottom: 20px;">Thank you for your interest in becoming a recruiter on Niena.</p>
          <p style="margin-bottom: 20px;">After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 700;">Reason:</p>
            <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">${reason}</p>
          </div>
          <p style="margin-top: 20px;">If you have any questions, please contact our support team at <a href="mailto:support@nienalabs.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">support@nienalabs.com</a>.</p>
        `,
        footerNote: "The Niena Admin Team"
      })
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send recruiter rejection email:', error);
    return { success: false, error };
  }
}

/**
 * Send recruiter application received email
   * @param recipientEmail - Email address of the applicant
   * @param recipientName - Name of the applicant
   */
export async function sendRecruiterApplicationReceivedEmail(
  recipientEmail: string,
  recipientName: string
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Email configuration missing');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: 'We Received Your Recruiter Application',
      html: NienaEmailLayout({
        title: "Application Received",
        recipientName,
        content: `
          <p style="margin-bottom: 20px;">Thanks for applying to become a recruiter on Niena!</p>
          <p style="margin-bottom: 20px;">We have received your application and our team is currently reviewing it. We will get back to you shortly with an update.</p>
          <p>If you have any questions in the meantime, please feel free to reach out.</p>
        `,
        footerNote: "The Niena Admin Team"
      })
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send recruiter application received email:', error);
    return { success: false, error };
  }
}

/**
 * Send account suspended email
 * @param recipientEmail - Email address of the user
 * @param recipientName - Name of the user
 */
export async function sendAccountSuspendedEmail(
  recipientEmail: string,
  recipientName: string
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Email configuration missing');
    return { success: false, error: 'Email not configured' };
  }

  try {
    logEmailToFile(`Starting resend.emails.send for suspension to ${recipientEmail}`);
    const { data, error } = await resend.emails.send({
      from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: 'Niena Account Notification',
      html: NienaEmailLayout({
        title: "Account Status Update",
        recipientName,
        content: `
          <p style="margin-bottom: 20px; font-weight: 600;">We're writing to let you know that your account on Niena has been suspended.</p>
          <p style="margin-bottom: 20px;">This may be due to a violation of our terms of service or detected unusual activity. For your security, access to our services had been temporarily restricted.</p>
          <p style="margin-bottom: 20px;">While suspended, you will not be able to log in or access your data. We apologize for any inconvenience this may cause.</p>
          <p>If you have any questions or believe this is a mistake, please reach out to our team at <a href="mailto:support@nienalabs.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">support@nienalabs.com</a>.</p>
        `,
        footerNote: "Safe Environment Notification from Niena Labs"
      })
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send account suspended email:', error);
    return { success: false, error };
  }
}

/**
 * Send account reactivated email
 * @param recipientEmail - Email address of the user
 * @param recipientName - Name of the user
 */
export async function sendAccountReactivatedEmail(
  recipientEmail: string,
  recipientName: string
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Email configuration missing');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: 'Your Account Has Been Reactivated',
      html: NienaEmailLayout({
        title: "Account Reactivated",
        recipientName,
        content: `
          <p style="margin-bottom: 20px;">We are pleased to inform you that your account on Niena has been reactivated.</p>
          <p style="margin-bottom: 20px;">You may now log in and use all services as usual. Thank you for your patience.</p>
        `,
        buttonText: "Log In Now",
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nienalabs.com'}/auth/sign-in`
      })
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send account reactivated email:', error);
    return { success: false, error };
  }
}

/**
 * Send job application status update email to a candidate
 * @param recipientEmail - Candidate's email
 * @param candidateName - Candidate's name
 * @param jobTitle - Title of the job they applied for
 * @param newStatus - The new status of their application
 */
export async function sendCandidateStatusUpdateEmail(
  recipientEmail: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("⚠️ Email service not configured, skipping status update email");
    return { success: false, error: 'Email service not configured' };
  }

  const statusLabels: Record<string, string> = {
    'NEW': 'Received',
    'REVIEWING': 'Under Review',
    'SHORTLISTED': 'Shortlisted',
    'INTERVIEWED': 'Interview Conducted',
    'OFFERED': 'Job Offer Extended',
    'REJECTED': 'Application Rejected',
    'HIRED': 'Hired'
  };

  const friendlyStatus = statusLabels[newStatus] || newStatus;

  let statusMessage = `Your application for the position of <strong>${jobTitle}</strong> has been updated to: <strong>${friendlyStatus}</strong>.`;

  if (newStatus === 'SHORTLISTED') {
    statusMessage = `Great news! You've been <strong>shortlisted</strong> for the <strong>${jobTitle}</strong> position. We really enjoyed reviewing your background, and our team will be in touch shortly regarding the next steps.`;
  } else if (newStatus === 'OFFERED') {
    statusMessage = `Congratulations! We are thrilled to extend a <strong>job offer</strong> to you for the <strong>${jobTitle}</strong> position. We believe you'd be a fantastic addition to the team. Please check your dashboard to review the details!`;
  } else if (newStatus === 'REJECTED') {
    statusMessage = `Thank you so much for the time you've invested in applying for the <strong>${jobTitle}</strong> role. After a careful review of all applications, we've decided to move forward with other candidates at this time. We truly appreciate your interest in Niena and wish you the very best in your search!`;
  } else if (newStatus === 'REVIEWING') {
    statusMessage = `We wanted to let you know that we're currently <strong>reviewing</strong> your application for <strong>${jobTitle}</strong>. We appreciate your patience as we carefully consider your background and experience.`;
  } else if (newStatus === 'INTERVIEWED') {
    statusMessage = `Thank you for taking the time to connect with us regarding the <strong>${jobTitle}</strong> position. It was a pleasure learning more about you. We are currently reflecting on our conversations and will be in touch with an update soon!`;
  } else if (newStatus === 'HIRED') {
    statusMessage = `Welcome to the team! We are so excited to have you join us as our newest <strong>${jobTitle}</strong>. We're looking forward to all the great things we'll achieve together!`;
  } else if (newStatus === 'NEW') {
    statusMessage = `Thank you for choosing to apply for the <strong>${jobTitle}</strong> position! We've successfully received your application and will be in touch once we've had a chance to review it.`;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Niena Recruitment <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `Application Update: ${jobTitle}`,
      html: NienaEmailLayout({
        title: "Application Status Update",
        recipientName: candidateName,
        content: `
          <p style="margin-bottom: 10px; color: #6366f1; font-weight: 600; font-size: 18px;">${jobTitle}</p>
          <p style="margin-bottom: 20px;">${statusMessage}</p>
        `,
        buttonText: "View Application Status",
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nienalabs.com'}/dashboard`,
        footerNote: "You received this because of your job application on Niena."
      })
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send status update email:', error);
    return { success: false, error };
  }
}
