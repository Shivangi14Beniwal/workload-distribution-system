"use client";

import { useState, useEffect } from "react";

interface Service {
  id: string;
  name: string;
  slug: string;
}

export default function RequestServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    serviceId: "",
    description: "",
  });

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);
      setForm({ name: "", phone: "", city: "", serviceId: "", description: "" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontSize: "clamp(13px, 2vw, 15px)",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(20px, 5vw, 40px) 16px",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%",
        transform: "translateX(-50%)",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{
        width: "100%",
        maxWidth: "520px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(20px, 4vw, 32px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px", borderRadius: "100px",
            border: "1px solid var(--border-bright)",
            background: "var(--bg-card)",
            fontSize: "clamp(11px, 2vw, 13px)",
            color: "var(--accent-blue-bright)",
            marginBottom: "16px",
          }}>
            📋 Service Request
          </div>

          <h1 style={{
            fontSize: "clamp(24px, 5vw, 32px)",
            fontWeight: 800, marginBottom: "8px",
            letterSpacing: "-1px",
          }}>
            Request a{" "}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Service</span>
          </h1>

          <p style={{
            color: "var(--text-secondary)",
            fontSize: "clamp(13px, 2vw, 15px)",
            padding: "0 8px",
          }}>
            Fill the form and we'll connect you with the right providers instantly.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            padding: "14px 16px",
            borderRadius: "12px",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
            marginBottom: "20px",
            fontSize: "clamp(13px, 2vw, 14px)",
            fontWeight: 500,
          }}>
            ✅ Request submitted! Providers have been notified instantly.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "14px 16px",
            borderRadius: "12px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            marginBottom: "20px",
            fontSize: "clamp(13px, 2vw, 14px)",
            fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form Card */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "clamp(20px, 5vw, 32px)",
        }}>
          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Shivangi Beniwal"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* Phone + City — side by side on desktop */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "16px",
            }}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel" required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text" required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Mumbai"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            {/* Service */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Service Type</label>
              <select
                required
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  color: form.serviceId ? "var(--text-primary)" : "var(--text-muted)",
                }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              >
                <option value="" style={{ background: "var(--bg-secondary)" }}>
                  Select a service...
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: "var(--bg-secondary)" }}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Description</label>
              <textarea
                required rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your requirement in detail (min 10 characters)..."
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "clamp(12px, 2vw, 14px)",
                borderRadius: "10px",
                border: "none",
                background: loading
                  ? "var(--border)"
                  : "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "white",
                fontSize: "clamp(14px, 2vw, 16px)",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 0 20px rgba(99,102,241,0.4)",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Submitting..." : "Submit Request →"}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "12px",
          marginTop: "16px",
        }}>
          Your request will be assigned to exactly 3 providers instantly.
        </p>
      </div>
    </div>
  );
}