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
    // Send individual emails to each recipient to ensure "To" field is correct
    // and privacy is maintained (no exposed recipient list)
    const emailPromises = recipients.map((recipient) =>
      resend.emails.send({
        from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
        to: recipient,
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
              <p style="margin: 0;">© ${new Date().getFullYear()} Niena Labs. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is an automated announcement.</p>
            </div>
          </div>
        </div>
      `,
      })
    );

    const results = await Promise.all(emailPromises);

    // Check for errors in results if needed, but for now we return success if the batch process completes
    const failedCount = results.filter((r) => r.error).length;
    if (failedCount > 0) {
      console.warn(`⚠️ ${failedCount} emails failed to send out of ${recipients.length}`);
    }

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
      html: `
        <div style="background-color: #f6f9fc; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img
                src="${EMAIL_LOGO_URL}"
                alt="Niena Labs"
                style="height: 160px; width: auto;"
              />
            </div>
            
            <!-- Card -->
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
              <!-- Header -->
              <div style="padding: 40px 40px 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Congratulations! 🎉</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px;">
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  Hi ${recipientName},
                </p>
                
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  Great news! Your application to become a recruiter on Niena Labs has been <strong style="color: #10b981;">approved</strong>.
                </p>
                
                <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  You can now:
                </p>
                
                <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                  <li>Post job openings</li>
                  <li>Manage candidates</li>
                  <li>Access recruiter dashboard</li>
                  <li>Review applications</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nienalabs.com'}/recruiters" 
                     style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Go to Recruiter Dashboard
                  </a>
                </div>
                
                <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                  If you have any questions, feel free to reach out to our support team.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #8898aa; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Niena Labs. All rights reserved.</p>
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
      html: `
        <div style="background-color: #f6f9fc; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img
                src="${EMAIL_LOGO_URL}"
                alt="Niena Labs"
                style="height: 160px; width: auto;"
              />
            </div>
            
            <!-- Card -->
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
              <!-- Header -->
              <div style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #f0f0f0;">
                <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: 600;">Recruiter Application Update</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px;">
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  Hi ${recipientName},
                </p>
                
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  Thank you for your interest in becoming a recruiter on Niena Labs.
                </p>
                
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  After careful review, we regret to inform you that we are unable to approve your application at this time.
                </p>
                
                <!-- Reason Box -->
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">Reason:</p>
                  <p style="margin: 10px 0 0 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">${reason}</p>
                </div>
                
                <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                  If you have any questions or would like to discuss this decision, please don't hesitate to contact our support team at <a href="mailto:support@nienalabs.com" style="color: #667eea; text-decoration: none;">support@nienalabs.com</a>.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #8898aa; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Niena Labs. All rights reserved.</p>
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
      html: `
        <div style="background-color: #f6f9fc; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img
                src="${EMAIL_LOGO_URL}"
                alt="Niena Labs"
                style="height: 160px; width: auto;"
              />
            </div>
            
            <!-- Card -->
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
              <!-- Header -->
              <div style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #f0f0f0;">
                <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: 600;">Application Received</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px;">
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  Hi ${recipientName},
                </p>
                
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  Thanks for applying to become a recruiter on Niena Labs!
                </p>
                
                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                  We have received your application and our team is currently reviewing it. We will get back to you shortly with an update.
                </p>
                
                <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                  If you have any questions in the meantime, please feel free to contact us.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #8898aa; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Niena Labs. All rights reserved.</p>
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
    console.error('Failed to send recruiter application received email:', error);
    return { success: false, error };
  }
}
