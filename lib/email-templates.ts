const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const baseStyles = `
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8f8f8;
`;

const containerStyles = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
`;

const headerStyles = `
  background-color: #1a1a1a;
  padding: 32px 40px;
  text-align: center;
`;

const bodyStyles = `
  padding: 40px;
  color: #333333;
  line-height: 1.6;
`;

const footerStyles = `
  background-color: #f8f8f8;
  padding: 32px 40px;
  text-align: center;
  font-size: 12px;
  color: #999999;
`;

const goldButtonStyles = `
  display: inline-block;
  background-color: #C9A96E;
  color: #1a1a1a;
  text-decoration: none;
  padding: 14px 32px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 4px;
  margin-top: 24px;
`;

const dividerStyles = `
  border: none;
  border-top: 1px solid #e5e5e5;
  margin: 24px 0;
`;

export function resetPasswordTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyles}">
  <div style="padding: 40px 20px;">
    <div style="${containerStyles}">
      <div style="${headerStyles}">
        <h1 style="color: #C9A96E; font-size: 24px; font-weight: 300; letter-spacing: 2px; margin: 0;">MK SIGNASURES</h1>
      </div>
      <div style="${bodyStyles}">
        <h2 style="font-size: 20px; font-weight: 400; margin: 0 0 16px 0; color: #1a1a1a;">Reset Your Password</h2>
        <p style="font-size: 15px; color: #555555; margin: 0 0 24px 0;">
          Hi ${name}, we received a request to reset the password for your MK Signasures account.
        </p>
        <p style="font-size: 15px; color: #555555; margin: 0 0 24px 0;">
          Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" style="${goldButtonStyles}">Reset Password</a>
        </div>
        <hr style="${dividerStyles}">
        <p style="font-size: 13px; color: #999999; margin: 0;">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <div style="${footerStyles}">
        <p style="margin: 0 0 8px 0;">MK Signasures | Premium Wigs, Hair & Clothing</p>
        <p style="margin: 0;">Questions? Reply to this email or reach us at <a href="mailto:admin@mksignasures.shop" style="color: #C9A96E; text-decoration: none;">admin@mksignasures.shop</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyles}">
  <div style="padding: 40px 20px;">
    <div style="${containerStyles}">
      <div style="${headerStyles}">
        <h1 style="color: #C9A96E; font-size: 24px; font-weight: 300; letter-spacing: 2px; margin: 0;">MK SIGNASURES</h1>
      </div>
      <div style="${bodyStyles}">
        <h2 style="font-size: 20px; font-weight: 400; margin: 0 0 16px 0; color: #1a1a1a;">Welcome, ${name}</h2>
        <p style="font-size: 15px; color: #555555; margin: 0 0 24px 0;">
          Thank you for joining MK Signasures. You now have access to our collection of premium wigs, hair extensions, and clothing.
        </p>
        <p style="font-size: 15px; color: #555555; margin: 0 0 24px 0;">
          Every order comes with fast delivery across Nigeria and a hassle-free return policy.
        </p>
        <div style="text-align: center;">
          <a href="https://mksignasures.shop/shop" style="${goldButtonStyles}">Browse Collection</a>
        </div>
      </div>
      <div style="${footerStyles}">
        <p style="margin: 0 0 8px 0;">MK Signasures | Premium Wigs, Hair & Clothing</p>
        <p style="margin: 0;">Questions? Reply to this email or reach us at <a href="mailto:admin@mksignasures.shop" style="color: #C9A96E; text-decoration: none;">admin@mksignasures.shop</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
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

function buildOrderItemsHtml(items: OrderEmailData["items"]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${
              item.image_url
                ? `<td style="width: 56px; padding-right: 12px; vertical-align: top;">
                <img src="${item.image_url}" alt="${item.product_name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 4px; display: block;" />
              </td>`
                : ""
            }
            <td style="vertical-align: top;">
              <p style="font-size: 14px; color: #333333; margin: 0; font-weight: 500;">${item.product_name}</p>
              <p style="font-size: 12px; color: #999999; margin: 4px 0 0 0;">${item.variant_name}</p>
              <p style="font-size: 11px; color: #bbbbbb; margin: 2px 0 0 0; font-family: monospace;">SKU: ${item.sku}</p>
              <p style="font-size: 12px; color: #555555; margin: 4px 0 0 0;">Qty: ${item.quantity} &times; ${formatPrice(item.unit_price)}</p>
            </td>
            <td style="padding-left: 12px; vertical-align: top; text-align: right; white-space: nowrap;">
              <p style="font-size: 14px; color: #333333; margin: 0; font-weight: 500;">${formatPrice(item.line_total)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("");
}

export function orderConfirmationTemplate(
  name: string,
  order: OrderEmailData
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyles}">
  <div style="padding: 40px 20px;">
    <div style="${containerStyles}">
      <div style="${headerStyles}">
        <h1 style="color: #C9A96E; font-size: 24px; font-weight: 300; letter-spacing: 2px; margin: 0;">MK SIGNASURES</h1>
      </div>
      <div style="${bodyStyles}">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 56px; height: 56px; background-color: #e8f5e9; border-radius: 50%; margin: 0 auto 16px; line-height: 56px; font-size: 24px;">&#10003;</div>
          <h2 style="font-size: 20px; font-weight: 400; margin: 0; color: #1a1a1a;">Order Confirmed</h2>
          <p style="font-size: 14px; color: #999999; margin: 8px 0 0 0;">${order.orderNumber}</p>
        </div>

        <p style="font-size: 15px; color: #555555; margin: 0 0 24px 0;">
          Hi ${name}, your order has been confirmed and is being processed.
        </p>

        <hr style="${dividerStyles}">

        <h3 style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Product</th>
              <th style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Qty</th>
              <th style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildOrderItemsHtml(order.items)}
          </tbody>
        </table>

        <hr style="${dividerStyles}">

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #555555;">Subtotal</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333333; text-align: right;">${formatPrice(order.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #555555;">Shipping</td>
            <td style="padding: 6px 0; font-size: 14px; color: ${order.shippingFee === 0 ? "#2e7d32" : "#333333"}; text-align: right;">${order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0 6px 0; font-size: 15px; font-weight: 600; color: #1a1a1a; border-top: 1px solid #e5e5e5;">Total</td>
            <td style="padding: 12px 0 6px 0; font-size: 15px; font-weight: 600; color: #1a1a1a; text-align: right; border-top: 1px solid #e5e5e5;">${formatPrice(order.totalAmount)}</td>
          </tr>
        </table>

        <hr style="${dividerStyles}">

        <h3 style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Shipping Details</h3>
        <p style="font-size: 14px; color: #555555; margin: 0; line-height: 1.8;">
          ${order.shippingName}<br>
          ${order.shippingAddress}<br>
          ${order.shippingCity}, ${order.shippingState}${order.shippingCountry ? `, ${order.shippingCountry}` : ""}<br>
          ${order.shippingPhone}
        </p>
        ${
          order.customerNotes
            ? `<div style="margin-top: 16px; padding: 12px 16px; background-color: #f8f8f8; border-radius: 4px;">
              <p style="font-size: 12px; color: #999999; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Notes</p>
              <p style="font-size: 13px; color: #555555; margin: 0;">${order.customerNotes}</p>
            </div>`
            : ""
        }

        <hr style="${dividerStyles}">

        <p style="font-size: 12px; color: #999999; margin: 0;">
          Payment Reference: ${order.paystackReference}
        </p>

        <div style="text-align: center; margin-top: 32px;">
          <a href="https://mksignasures.shop/orders" style="${goldButtonStyles}">Track Your Order</a>
        </div>
      </div>
      <div style="${footerStyles}">
        <p style="margin: 0 0 8px 0;">MK Signasures | Premium Wigs, Hair & Clothing</p>
        <p style="margin: 0;">Questions? Reply to this email or reach us at <a href="mailto:admin@mksignasures.shop" style="color: #C9A96E; text-decoration: none;">admin@mksignasures.shop</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: "#e3f2fd", text: "#1565c0", label: "Confirmed" },
  processing: { bg: "#f3e5f5", text: "#7b1fa2", label: "Processing" },
  shipped: { bg: "#e8eaf6", text: "#283593", label: "Shipped" },
  delivered: { bg: "#e8f5e9", text: "#2e7d32", label: "Delivered" },
  cancelled: { bg: "#ffebee", text: "#c62828", label: "Cancelled" },
  refunded: { bg: "#fff3e0", text: "#e65100", label: "Refunded" },
};

const statusMessages: Record<string, string> = {
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "We are currently processing your order.",
  shipped: "Great news! Your order has been shipped and is on its way to you.",
  delivered: "Your order has been delivered. We hope you love your purchase!",
  cancelled: "Your order has been cancelled. If you have any questions, please contact us.",
  refunded: "Your order has been refunded. The funds will appear in your account within 3-5 business days.",
};

export function orderStatusUpdateTemplate(
  name: string,
  orderNumber: string,
  newStatus: string
): string {
  const status = statusColors[newStatus] || { bg: "#f5f5f5", text: "#333333", label: newStatus };
  const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}.`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyles}">
  <div style="padding: 40px 20px;">
    <div style="${containerStyles}">
      <div style="${headerStyles}">
        <h1 style="color: #C9A96E; font-size: 24px; font-weight: 300; letter-spacing: 2px; margin: 0;">MK SIGNASURES</h1>
        <p style="color: #999999; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 1px;">ORDER UPDATE</p>
      </div>
      <div style="${bodyStyles}">
        <h2 style="font-size: 20px; font-weight: 400; margin: 0 0 8px 0; color: #1a1a1a;">Hi ${name}</h2>
        <p style="font-size: 15px; color: #555555; margin: 0 0 24px 0;">${message}</p>

        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: ${status.bg}; color: ${status.text}; padding: 10px 28px; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px;">
            ${status.label}
          </div>
        </div>

        <hr style="${dividerStyles}">

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #555555;">Order Number</td>
            <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 600; text-align: right;">${orderNumber}</td>
          </tr>
        </table>

        <hr style="${dividerStyles}">

        <p style="font-size: 13px; color: #999999; margin: 0 0 8px 0;">
          You can track your order status from your account dashboard.
        </p>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://mksignasures.shop/orders" style="${goldButtonStyles}">Track Your Order</a>
        </div>
      </div>
      <div style="${footerStyles}">
        <p style="margin: 0 0 8px 0;">MK Signasures | Premium Wigs, Hair & Clothing</p>
        <p style="margin: 0;">Questions? Reply to this email or reach us at <a href="mailto:admin@mksignasures.shop" style="color: #C9A96E; text-decoration: none;">admin@mksignasures.shop</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function adminNotificationTemplate(
  order: OrderEmailData & { customerEmail: string }
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${baseStyles}">
  <div style="padding: 40px 20px;">
    <div style="${containerStyles}">
      <div style="${headerStyles}">
        <h1 style="color: #C9A96E; font-size: 24px; font-weight: 300; letter-spacing: 2px; margin: 0;">MK SIGNASURES</h1>
        <p style="color: #999999; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 1px;">NEW ORDER NOTIFICATION</p>
      </div>
      <div style="${bodyStyles}">
        <div style="background-color: #fff8e1; border-left: 4px solid #C9A96E; padding: 16px 20px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #555555; margin: 0;">Order <strong>${order.orderNumber}</strong> has been confirmed and paid.</p>
        </div>

        <h3 style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Customer</h3>
        <p style="font-size: 14px; color: #555555; margin: 0 0 24px 0; line-height: 1.8;">
          ${order.shippingName}<br>
          ${order.customerEmail}<br>
          ${order.shippingPhone}
        </p>

        <h3 style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Product</th>
              <th style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Qty</th>
              <th style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${buildOrderItemsHtml(order.items)}
          </tbody>
        </table>

        <hr style="${dividerStyles}">

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #555555;">Subtotal</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333333; text-align: right;">${formatPrice(order.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #555555;">Shipping</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333333; text-align: right;">${formatPrice(order.shippingFee)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0 6px 0; font-size: 15px; font-weight: 600; color: #1a1a1a; border-top: 1px solid #e5e5e5;">Total</td>
            <td style="padding: 12px 0 6px 0; font-size: 15px; font-weight: 600; color: #1a1a1a; text-align: right; border-top: 1px solid #e5e5e5;">${formatPrice(order.totalAmount)}</td>
          </tr>
        </table>

        <hr style="${dividerStyles}">

        <h3 style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Shipping</h3>
        <p style="font-size: 14px; color: #555555; margin: 0; line-height: 1.8;">
          ${order.shippingAddress}<br>
          ${order.shippingCity}, ${order.shippingState}
        </p>

        <hr style="${dividerStyles}">

        <p style="font-size: 12px; color: #999999; margin: 0;">
          Payment Reference: ${order.paystackReference}
        </p>
      </div>
      <div style="${footerStyles}">
        <p style="margin: 0;">MK Signasures Admin Dashboard</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
