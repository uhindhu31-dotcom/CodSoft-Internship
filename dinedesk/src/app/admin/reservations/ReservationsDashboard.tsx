
"use client";

import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-client";

type Reservation = {
  id: number;
  restaurant: string;
  date: string;
  time: string;
  guests: number;
  customerName: string;
  email: string;
  status: string;
  createdAt: string;
};

export default function ReservationsDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function loadReservations() {
    try {
      const response = await fetch("/api/reservations");

      if (!response.ok) {
        throw new Error("Could not load reservations.");
      }

      const data = await response.json();
      setReservations(data.reservations);
      setError("");
    } catch {
      setError("Unable to load reservations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    setMessage("");

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status.");
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id
            ? { ...reservation, status: data.reservation.status }
            : reservation
        )
      );

      setMessage(`Reservation ${id} updated to ${status}.`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function statusStyle(status: string) {
    if (status === "CONFIRMED") {
      return "bg-green-100 text-green-800";
    }

    if (status === "CANCELLED") {
      return "bg-red-100 text-red-800";
    }

    return "bg-amber-100 text-amber-800";
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-5 py-10 text-[#24221f]">
      <div className="mx-auto max-w-6xl">
        <a
          href="/"
          className="font-semibold text-orange-600 hover:underline"
        >
          ← Back to DineDesk
        </a>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            DineDesk Management
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Reservation Dashboard
          </h1>

          <p className="mt-3 text-gray-600">
            View and manage restaurant reservations.
          </p>

          <button
  onClick={async () => {
    await signOut();
    window.location.href = "/admin/login";
  }}
  className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
>
  Logout
</button>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total reservations</p>
          <p className="mt-2 text-3xl font-black text-orange-600">
            {loading ? "..." : reservations.length}
          </p>
        </div>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-white p-4 text-sm font-medium"
          >
            {message}
          </p>
        )}

        <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-xl font-bold">All Reservations</h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-600">Loading reservations...</p>
          ) : error ? (
            <p className="p-6 text-red-600">{error}</p>
          ) : reservations.length === 0 ? (
            <p className="p-6 text-gray-600">
              No reservations have been saved yet.
            </p>
          ) : (
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-orange-50 text-gray-700">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Guests</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {reservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-t border-gray-100"
                  >
                    <td className="p-4">
                      <p className="font-semibold">
                        {reservation.customerName}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {reservation.email}
                      </p>
                    </td>

                    <td className="p-4">{reservation.restaurant}</td>

                    <td className="p-4">
                      <p>{reservation.date}</p>
                      <p className="mt-1 text-gray-500">
                        {reservation.time}
                      </p>
                    </td>

                    <td className="p-4">{reservation.guests}</td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                          reservation.status
                        )}`}
                      >
                        {reservation.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        {reservation.status !== "CONFIRMED" &&
                          reservation.status !== "CANCELLED" && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatus(
                                    reservation.id,
                                    "CONFIRMED"
                                  )
                                }
                                disabled={updatingId !== null}
                                className="rounded-lg bg-green-600 px-3 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {updatingId === reservation.id
                                  ? "Updating..."
                                  : "Confirm"}
                              </button>

                              <button
                                onClick={() =>
                                  updateStatus(
                                    reservation.id,
                                    "CANCELLED"
                                  )
                                }
                                disabled={updatingId !== null}
                                className="rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                        {reservation.status === "CONFIRMED" && (
                          <span className="font-semibold text-green-700">
                            Confirmed
                          </span>
                        )}

                        {reservation.status === "CANCELLED" && (
                          <span className="font-semibold text-red-700">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
