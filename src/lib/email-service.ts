import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Get email configuration from database
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'global-settings' },
    });

    if (!settings || !settings.smtpPassword) {
      console.error('Email configuration not found or password not set');
      return false;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendProformaEmail(
  proformaNumber: string,
  proformaId: string,
  customerEmail: string,
  customerName: string,
  grandTotal: string,
  appUrl?: string
): Promise<boolean> {
  const baseUrl = (appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const proformaUrl = `${baseUrl}/quote/${proformaId}`;

  // Attempt to fetch company settings for branding
  let companyName = 'ARIB GLOBAL Camera & Cine Wholesale';
  let companyPhone = '+1 (800) 555-CAM';
  let companyEmail = 'sales@growthbridge.com';

  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'global-settings' },
    });
    if (settings) {
      if (settings.tradingName || settings.companyName) {
        companyName = settings.tradingName || settings.companyName;
      }
      if (settings.phone) companyPhone = settings.phone;
      if (settings.smtpFromEmail || settings.email) companyEmail = settings.smtpFromEmail || settings.email;
    }
  } catch (e) {
    console.warn('Could not load company settings for email header:', e);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proforma Invoice ${proformaNumber}</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #334155; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0b0f19; padding: 32px 0 48px; }
        .content-box { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%); padding: 36px 32px; text-align: left; }
        .brand-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
        .header p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; }
        .body { padding: 32px; background-color: #ffffff; }
        .greeting { font-size: 16px; color: #0f172a; font-weight: 600; margin-bottom: 16px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
        .quote-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .quote-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .quote-row:last-child { border-bottom: none; padding-top: 12px; font-weight: 700; font-size: 16px; color: #0284c7; }
        .quote-label { color: #64748b; }
        .quote-val { color: #0f172a; font-weight: 600; text-align: right; }
        .cta-container { text-align: center; margin: 32px 0 24px; }
        .btn-primary { display: inline-block; background-color: #0284c7; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.01em; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); text-align: center; }
        .btn-primary:hover { background: #0369a1; }
        .direct-link { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; }
        .direct-link a { color: #0284c7; text-decoration: underline; }
        .notice { font-size: 12px; line-height: 1.5; color: #64748b; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
        .footer { background-color: #0f172a; padding: 24px 32px; text-align: center; color: #64748b; font-size: 12px; }
        .footer p { margin: 4px 0; }
        .footer a { color: #38bdf8; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="content-box">
          <!-- Header -->
          <div class="header">
            <div class="brand-badge">Official Wholesale Quotation</div>
            <h1>${companyName}</h1>
            <p>Commercial Proforma Invoice #${proformaNumber}</p>
          </div>

          <!-- Body -->
          <div class="body">
            <div class="greeting">Dear ${customerName},</div>
            
            <p class="text">
              Thank you for your business inquiry. Please find attached your requested wholesale Proforma Invoice <strong style="color: #0f172a;">${proformaNumber}</strong> for the amount of <strong style="color: #0284c7;">${grandTotal}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 20px 0; padding: 16px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Document Number:</td>
                <td style="padding: 6px 0; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right; font-family: monospace;">${proformaNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Recipient:</td>
                <td style="padding: 6px 0; color: #0f172a; font-size: 13px; font-weight: 600; text-align: right;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0 0; color: #0f172a; font-size: 14px; font-weight: 700; border-top: 1px solid #e2e8f0;">Quotation Total:</td>
                <td style="padding: 8px 0 0; color: #0284c7; font-size: 16px; font-weight: 800; text-align: right; border-top: 1px solid #e2e8f0;">${grandTotal}</td>
              </tr>
            </table>

            <div class="notice">
              <strong style="color: #166534;">📦 Warehouse Inventory Allocation:</strong><br/>
              Stock has been preliminarily reserved across regional logistics hubs. Kindly review and confirm to proceed with dispatch.
            </div>

            <!-- Action Button -->
            <div class="cta-container">
              <a href="${proformaUrl}" target="_blank" class="btn-primary" style="color: #ffffff !important;">
                📄 View Proforma Invoice
              </a>
            </div>

            <!-- Direct Link Fallback -->
            <div class="direct-link">
              <strong>Direct URL:</strong> If the button above does not work in your email client, copy and paste this link into your browser:<br/>
              <a href="${proformaUrl}" target="_blank">${proformaUrl}</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>Email: ${companyEmail} &bull; Phone: ${companyPhone}</p>
            <p style="margin-top: 12px; color: #475569; font-size: 11px;">
              This is an automated quotation delivery from ${companyName} Wholesale ERP. All pricing quoted in USD ($).
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Proforma Quotation: ${proformaNumber}
--------------------------------------------------
Dear ${customerName},

Please find your wholesale Proforma Invoice ${proformaNumber} for ${grandTotal}.

Equipment is allocated from our regional hubs. Kindly review your deal online:
${proformaUrl}

Quotation Details:
- Proforma Number: ${proformaNumber}
- Total Amount: ${grandTotal}
- Recipient: ${customerName}

View Proforma Invoice directly:
${proformaUrl}

If you have any questions, please contact our wholesale sales department.

--------------------------------------------------
${companyName}
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Proforma Quotation ${proformaNumber} - ${companyName}`,
    html,
    text,
  });
}
