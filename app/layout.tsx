"use client";

import { useState } from "react";
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <nav style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}>⚡</div>
            <span style={{
              fontWeight: 700,
              fontSize: "18px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>WorkloadDS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/request-service" style={{
              textDecoration: "none", padding: "8px 16px", borderRadius: "8px",
              fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)",
            }}>Request Service</Link>
            <Link href="/dashboard" style={{
              textDecoration: "none", padding: "8px 16px", borderRadius: "8px",
              fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)",
            }}>Dashboard</Link>
            <Link href="/test-tools" style={{
              textDecoration: "none", padding: "8px 16px", borderRadius: "8px",
              fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)",
            }}>Test Tools</Link>
            <Link href="/request-service" style={{
              textDecoration: "none", padding: "8px 18px", borderRadius: "8px",
              fontSize: "14px", fontWeight: 600, color: "white",
              background: "linear-gradient(135deg, #6366f1, #a855f7)", marginLeft: "8px",
            }}>+ New Request</Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="show-mobile"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "8px 10px", cursor: "pointer",
              color: "var(--text-primary)", fontSize: "18px", display: "none",
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </nav>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 24px",
            zIndex: 99,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <Link href="/request-service" onClick={() => setMenuOpen(false)} style={{
              textDecoration: "none", padding: "12px 16px", borderRadius: "8px",
              fontSize: "15px", fontWeight: 500, color: "var(--text-primary)",
              background: "var(--bg-card)", border: "1px solid var(--border)",
            }}>📋 Request Service</Link>
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
              textDecoration: "none", padding: "12px 16px", borderRadius: "8px",
              fontSize: "15px", fontWeight: 500, color: "var(--text-primary)",
              background: "var(--bg-card)", border: "1px solid var(--border)",
            }}>📊 Dashboard</Link>
            <Link href="/test-tools" onClick={() => setMenuOpen(false)} style={{
              textDecoration: "none", padding: "12px 16px", borderRadius: "8px",
              fontSize: "15px", fontWeight: 500, color: "var(--text-primary)",
              background: "var(--bg-card)", border: "1px solid var(--border)",
            }}>🧪 Test Tools</Link>
            <Link href="/request-service" onClick={() => setMenuOpen(false)} style={{
              textDecoration: "none", padding: "12px 16px", borderRadius: "8px",
              fontSize: "15px", fontWeight: 700, color: "white", textAlign: "center",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
            }}>+ New Request</Link>
          </div>
        )}

        <main>{children}</main>
      </body>
    </html>
  );
}