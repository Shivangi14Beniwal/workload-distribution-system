"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Hero Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Hero Section */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "100px 24px 60px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "100px",
            border: "1px solid var(--border-bright)",
            background: "var(--bg-card)",
            fontSize: "13px",
            color: "var(--accent-blue-bright)",
            marginBottom: "32px",
          }}
        >
          <span className="pulse" style={{ color: "var(--accent-green)" }}>
            ●
          </span>
          Production-grade Lead Distribution System
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "24px",
            letterSpacing: "-2px",
          }}
        >
          Distribute Leads{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Fairly & Instantly
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            margin: "0 auto 48px",
            lineHeight: 1.7,
          }}
        >
          Auto-assign service requests to providers using mandatory rules,
          fair rotation, and real-time updates. Built for scale.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "80px",
          }}
        >
          <Link href="/request-service" style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "14px 32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "white",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(99,102,241,0.4)",
                transition: "all 0.2s",
              }}
            >
              Submit a Request →
            </div>
          </Link>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "14px 32px",
                borderRadius: "10px",
                border: "1px solid var(--border-bright)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              View Dashboard
            </div>
          </Link>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "80px",
          }}
        >
          {[
            { value: "8", label: "Providers", color: "var(--accent-blue)" },
            { value: "3", label: "Services", color: "var(--accent-purple)" },
            { value: "3x", label: "Providers per Lead", color: "var(--accent-green)" },
            { value: "< 1s", label: "Allocation Time", color: "var(--accent-amber)" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "24px",
                borderRadius: "12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: stat.color,
                  marginBottom: "4px",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            textAlign: "left",
          }}
        >
          {[
            {
              icon: "⚡",
              title: "Mandatory Rules",
              desc: "Service 1 → Provider 1 always. Rules stored in DB, not hardcoded.",
              color: "#6366f1",
            },
            {
              icon: "🔄",
              title: "Fair Round-Robin",
              desc: "Persistent rotation via AllocationState table. Survives restarts.",
              color: "#a855f7",
            },
            {
              icon: "🔒",
              title: "Concurrency Safe",
              desc: "PostgreSQL Advisory Locks prevent double assignment under load.",
              color: "#22c55e",
            },
            {
              icon: "📡",
              title: "Real-time Updates",
              desc: "Server-Sent Events push new leads to dashboard instantly.",
              color: "#f59e0b",
            },
            {
              icon: "🎯",
              title: "Quota Management",
              desc: "Monthly quota of 10 per provider. Reset via idempotent webhook.",
              color: "#ec4899",
            },
            {
              icon: "📋",
              title: "Full Audit Trail",
              desc: "Every allocation decision logged in AuditLog table.",
              color: "#06b6d4",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="card-hover"
              style={{
                padding: "24px",
                borderRadius: "12px",
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: `${feature.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  marginBottom: "16px",
                  border: `1px solid ${feature.color}40`,
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "var(--text-primary)",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: "80px",
            padding: "48px",
            borderRadius: "16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-10%",
              width: "400px",
              height: "400px",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 800,
              marginBottom: "12px",
            }}
          >
            Ready to test the system?
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "24px",
              fontSize: "16px",
            }}
          >
            Generate 10 concurrent leads, test idempotency, reset quotas.
          </p>
          <Link href="/test-tools" style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "inline-block",
                padding: "12px 28px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "white",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Open Test Tools →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}