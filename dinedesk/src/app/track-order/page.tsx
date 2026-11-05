
"use client";

import { useState } from "react";

type Order = {
  id: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items: {
    foodName: string;
    quantity: number;
    price: number;
  }[];
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function trackOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to find your order.");
      }

      setOrder(data.order);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Track Your Order
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your Order ID and email to check your food order status.
          </p>

          <form onSubmit={trackOrder} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="orderId"
                className="mb-2 block font-medium text-gray-700"
              >
                Order ID
              </label>
              <input
                id="orderId"
                type="number"
                min="1"
                required
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Enter your Order ID"
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your order email"
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking Order..." : "Track Order"}
            </button>
          </form>

          {error && (
            <p className="mt-5 rounded-lg bg-red-100 p-3 text-red-700">
              {error}
            </p>
          )}

          {order && (
            <section className="mt-6 rounded-xl border border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-900">
                Order #{order.id}
              </h2>

              <p className="mt-2 text-gray-600">
                Customer: {order.customerName}
              </p>

              <p className="mt-4 text-sm font-medium text-gray-600">
                Current Status
              </p>

              <p className="mt-1 inline-block rounded-full bg-orange-100 px-4 py-2 font-bold text-orange-800">
                {order.status}
              </p>

              <h3 className="mt-5 font-semibold text-gray-800">
                Ordered Items
              </h3>

              <ul className="mt-3 space-y-2">
                {order.items.map((item, index) => (
                  <li
                    key={`${item.foodName}-${index}`}
                    className="flex justify-between gap-3 text-gray-600"
                  >
                    <span>
                      {item.foodName} × {item.quantity}
                    </span>
                    <span>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex justify-between border-t pt-4 font-bold text-gray-900">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Ordered on:{" "}
                {new Date(order.createdAt).toLocaleString("en-IN")}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
