import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_TEMPLATES = {
  'subscription_welcome': {
    subject: 'Welcome to Your Subscription!',
    template_id: process.env.SENDGRID_WELCOME_TEMPLATE_ID
  },
  'subscription_updated': {
    subject: 'Your Subscription Has Been Updated',
    template_id: process.env.SENDGRID_UPDATE_TEMPLATE_ID
  },
  'subscription_cancelled': {
    subject: 'Your Subscription Has Been Cancelled',
    template_id: process.env.SENDGRID_CANCEL_TEMPLATE_ID
  },
  'payment_retry_scheduled': {
    subject: 'Action Required: Payment Retry Scheduled',
    template_id: process.env.SENDGRID_PAYMENT_RETRY_TEMPLATE_ID
  },
  'payment_failed_final': {
    subject: 'Important: Subscription Paused Due to Payment Failure',
    template_id: process.env.SENDGRID_PAYMENT_FAILED_FINAL_TEMPLATE_ID
  },
  'payment_retry_success': {
    subject: 'Good News: Payment Successfully Processed',
    template_id: process.env.SENDGRID_PAYMENT_SUCCESS_TEMPLATE_ID
  },
  'subscription_renewal_reminder': {
    subject: 'Your Subscription Renewal is Coming Up',
    template_id: process.env.SENDGRID_RENEWAL_REMINDER_TEMPLATE_ID
  },
  'order_confirmation': {
    subject: 'Your Subscription Order Has Been Processed',
    template_id: process.env.SENDGRID_ORDER_TEMPLATE_ID
  }
};

export async function sendEmail(to, template, data) {
  try {
    const templateConfig = EMAIL_TEMPLATES[template];
    if (!templateConfig) {
      throw new Error(`Email template '${template}' not found`);
    }

    // Add common data to all emails
    const commonData = {
      support_email: process.env.SUPPORT_EMAIL,
      company_name: process.env.COMPANY_NAME,
      help_center_url: `${process.env.NEXT_PUBLIC_URL}/help`,
      current_year: new Date().getFullYear()
    };

    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.COMPANY_NAME
      },
      templateId: templateConfig.template_id,
      dynamic_template_data: {
        subject: templateConfig.subject,
        ...commonData,
        ...data
      }
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully: ${template} to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add your error monitoring service here
      // await errorMonitoring.logError(error);
    }
    throw error;
  }
} 