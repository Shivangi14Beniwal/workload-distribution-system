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

    // Setup SSE for real-time updates
    const es = new EventSource("/api/sse");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      if (event.data === "update" || event.data === "connected") {
        fetchData();
      }
    };

    es.onerror = () => {
      setConnected(false);
      // Fallback polling every 5 seconds
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    };

    return () => {
      es.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Provider Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time lead distribution overview
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-sm text-gray-500">
                {connected ? "Live" : "Polling"}
              </span>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Providers</p>
            <p className="text-2xl font-bold text-gray-900">
              {providers.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-2xl font-bold text-blue-600">
              {providers.reduce((sum, p) => sum + p.leadsThisMonth, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Full Quota</p>
            <p className="text-2xl font-bold text-red-500">
              {providers.filter((p) => p.remainingQuota === 0).length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-green-600">
              {providers.filter((p) => p.remainingQuota > 0).length}
            </p>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Provider Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    {provider.name}
                  </h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      provider.remainingQuota === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {provider.remainingQuota === 0 ? "Full" : "Available"}
                  </span>
                </div>

                {/* Quota Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{provider.leadsThisMonth} leads</span>
                    <span>{provider.remainingQuota} remaining</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (provider.leadsThisMonth / provider.monthlyQuota) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Leads List */}
              <div className="p-4">
                {provider.leads.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No leads yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {provider.leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-start justify-between text-sm border border-gray-100 rounded-lg p-2"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {lead.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {lead.service} • {lead.city}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            lead.assignmentType === "MANDATORY"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {lead.assignmentType === "MANDATORY" ? "M" : "R"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}