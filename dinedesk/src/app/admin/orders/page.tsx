
"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  foodName: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  customerName: string;
  email: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

const statuses = [
  "PENDING",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/orders");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load orders.");
        }

        setOrders(data.orders);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  async function updateStatus(orderId: number, status: string) {
    setUpdatingId(orderId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
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

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: data.order.status }
            : order
        )
      );

      setMessage(`Order #${orderId} status updated to ${status}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Food Orders
        </h1>

        <p className="mt-2 text-gray-600">
          View and manage customer orders.
        </p>

        {message && (
          <p className="mt-5 rounded-lg bg-green-100 p-3 text-green-800">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-gray-600">Loading orders...</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="mt-8 rounded-lg bg-white p-6 text-gray-600">
            No orders found.
          </p>
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-8 space-y-5">
            {orders.map((order) => (
              <section
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Order #{order.id}
                    </h2>
                    <p className="mt-1 text-gray-600">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.email}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-2xl font-bold text-green-700">
                      ₹{order.total.toFixed(2)}
                    </p>

                    <span className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-800">
                    Ordered Items
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between gap-4 text-gray-600"
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
                </div>

                <div className="mt-5 border-t border-gray-200 pt-4">
                  <label
                    htmlFor={`status-${order.id}`}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Update Order Status
                  </label>

                  <select
                    id={`status-${order.id}`}
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(event) =>
                      updateStatus(order.id, event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 sm:w-64"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {updatingId === order.id && (
                    <p className="mt-2 text-sm text-gray-500">
                      Updating status...
                    </p>
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Ordered on:{" "}
                  {new Date(order.createdAt).toLocaleString("en-IN")}
                </p>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
