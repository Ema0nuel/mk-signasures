"use client";

import { useState } from "react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("esunday08177@gmail.com");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSend() {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error?.message || JSON.stringify(data.error || data));
      } else {
        setStatus("success");
        setMessage("Email sent! Check your inbox.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error: " + (err as Error).message);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ background: "#fff", padding: "40px", borderRadius: "8px", maxWidth: "420px", width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Test Resend Email</h1>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
          Send a test email through the Next.js server route.
        </p>

        <label style={{ fontSize: "13px", color: "#555", display: "block", marginBottom: "6px" }}>
          Recipient email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }}
        />

        <button
          onClick={handleSend}
          disabled={status === "loading"}
          style={{
            width: "100%",
            padding: "12px",
            background: status === "loading" ? "#999" : "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Sending..." : "Send Test Email"}
        </button>

        {message && (
          <div style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "13px",
            background: status === "success" ? "#e8f5e9" : "#ffebee",
            color: status === "success" ? "#2e7d32" : "#c62828",
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
