import https from "https";
import { welcomeEmailTemplate, orderConfirmationTemplate, adminNotificationTemplate, orderStatusUpdateTemplate } from "./email-templates";
import { logger } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const CUSTOMER_FROM_EMAIL = "MK Signasures <no-reply@mksignasures.shop>";
const ADMIN_FROM_EMAIL = "MK Signasures <customer@mksignasures.shop>";
const ADMIN_EMAIL = "admin@mksignasures.shop";

interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

function sendEmail({ from, to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  return new Promise((resolve) => {
    const body = JSON.stringify({ from, to, subject, html });
    const options: https.RequestOptions = {
      hostname: "api.resend.com",
      port: 443,
      path: "/emails",
      method: "POST",
      family: 4,
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: parsed });
          } else {
            logger.error("Resend API error", parsed);
            resolve({ success: false, error: parsed });
          }
        } catch {
          resolve({ success: false, error: { message: "Failed to parse Resend response" } });
        }
      });
    });

    req.on("error", (err) => {
      logger.error("Resend request error", { message: err.message });
      resolve({ success: false, error: { message: err.message } });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ success: false, error: { message: "Request timed out" } });
    });

    req.write(body);
    req.end();
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const result = await sendEmail({
    from: CUSTOMER_FROM_EMAIL,
    to: email,
    subject: "Welcome to MK Signasures",
    html: welcomeEmailTemplate(name),
  });

  if (!result.success) {
    logger.error("Failed to send welcome email", result.error);
  }

  return result;
}

interface OrderEmailData {
  orderNumber: string;
  items: Array<{
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    image_url?: string;
  }>;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry?: string;
  paystackReference: string;
  customerNotes?: string;
}

export async function sendOrderConfirmation(
  email: string,
  name: string,
  order: OrderEmailData
) {
  const result = await sendEmail({
    from: CUSTOMER_FROM_EMAIL,
    to: email,
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: orderConfirmationTemplate(name, order),
  });

  if (!result.success) {
    logger.error("Failed to send order confirmation", result.error);
  }

  return result;
}

export async function sendAdminNotification(order: OrderEmailData & { customerEmail: string }) {
  const result = await sendEmail({
    from: ADMIN_FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Order - ${order.orderNumber}`,
    html: adminNotificationTemplate(order),
  });

  if (!result.success) {
    logger.error("Failed to send admin notification", result.error);
  }

  return result;
}

export async function sendOrderStatusUpdate(
  email: string,
  name: string,
  orderNumber: string,
  newStatus: string
) {
  const result = await sendEmail({
    from: CUSTOMER_FROM_EMAIL,
    to: email,
    subject: `Order ${orderNumber} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    html: orderStatusUpdateTemplate(name, orderNumber, newStatus),
  });

  if (!result.success) {
    logger.error("Failed to send order status update", result.error);
  }

  return result;
}
