import { Resend } from "resend";
import { welcomeEmailTemplate, orderConfirmationTemplate, adminNotificationTemplate } from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

const CUSTOMER_FROM_EMAIL = "MK Signasures <no-reply@mksignatures.shop>";
const ADMIN_FROM_EMAIL = "MK Signasures <customer@mksignatures.shop>";
const ADMIN_EMAIL = "admin@mksignasures.shop";

export async function sendWelcomeEmail(email: string, name: string) {
  const { data, error } = await resend.emails.send({
    from: CUSTOMER_FROM_EMAIL,
    to: email,
    subject: "Welcome to MK Signasures",
    html: welcomeEmailTemplate(name),
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }

  return { success: true, data };
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
  const { data, error } = await resend.emails.send({
    from: CUSTOMER_FROM_EMAIL,
    to: email,
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: orderConfirmationTemplate(name, order),
  });

  if (error) {
    console.error("Failed to send order confirmation:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function sendAdminNotification(order: OrderEmailData & { customerEmail: string }) {
  const { data, error } = await resend.emails.send({
    from: ADMIN_FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Order - ${order.orderNumber}`,
    html: adminNotificationTemplate(order),
  });

  if (error) {
    console.error("Failed to send admin notification:", error);
    return { success: false, error };
  }

  return { success: true, data };
}
