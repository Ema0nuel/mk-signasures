import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "MK Signasures <no-reply@mksignatures.shop>",
      to,
      subject: "Test Email from MK Signasures",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #f8f8f8;">
          <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
            <h1 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px 0;">MK Signasures</h1>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              This is a test email. If you received this, Resend is working correctly.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              Sent at ${new Date().toISOString()}
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Test email failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
