
"use client";

import Link from "next/link";
import { signOut } from "@/lib/auth-client";

export default function AdminDashboardPage() {
  async function handleLogout() {
    try {
      await signOut();
    } finally {
      window.location.replace("/admin/login");
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
          DineDesk Management
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-900">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Manage your restaurant orders and reservations in one place.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Link
            href="/admin/orders"
            className="rounded-2xl bg-white p-7 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900">
              Food Orders
            </h2>
            <p className="mt-2 text-gray-600">
              View customer orders and update order status.
            </p>
            <span className="mt-5 inline-block font-semibold text-orange-600">
              Manage Orders →
            </span>
          </Link>

          <Link
            href="/admin/reservations"
            className="rounded-2xl bg-white p-7 shadow transition hover:shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900">
              Reservations
            </h2>
            <p className="mt-2 text-gray-600">
              View bookings and manage reservation status.
            </p>
            <span className="mt-5 inline-block font-semibold text-orange-600">
              Manage Reservations →
            </span>
          </Link>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
          >
            Logout
          </button>

          <Link
            href="/"
            className="ml-4 font-semibold text-orange-700 hover:underline"
          >
            Back to Website
          </Link>
        </div>
      </div>
    </main>
  );
}
