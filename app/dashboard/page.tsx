"use client";

import { useState, useEffect, useRef } from "react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  service: string;
  assignmentType: string;
  assignedAt: string;
}

interface Provider {
  id: string;
  name: string;
  monthlyQuota: number;
  leadsThisMonth: number;
  remainingQuota: number;
  leads: Lead[];
}

export default function DashboardPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setProviders(data.providers || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const es = new EventSource("/api/sse");
    eventSourceRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      if (event.data === "update" || event.data === "connected") fetchData();
    };
    es.onerror = () => {
      setConnected(false);
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    };
    return () => es.close();
  }, []);

  const totalLeads = providers.reduce((sum, p) => sum + p.leadsThisMonth, 0);
  const fullQuota = providers.filter((p) => p.remainingQuota === 0).length;
  const available = providers.filter((p) => p.remainingQuota > 0).length;

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>⚡</div>
          <p style={{ color: "var(--text-secondary)" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "clamp(20px, 4vw, 32px)",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "5px 14px", borderRadius: "100px",
              border: "1px solid var(--border-bright)",
              background: "var(--bg-card)",
              fontSize: "12px", color: "var(--accent-blue-bright)",
              marginBottom: "12px",
            }}>
              📊 Live Dashboard
            </div>
            <h1 style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              fontWeight: 800, letterSpacing: "-1px", marginBottom: "4px",
            }}>
              Provider{" "}
              <span style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Dashboard</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Real-time lead distribution overview
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              justifyContent: "flex-end", marginBottom: "4px",
            }}>
              <div className="pulse" style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: connected ? "var(--accent-green)" : "var(--accent-amber)",
              }} />
              <span style={{
                fontSize: "13px",
                color: connected ? "var(--accent-green)" : "var(--accent-amber)",
                fontWeight: 600,
              }}>
                {connected ? "Live" : "Polling"}
              </span>
            </div>
            {lastUpdated && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
          gap: "clamp(10px, 2vw, 16px)",
          marginBottom: "clamp(20px, 4vw, 32px)",
        }}>
          {[
            { label: "Total Providers", value: providers.length, color: "var(--text-primary)", icon: "👥" },
            { label: "Total Leads", value: totalLeads, color: "var(--accent-blue-bright)", icon: "📋" },
            { label: "Full Quota", value: fullQuota, color: "var(--accent-red)", icon: "🔴" },
            { label: "Available", value: available, color: "var(--accent-green)", icon: "✅" },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: "clamp(14px, 3vw, 20px) clamp(16px, 3vw, 24px)",
              borderRadius: "12px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: "8px", marginBottom: "8px",
              }}>
                <span style={{ fontSize: "16px" }}>{stat.icon}</span>
                <p style={{
                  fontSize: "clamp(11px, 1.5vw, 13px)",
                  color: "var(--text-secondary)",
                }}>{stat.label}</p>
              </div>
              <p style={{
                fontSize: "clamp(22px, 4vw, 28px)",
                fontWeight: 800, color: stat.color,
              }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Provider Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          gap: "clamp(12px, 2vw, 20px)",
        }}>
          {providers.map((provider) => {
            const pct = (provider.leadsThisMonth / provider.monthlyQuota) * 100;
            const isFull = provider.remainingQuota === 0;

            return (
              <div key={provider.id} style={{
                background: "var(--bg-card)",
                border: `1px solid ${isFull ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                borderRadius: "14px",
                overflow: "hidden",
              }}>
                {/* Card Header */}
                <div style={{
                  padding: "clamp(14px, 3vw, 20px)",
                  borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                    flexWrap: "wrap", gap: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "8px",
                        background: "linear-gradient(135deg, #6366f120, #a855f720)",
                        border: "1px solid #6366f140",
                        display: "flex", alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px", fontWeight: 700,
                        color: "var(--accent-blue-bright)",
                        flexShrink: 0,
                      }}>
                        {provider.name.split(" ")[1]}
                      </div>
                      <span style={{
                        fontWeight: 700,
                        fontSize: "clamp(13px, 2vw, 15px)",
                      }}>
                        {provider.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "11px", fontWeight: 700,
                      padding: "4px 10px", borderRadius: "100px",
                      background: isFull
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(34,197,94,0.15)",
                      color: isFull ? "var(--accent-red)" : "var(--accent-green)",
                      border: `1px solid ${isFull
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(34,197,94,0.3)"}`,
                      whiteSpace: "nowrap",
                    }}>
                      {isFull ? "FULL" : "AVAILABLE"}
                    </span>
                  </div>

                  {/* Quota Bar */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px",
                  }}>
                    <span>{provider.leadsThisMonth} leads assigned</span>
                    <span>{provider.remainingQuota} remaining</span>
                  </div>
                  <div style={{
                    width: "100%", height: "6px", borderRadius: "3px",
                    background: "var(--bg-secondary)", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", borderRadius: "3px",
                      width: `${pct}%`,
                      background: isFull
                        ? "var(--accent-red)"
                        : pct > 70
                        ? "var(--accent-amber)"
                        : "linear-gradient(90deg, #6366f1, #a855f7)",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>

                {/* Leads List */}
                <div style={{ padding: "clamp(10px, 2vw, 16px) clamp(14px, 3vw, 20px)" }}>
                  {provider.leads.length === 0 ? (
                    <p style={{
                      fontSize: "13px", color: "var(--text-muted)",
                      textAlign: "center", padding: "16px 0",
                    }}>
                      No leads assigned yet
                    </p>
                  ) : (
                    <div style={{
                      maxHeight: "200px", overflowY: "auto",
                      display: "flex", flexDirection: "column", gap: "8px",
                    }}>
                      {provider.leads.map((lead) => (
                        <div key={lead.id} style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px", borderRadius: "8px",
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border)",
                          gap: "8px",
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{
                              fontSize: "clamp(11px, 1.5vw, 13px)",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              {lead.name}
                            </p>
                            <p style={{
                              fontSize: "clamp(10px, 1.2vw, 11px)",
                              color: "var(--text-muted)",
                            }}>
                              {lead.service} • {lead.city}
                            </p>
                          </div>
                          <span style={{
                            fontSize: "10px", fontWeight: 700,
                            padding: "3px 8px", borderRadius: "6px",
                            background: lead.assignmentType === "MANDATORY"
                              ? "rgba(168,85,247,0.15)"
                              : "rgba(99,102,241,0.15)",
                            color: lead.assignmentType === "MANDATORY"
                              ? "#a855f7"
                              : "var(--accent-blue-bright)",
                            border: `1px solid ${lead.assignmentType === "MANDATORY"
                              ? "rgba(168,85,247,0.3)"
                              : "rgba(99,102,241,0.3)"}`,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}>
                            {lead.assignmentType === "MANDATORY" ? "MANDATORY" : "ROTATION"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}