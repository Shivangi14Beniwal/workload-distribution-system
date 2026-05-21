import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WorkloadDS — Lead Distribution System",
  description: "Production-grade lead distribution platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/request-service" style={{
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}>Request Service</Link>

            <Link href="/dashboard" style={{
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}>Dashboard</Link>

            <Link href="/test-tools" style={{
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}>Test Tools</Link>

            <Link href="/request-service" style={{
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "white",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              marginLeft: "8px",
            }}>+ New Request</Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}