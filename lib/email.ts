import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            ${title}
          </h1>
          <div style="margin-top: 20px; line-height: 1.6; color: #555;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
            <p>This is an automated announcement from Job AI Admin.</p>
          </footer>
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
            subject: 'Test Email - Job AI Admin',
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
