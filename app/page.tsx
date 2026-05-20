import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Workload Distribution System
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Production-grade lead distribution platform with fair allocation,
          real-time updates, and concurrency safety.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/request-service">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <div className="text-3xl mb-3">📋</div>
              <h2 className="font-semibold text-gray-900 mb-1">
                Request Service
              </h2>
              <p className="text-sm text-gray-500">
                Submit a new service request
              </p>
            </div>
          </Link>

          <Link href="/dashboard">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <div className="text-3xl mb-3">📊</div>
              <h2 className="font-semibold text-gray-900 mb-1">Dashboard</h2>
              <p className="text-sm text-gray-500">
                Real-time provider overview
              </p>
            </div>
          </Link>

          <Link href="/test-tools">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <div className="text-3xl mb-3">🧪</div>
              <h2 className="font-semibold text-gray-900 mb-1">Test Tools</h2>
              <p className="text-sm text-gray-500">
                Test concurrency and webhooks
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}