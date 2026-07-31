const nodemailer = require('nodemailer');
const prisma = require('./prismaClient');

/**
 * Email Service Configuration
 * Supports multiple email providers with fallback
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter with configuration
   */
  initializeTransporter() {
    try {
      const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          // Only disable certificate verification in development
          rejectUnauthorized: process.env.NODE_ENV !== 'production'
        }
      };

      // Validate required credentials
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;

      // Verify connection
      this.verifyConnection();

      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Verify email connection
   */
  async verifyConnection() {
    if (!this.isConfigured) return false;

    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Send email with logging and error handling
   */
  async sendEmail({ to, subject, html, type = 'GENERAL', userId = null, shopId = null, metadata = null }) {
    // Create notification log entry
    const notificationLog = await prisma.notificationLog.create({
      data: {
        userId,
        shopId,
        type,
        recipient: to,
        subject,
        body: html,
        status: 'PENDING',
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // If email service is not configured, log and return
    if (!this.isConfigured) {
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Email service not configured'
        }
      });

      console.warn(`⚠️  Email not sent (service not configured): ${subject} to ${to}`);
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"IntelliMart" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Update notification log as sent
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      console.log(`✅ Email sent successfully: ${subject} to ${to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      // Update notification log as failed
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });

      console.error(`❌ Email sending failed: ${subject} to ${to}`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send low stock alert email
   */
  async sendLowStockAlert(userEmail, shopName, lowStockProducts) {
    const subject = `🔔 Low Stock Alert - ${shopName}`;

    const productRows = lowStockProducts.map(product => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${product.name}</td>
        <td style="padding: 12px; text-align: center;">${product.stock} ${product.quantityType}</td>
        <td style="padding: 12px; text-align: center;">${product.reorderLevel} ${product.quantityType}</td>
        <td style="padding: 12px; text-align: center;">
          <span style="background-color: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
            Low Stock
          </span>
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
              🔔 Low Stock Alert
            </h1>
            <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 14px;">
              ${shopName}
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              The following products in <strong>${shopName}</strong> have reached or fallen below their reorder levels. Please restock these items soon to avoid running out of stock.
            </p>

            <!-- Products Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; color: #1f2937; font-weight: 600; font-size: 14px;">Product Name</th>
                  <th style="padding: 12px; text-align: center; color: #1f2937; font-weight: 600; font-size: 14px;">Current Stock</th>
                  <th style="padding: 12px; text-align: center; color: #1f2937; font-weight: 600; font-size: 14px;">Reorder Level</th>
                  <th style="padding: 12px; text-align: center; color: #1f2937; font-weight: 600; font-size: 14px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>

            <!-- Summary -->
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">
                ⚠️ Total Low Stock Items: ${lowStockProducts.length}
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/inventory" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Inventory
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              This is an automated alert from IntelliMart. Please take necessary action to restock these items.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} IntelliMart. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      type: 'LOW_STOCK_ALERT',
      metadata: {
        shopName,
        lowStockCount: lowStockProducts.length,
        products: lowStockProducts.map(p => ({ name: p.name, stock: p.stock }))
      }
    });
  }

  /**
   * Send backup success email
   */
  async sendBackupSuccessEmail(userEmail, backupInfo) {
    const shopName = backupInfo.shopName || 'IntelliMart';
    const subject = `✅ Backup Completed Successfully - ${shopName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
              ✅ Backup Completed
            </h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 14px;">
              ${shopName} - Data is safe and secure
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your ${backupInfo.isAutomatic ? 'automatic weekly' : 'manual'} backup has been completed successfully.
            </p>

            <!-- Backup Details -->
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">Backup Details</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">File Name:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${backupInfo.fileName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">File Size:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${(backupInfo.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Backup Type:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${backupInfo.type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Created At:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${new Date(backupInfo.createdAt).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Backup Mode:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background-color: ${backupInfo.isAutomatic ? '#dbeafe' : '#f3f4f6'}; color: ${backupInfo.isAutomatic ? '#1e40af' : '#374151'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                      ${backupInfo.isAutomatic ? 'Automatic' : 'Manual'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/backup-export" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Backup History
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              ${backupInfo.isAutomatic ? 'This is an automatic weekly backup. Your data is backed up every Sunday at 2:00 AM.' : 'This backup was created manually. You can download it from the Backup & Export page.'}
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} IntelliMart. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      type: 'BACKUP_SUCCESS',
      metadata: backupInfo
    });
  }

  /**
   * Send backup failure email
   */
  async sendBackupFailureEmail(userEmail, errorInfo) {
    const subject = '❌ Backup Failed - IntelliMart';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
              ❌ Backup Failed
            </h1>
            <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 14px;">
              Action required
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your ${errorInfo.isAutomatic ? 'automatic weekly' : 'manual'} backup encountered an error and could not be completed.
            </p>

            <!-- Error Details -->
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">Error Details</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Error Message:</td>
                  <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">${errorInfo.error}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Failed At:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${new Date().toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Backup Type:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${errorInfo.type || 'FULL_DATABASE'}</td>
                </tr>
              </table>
            </div>

            <!-- Recommendations -->
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Recommended Actions:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                <li>Try creating a manual backup from the dashboard</li>
                <li>Check your internet connection</li>
                <li>Ensure sufficient storage space</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/backup-export" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Try Manual Backup
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              If you continue to experience issues, please contact our support team for assistance.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} IntelliMart. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      type: 'BACKUP_FAILURE',
      metadata: errorInfo
    });
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(userEmail, otp) {
    const subject = 'Verify Your Email - IntelliMart';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; padding: 40px 0;">
          <tr>
            <td align="center">
              <!-- Top Logo block -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="vertical-align: middle; padding-right: 8px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: #2563eb; border-radius: 50%; width: 28px; height: 28px;">
                      <tr>
                        <td align="center" valign="middle" style="height: 28px; width: 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; color: #ffffff; line-height: 28px;">il</td>
                      </tr>
                    </table>
                  </td>
                  <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: bold; color: #0f172a; vertical-align: middle; letter-spacing: -0.3px;">
                    IntelliMart
                  </td>
                </tr>
              </table>

              <!-- Main Card Container -->
              <table width="480" border="0" cellpadding="0" cellspacing="0" style="width: 480px; max-width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02); border: 1px solid #eaeaea;">
                <!-- Card Header with gradient -->
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 26px 20px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Email Verification
                    </h1>
                  </td>
                </tr>
                
                <!-- Card Body -->
                <tr>
                  <td style="padding: 40px 35px 35px 35px; text-align: left;">
                    <p style="color: #334155; font-size: 16px; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Hello,
                    </p>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Thank you for registering with IntelliMart. Please use the following OTP to verify your email address:
                    </p>

                    <!-- OTP Code Grid -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto;">
                      <tr>
                        <!-- Digit 1 -->
                        <td align="center" style="width: 48px; height: 56px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 28px; font-weight: bold; color: #1e3a8a; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${otp[0]}</td>
                        <td style="width: 10px;"></td>
                        <!-- Digit 2 -->
                        <td align="center" style="width: 48px; height: 56px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 28px; font-weight: bold; color: #1e3a8a; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${otp[1]}</td>
                        <td style="width: 10px;"></td>
                        <!-- Digit 3 -->
                        <td align="center" style="width: 48px; height: 56px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 28px; font-weight: bold; color: #1e3a8a; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${otp[2]}</td>
                        <td style="width: 10px;"></td>
                        <!-- Digit 4 -->
                        <td align="center" style="width: 48px; height: 56px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 28px; font-weight: bold; color: #1e3a8a; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${otp[3]}</td>
                        <td style="width: 10px;"></td>
                        <!-- Digit 5 -->
                        <td align="center" style="width: 48px; height: 56px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 28px; font-weight: bold; color: #1e3a8a; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${otp[4]}</td>
                        <td style="width: 10px;"></td>
                        <!-- Digit 6 -->
                        <td align="center" style="width: 48px; height: 56px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 28px; font-weight: bold; color: #1e3a8a; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${otp[5]}</td>
                      </tr>
                    </table>

                    <!-- Expiry text -->
                    <p align="center" style="color: #64748b; font-size: 14px; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      This code will expire in <span style="font-weight: 500; color: #475569;">10 minutes</span>
                    </p>

                    <!-- Verify Account button -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 10px auto;">
                      <tr>
                        <td align="center" style="border-radius: 24px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);">
                          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.2px;">
                            Verify Account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice under card -->
              <p align="center" style="color: #64748b; font-size: 13px; margin: 24px 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; padding: 0 20px;">
                If you didn't request this verification, please ignore this email.
              </p>

              <!-- Horizontal divider -->
              <table width="480" border="0" cellpadding="0" cellspacing="0" style="width: 480px; max-width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="border-top: 1px solid #e2e8f0;"></td>
                </tr>
              </table>

              <!-- Copyright Footer -->
              <p align="center" style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                © ${new Date().getFullYear()} IntelliMart. All rights reserved.<br>
                <span style="color: #94a3b8;">This is an automated message. Please do not reply to this email.</span>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      type: 'OTP_VERIFICATION',
      metadata: { otpLength: otp.length }
    });
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeEmail(userEmail, userName, changeDetails = {}, newPassword = null) {
    const subject = '🔐 Password Changed Successfully - IntelliMart';
    const changeTime = new Date().toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 48px;">🔐</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              Password Changed Successfully
            </h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">
              Your account security has been updated
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
              Hello <strong>${userName || 'User'}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              This email confirms that your password for your IntelliMart account was successfully changed.
            </p>

            ${newPassword ? `
            <!-- New Password Alert Box -->
            <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
              <p style="color: #065f46; font-size: 14px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase;">
                Your New Password
              </p>
              <div style="background-color: #ffffff; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px; display: inline-block; margin: 5px 0;">
                <code style="color: #059669; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px;">
                  ${newPassword}
                </code>
              </div>
              <p style="color: #047857; font-size: 12px; margin: 15px 0 0 0;">
                Please keep this password secure and do not share it with anyone.
              </p>
            </div>
            ` : ''}

            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 32px; margin-right: 15px;">✅</span>
                <div>
                  <h3 style="color: #065f46; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                    Password Update Confirmed
                  </h3>
                  <p style="color: #047857; margin: 0; font-size: 14px; line-height: 1.5;">
                    Your password has been securely updated and is now active.
                  </p>
                </div>
              </div>
            </div>

            <!-- Change Details -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                📋 Change Details
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px; width: 40%;">
                    <strong>Account Email:</strong>
                  </td>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 14px; font-weight: 500;">
                    ${userEmail}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
                    <strong>Changed On:</strong>
                  </td>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 14px; font-weight: 500; border-top: 1px solid #e5e7eb;">
                    ${changeTime}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
                    <strong>IP Address:</strong>
                  </td>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 14px; font-weight: 500; border-top: 1px solid #e5e7eb;">
                    ${changeDetails.ipAddress || 'Not available'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
                    <strong>Device:</strong>
                  </td>
                  <td style="padding: 12px 0; color: #1f2937; font-size: 14px; font-weight: 500; border-top: 1px solid #e5e7eb;">
                    ${changeDetails.userAgent || 'Not available'}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Security Alert -->
            <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <div style="display: flex; align-items: flex-start;">
                <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
                <div>
                  <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                    Didn't make this change?
                  </h4>
                  <p style="color: #78350f; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
                    If you did not change your password, your account may be compromised. Please take immediate action:
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                    <li>Reset your password immediately</li>
                    <li>Review your recent account activity</li>
                    <li>Contact our support team</li>
                    <li>Enable two-factor authentication if available</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Security Tips -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
                🛡️ Security Tips
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                <li>Use a strong, unique password for your account</li>
                <li>Never share your password with anyone</li>
                <li>Enable two-factor authentication for extra security</li>
                <li>Regularly update your password every 3-6 months</li>
                <li>Be cautious of phishing emails asking for your credentials</li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 40px 0 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.3s;">
                Sign In to Your Account
              </a>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" 
                 style="display: inline-block; color: #6b7280; text-decoration: none; font-size: 14px; border-bottom: 1px solid #6b7280;">
                Need help? Contact Support
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; text-align: center; font-style: italic;">
              This is an automated security notification. For your protection, we send this email whenever your password is changed.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                IntelliMart
              </h2>
              <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
                Smart Inventory Management System
              </p>
            </div>
            <div style="border-top: 1px solid #374151; padding-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} IntelliMart. All rights reserved.
              </p>
              <p style="color: #6b7280; font-size: 11px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      type: 'PASSWORD_CHANGE',
      metadata: {
        userName,
        changeTime,
        ipAddress: changeDetails.ipAddress,
        userAgent: changeDetails.userAgent
      }
    });
  }

  /**
   * Send daily sales report email
   */
  async sendDailySalesReport(userEmail, reportData) {
    const subject = `📊 Daily Sales Report - ${reportData.shopName}`;
    const dateStr = new Date(reportData.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const billRows = reportData.bills.map(bill => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; text-align: left;">${bill.billNumber}</td>
        <td style="padding: 10px; text-align: left;">${bill.customerName || 'Walk-in'}</td>
        <td style="padding: 10px; text-align: right;">₹${Number(bill.grandTotal).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Daily Sales Report</h1>
            <p style="margin: 5px 0 0;">${reportData.shopName} | ${dateStr}</p>
          </div>
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-around; background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <div style="text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total Sales</p>
                <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #4f46e5;">₹${reportData.totalSales.toFixed(2)}</p>
              </div>
              <div style="text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Bills</p>
                <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #4f46e5;">${reportData.totalBills}</p>
              </div>
            </div>
            
            <h3 style="color: #374151; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Recent Transactions</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 10px; text-align: left;">Bill #</th>
                  <th style="padding: 10px; text-align: left;">Customer</th>
                  <th style="padding: 10px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${billRows}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports" 
                 style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Full Detailed Report
              </a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} IntelliMart. Automated Report.
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      type: 'DAILY_SALES_REPORT',
      metadata: { shopName: reportData.shopName, totalSales: reportData.totalSales }
    });
  }

  /**
   * Send expiry alert email
   */
  async sendExpiryAlert(userEmail, shopName, expiringItems) {
    const subject = `⚠️ Expiry Alert - ${shopName}`;

    const itemsRows = expiringItems.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; text-align: left;">${item.productName}</td>
        <td style="padding: 10px; text-align: left;">${item.batchNumber || 'N/A'}</td>
        <td style="padding: 10px; text-align: center;">${new Date(item.expiryDate).toLocaleDateString('en-IN')}</td>
        <td style="padding: 10px; text-align: right;">${item.quantity}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Product Expiry Alert</h1>
            <p style="margin: 5px 0 0;">${shopName} | Near-Expiry Batch Notification</p>
          </div>
          <div style="padding: 20px;">
            <p>The following items are expiring within the next 30 days. Please take action to liquidate or remove these stocks.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #fef2f2;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: left;">Batch</th>
                  <th style="padding: 10px; text-align: center;">Expiry</th>
                  <th style="padding: 10px; text-align: right;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/inventory" 
                 style="background-color: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Manage Inventory
              </a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} IntelliMart. Safety Alert System.
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      type: 'EXPIRY_ALERT',
      metadata: { shopName, itemCount: expiringItems.length }
    });
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = emailService;
