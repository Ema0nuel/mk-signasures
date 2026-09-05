import { NextResponse } from "next/server";
import https from "https";

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const body = JSON.stringify({
      from: "MK Signasures <no-reply@mksignasures.shop>",
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

    const result = await new Promise<{ success: boolean; data?: any; error?: any }>((resolve) => {
      const options: https.RequestOptions = {
        hostname: "api.resend.com",
        port: 443,
        path: "/emails",
        method: "POST",
        family: 4,
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
              resolve({ success: false, error: parsed });
            }
          } catch {
            resolve({ success: false, error: { message: "Failed to parse response" } });
          }
        });
      });

      req.on("error", (err) => {
        resolve({ success: false, error: { message: err.message } });
      });

      req.write(body);
      req.end();
    });

    if (!result.success) {
      console.error("Resend error:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("Test email failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
