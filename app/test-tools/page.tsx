"use client";

import { useState } from "react";

export default function TestToolsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const resetQuota = async () => {
    setLoading("reset");
    try {
      const idempotencyKey = `quota-reset-${new Date().toISOString().slice(0, 10)}`;
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          eventType: "quota.reset",
          payload: { triggeredBy: "test-tools" },
        }),
      });
      const data = await res.json();
      addLog(`Quota Reset: ${data.message || data.error}`);
    } catch {
      addLog("Quota Reset: Network error");
    } finally {
      setLoading(null);
    }
  };

  const testIdempotency = async () => {
    setLoading("idempotency");
    addLog("Testing idempotency — calling webhook 5 times with same key...");
    const idempotencyKey = `idempotency-test-${Date.now()}`;

    for (let i = 1; i <= 5; i++) {
      try {
        const res = await fetch("/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey,
            eventType: "quota.reset",
            payload: { attempt: i },
          }),
        });
        const data = await res.json();
        addLog(`Call ${i}: ${data.message || data.error}`);
      } catch {
        addLog(`Call ${i}: Network error`);
      }
    }
    setLoading(null);
  };

  const generateConcurrentLeads = async () => {
    setLoading("concurrent");
    addLog("Generating 10 concurrent leads...");

    try {
      const servicesRes = await fetch("/api/services");
      const servicesData = await servicesRes.json();
      const services = servicesData.services || [];

      if (services.length === 0) {
        addLog("Error: No services found");
        return;
      }

      const timestamp = Date.now();

      // FIX: har lead ka unique phone number
      const promises = Array.from({ length: 10 }, (_, i) => {
        const service = services[i % services.length];
        const uniquePhone = `${6 + (i % 4)}${String(timestamp).slice(-8)}${i}`.slice(0, 10);
        
        return fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Test User ${timestamp}-${i}`,
            phone: uniquePhone,
            city: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"][i % 5],
            serviceId: service.id,
            description: `Concurrent test lead ${i + 1}`,
          }),
        }).then(async (res) => {
          const data = await res.json();
          return { index: i + 1, status: res.status, data };
        });
      });

      const results = await Promise.all(promises);

      results.forEach((r) => {
        if (r.status === 201) {
          addLog(`Lead ${r.index}: Created — ${r.data.assignedProviders} providers assigned`);
        } else {
          addLog(`Lead ${r.index}: ${r.data.error || "Failed"}`);
        }
      });

      addLog("Concurrent test complete!");
    } catch (err) {
      addLog("Concurrent test failed — check console");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Tools</h1>
        <p className="text-gray-500 mb-8">
          Simulate real-world scenarios — concurrency, idempotency, quota reset.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Reset Quota</h2>
            <p className="text-sm text-gray-500 mb-4">
              Simulate payment webhook resetting all provider quotas to 10.
            </p>
            <button
              onClick={resetQuota}
              disabled={loading !== null}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading === "reset" ? "Resetting..." : "Reset All Quotas"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Test Idempotency</h2>
            <p className="text-sm text-gray-500 mb-4">
              Call webhook 5 times with same key — quota resets only once.
            </p>
            <button
              onClick={testIdempotency}
              disabled={loading !== null}
              className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading === "idempotency" ? "Testing..." : "Test Idempotency"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Concurrent Leads</h2>
            <p className="text-sm text-gray-500 mb-4">
              Generate 10 leads simultaneously to test concurrency handling.
            </p>
            <button
              onClick={generateConcurrentLeads}
              disabled={loading !== null}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading === "concurrent" ? "Generating..." : "Generate 10 Leads"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Activity Log</h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
          <div className="bg-gray-950 rounded-lg p-4 h-64 overflow-y-auto font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Run a test to see logs here...
              </p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className="text-green-400 text-xs mb-1">
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