import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workload Distribution System",
  description: "Production-grade lead distribution platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-bold text-gray-900 text-lg">
              WorkloadDS
            </span>
            <div className="flex gap-6">
              <Link
                href="/request-service"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Request Service
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/test-tools"
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Test Tools
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}