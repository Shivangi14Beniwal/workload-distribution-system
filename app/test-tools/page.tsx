"use client";

import { useState } from "react";

export default function TestToolsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const addLog = (msg: string, type: "success" | "error" | "info" = "info") => {
    const prefix = type === "success" ? "✅" : type === "error" ? "❌" : "→";
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${prefix} ${msg}`, ...prev]);
  };

  const resetQuota = async () => {
    setLoading("reset");
    try {
      const idempotencyKey = `quota-reset-${new Date().toISOString().slice(0, 10)}`;
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey, eventType: "quota.reset", payload: { triggeredBy: "test-tools" } }),
      });
      const data = await res.json();
      const msg = data.data?.message || data.error;
      addLog(`Quota Reset: ${msg}`, res.ok ? "success" : "error");
    } catch {
      addLog("Quota Reset: Network error", "error");
    } finally {
      setLoading(null);
    }
  };

  const testIdempotency = async () => {
    setLoading("idempotency");
    addLog("Testing idempotency — calling webhook 5x with same key...", "info");
    const idempotencyKey = `idempotency-test-${Date.now()}`;
    for (let i = 1; i <= 5; i++) {
      try {
        const res = await fetch("/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idempotencyKey, eventType: "quota.reset", payload: { attempt: i } }),
        });
        const data = await res.json();
        const msg = data.data?.message || data.error;
        addLog(`Call ${i}/5: ${msg}`, i === 1 ? "success" : "info");
      } catch {
        addLog(`Call ${i}/5: Network error`, "error");
      }
    }
    setLoading(null);
  };

  const generateConcurrentLeads = async () => {
    setLoading("concurrent");
    addLog("Generating 10 leads...", "info");
    try {
      const servicesRes = await fetch("/api/services");
      const servicesData = await servicesRes.json();
      const services = servicesData.services || [];
      if (services.length === 0) {
        addLog("No services found", "error");
        return;
      }
      const timestamp = Date.now();
      for (let i = 0; i < 10; i++) {
        const service = services[i % services.length];
        const uniquePhone = `9${String(timestamp + i).slice(-9)}`;
        try {
          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Test User",
              phone: uniquePhone,
              city: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"][i % 5],
              serviceId: service.id,
              description: `Concurrent test lead number ${i + 1}`,
            }),
          });
          const data = await res.json();
          if (res.status === 201) {
            addLog(`Lead ${i + 1}: Created — ${data.data?.assignedProviders} providers assigned`, "success");
          } else {
            addLog(`Lead ${i + 1}: ${data.error || "Failed"}`, "error");
          }
        } catch {
          addLog(`Lead ${i + 1}: Network error`, "error");
        }
      }
      addLog("All leads processed!", "success");
    } catch {
      addLog("Test failed — check console", "error");
    } finally {
      setLoading(null);
    }
  };

  const tools = [
    {
      id: "reset", icon: "🔄", title: "Reset Quota",
      desc: "Simulate a payment webhook resetting all provider monthly quotas back to 10.",
      buttonLabel: "Reset All Quotas", loadingLabel: "Resetting...",
      color: "#22c55e", onClick: resetQuota,
    },
    {
      id: "idempotency", icon: "🎯", title: "Test Idempotency",
      desc: "Call the webhook 5 times with the same key — quota resets exactly once.",
      buttonLabel: "Test Idempotency", loadingLabel: "Testing...",
      color: "#a855f7", onClick: testIdempotency,
    },
    {
      id: "concurrent", icon: "⚡", title: "Concurrent Leads",
      desc: "Fire 10 lead creation requests to stress-test the allocation engine.",
      buttonLabel: "Generate 10 Leads", loadingLabel: "Generating...",
      color: "#6366f1", onClick: generateConcurrentLeads,
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "clamp(20px, 4vw, 32px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 14px", borderRadius: "100px",
            border: "1px solid var(--border-bright)",
            background: "var(--bg-card)",
            fontSize: "12px", color: "var(--accent-blue-bright)",
            marginBottom: "12px",
          }}>
            🧪 Testing Suite
          </div>
          <h1 style={{
            fontSize: "clamp(24px, 5vw, 32px)",
            fontWeight: 800, letterSpacing: "-1px", marginBottom: "8px",
          }}>
            Test{" "}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Tools</span>
          </h1>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "clamp(13px, 2vw, 15px)",
          }}>
            Simulate real-world scenarios — concurrency, idempotency, quota reset.
          </p>
        </div>

        {/* Tool Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: "clamp(12px, 2vw, 20px)",
          marginBottom: "clamp(16px, 3vw, 28px)",
        }}>
          {tools.map((tool) => (
            <div key={tool.id} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "clamp(16px, 3vw, 24px)",
              display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "10px",
                background: `${tool.color}20`,
                border: `1px solid ${tool.color}40`,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "22px",
                flexShrink: 0,
              }}>
                {tool.icon}
              </div>
              <div>
                <h3 style={{
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontWeight: 700, marginBottom: "6px",
                }}>
                  {tool.title}
                </h3>
                <p style={{
                  fontSize: "clamp(12px, 1.5vw, 13px)",
                  color: "var(--text-secondary)", lineHeight: 1.6,
                }}>
                  {tool.desc}
                </p>
              </div>
              <button
                onClick={tool.onClick}
                disabled={loading !== null}
                style={{
                  marginTop: "auto",
                  padding: "clamp(10px, 2vw, 11px) 16px",
                  borderRadius: "9px", border: "none",
                  background: loading === tool.id ? "var(--border)" : tool.color,
                  color: "white",
                  fontSize: "clamp(13px, 1.5vw, 14px)",
                  fontWeight: 700,
                  cursor: loading !== null ? "not-allowed" : "pointer",
                  opacity: loading !== null && loading !== tool.id ? 0.5 : 1,
                  transition: "all 0.2s",
                  boxShadow: loading === tool.id ? "none" : `0 0 20px ${tool.color}50`,
                  width: "100%",
                }}
              >
                {loading === tool.id ? tool.loadingLabel : tool.buttonLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Activity Log */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "clamp(12px, 2vw, 16px) clamp(14px, 3vw, 20px)",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap", gap: "8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🖥️</span>
              <span style={{
                fontWeight: 700,
                fontSize: "clamp(13px, 2vw, 15px)",
              }}>Activity Log</span>
              {logs.length > 0 && (
                <span style={{
                  fontSize: "11px", padding: "2px 8px",
                  borderRadius: "100px",
                  background: "rgba(99,102,241,0.15)",
                  color: "var(--accent-blue-bright)",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}>
                  {logs.length} events
                </span>
              )}
            </div>
            <button
              onClick={() => setLogs([])}
              style={{
                fontSize: "12px", color: "var(--text-muted)",
                background: "none", border: "none",
                cursor: "pointer", padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              Clear
            </button>
          </div>

          <div style={{
            background: "#080810",
            padding: "clamp(14px, 3vw, 20px)",
            height: "clamp(200px, 30vw, 280px)",
            overflowY: "auto",
            fontFamily: "'Fira Code', 'Courier New', monospace",
          }}>
            {logs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                $ Run a test to see output here...
              </p>
            ) : (
              logs.map((log, i) => (
                <p key={i} style={{
                  fontSize: "clamp(11px, 1.5vw, 12px)",
                  marginBottom: "6px",
                  color: log.includes("✅")
                    ? "#22c55e"
                    : log.includes("❌")
                    ? "#ef4444"
                    : "#818cf8",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}>
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}