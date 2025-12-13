import { Resend } from 'resend';

// Initialize Resend client
// Use a dummy key if not present to prevent crash on import. Specific functions check for the key before sending.
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

const EMAIL_LOGO_URL = 'https://res.cloudinary.com/dia6kjefj/image/upload/v1765656744/logo_jb7deb.png';
/**
 * Send an email announcement to all users
 * @param title - Email subject line
 * @param content - Email body content
 * @param recipients - Array of email addresses
 */
export async function sendAnnouncementEmail(
  title: string,
  content: string,
  recipients: string[]
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  try {
    // Send email to all recipients
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipients,
      subject: title,
      html: `
        <div style="background-color: #f6f9fc; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img
                src="${EMAIL_LOGO_URL}"
                alt="Niena Admin"
                style="height: 160px; width: auto;"
              />
            </div>
            
            <!-- Card -->
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
              <!-- Header -->
              <div style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #f0f0f0;">
                <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.3;">
                  ${title}
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 0 40px 40px 40px;">
                <div style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                  ${content.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #8898aa; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Niena. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is an automated announcement.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return { success: true, data };
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
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: 'Test Email - Niena Admin',
      html: '<p>This is a test email. Your email service is configured correctly!</p>',
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
      from: process.env.RESEND_FROM_EMAIL,
      to: recipientEmail,
      subject: `Re: ${ticketSubject} - Niena Support`,

      html: `
        <div style="background-color: #f6f9fc; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img
                src="${EMAIL_LOGO_URL}"
                alt="Niena Support"
                style="height: 120px; width: auto;"
              />
            </div>
            
            <!-- Card -->
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
              <!-- Header -->
              <div style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.3;">
                  Support Ticket Update
                </h2>
                <p style="margin: 10px 0 0 0; color: #007bff; font-weight: 500;">
                  Re: ${ticketSubject}
                </p>
              </div>
              
              <!-- Content -->
              <div style="padding: 30px 40px 40px 40px;">
                <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px;">
                  An admin has replied to your ticket:
                </p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <p style="margin: 0; color: #334155; line-height: 1.6; font-size: 15px;">
                    ${replyMessage.replace(/\n/g, '<br>')}
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support" 
                     style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 16px;">
                    View Support Dashboard
                  </a>
                </div>
              </div>
              
              <!-- Footer Meta -->
              <div style="background-color: #f8f9fa; padding: 15px 40px; border-top: 1px solid #f0f0f0; color: #6c757d; font-size: 12px;">
                <p style="margin: 0;">Ticket ID: <span style="font-family: monospace;">${ticketId}</span></p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #8898aa; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Niena Support. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send support reply email:', error);
    // Don't throw, just log so the admin action doesn't fail
    return { success: false, error };
  }
}
