
"use client";

import { useState } from "react";

const foods = [
  {
    id: 1,
    name: "Classic Burger",
    category: "Burgers",
    price: 199,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  },
  {
    id: 2,
    name: "Cheese Pizza",
    category: "Pizza",
    price: 299,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
  },
  {
    id: 3,
    name: "Creamy Pasta",
    category: "Pasta",
    price: 249,
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800",
  },
  {
    id: 4,
    name: "French Fries",
    category: "Sides",
    price: 99,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800",
  },
  {
    id: 5,
    name: "Veg Sandwich",
    category: "Sides",
    price: 149,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
  },
  {
    id: 6,
    name: "Chocolate Cake",
    category: "Desserts",
    price: 129,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
  },
];

const categories = ["All", "Burgers", "Pizza", "Pasta", "Sides", "Desserts"];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredFoods =
    selectedCategory === "All"
      ? foods
      : foods.filter((food) => food.category === selectedCategory);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const total = foods.reduce(
    (sum, food) => sum + food.price * (cart[food.id] || 0),
    0
  );

  function addToCart(id: number) {
    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  }

  async function placeOrder() {
    setMessage("");

    if (cartCount === 0) {
      setMessage("Please add food items to your cart.");
      return;
    }

    if (!customerName.trim() || !email.trim()) {
      setMessage("Please enter your name and email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const items = foods
        .filter((food) => cart[food.id])
        .map((food) => ({
          foodName: food.name,
          price: food.price,
          quantity: cart[food.id],
        }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          email: email.trim(),
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Unable to place your order.");
        return;
      }

      setMessage(`Order placed successfully! Order ID: ${result.order.id}`);
      setCart({});
      setCustomerName("");
      setEmail("");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-orange-50 px-5 py-10 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-orange-600">DINEDESK</p>
            <h1 className="mt-2 text-4xl font-black">Our Food Menu</h1>
            <p className="mt-2 text-gray-600">
              Delicious food, prepared fresh for you.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-3 shadow-sm">
            <p className="text-sm text-gray-500">Your Cart</p>
            <p className="text-xl font-bold">
              🛒 {cartCount} items · ₹{total}
            </p>
          </div>
        </header>

        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-5 py-2 font-semibold transition ${
                selectedCategory === category
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-700 hover:bg-orange-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFoods.map((food) => (
            <article
              key={food.id}
              className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-48 overflow-hidden rounded-2xl bg-orange-100">
                <img
                  src={food.image}
                  alt={food.name}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />
              </div>

              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{food.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {food.category}
                  </p>
                </div>
                <p className="text-lg font-extrabold text-orange-600">
                  ₹{food.price}
                </p>
              </div>

              <button
                onClick={() => addToCart(food.id)}
                className="mt-5 w-full rounded-xl bg-orange-600 py-3 font-bold text-white hover:bg-orange-700"
              >
                + Add to Cart
                {cart[food.id] ? ` (${cart[food.id]})` : ""}
              </button>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Cart Summary</h2>

          {cartCount === 0 ? (
            <p className="mt-3 text-gray-500">
              Your cart is empty. Add some delicious food!
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {foods
                .filter((food) => cart[food.id])
                .map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between gap-3 border-b pb-3"
                  >
                    <div>
                      <p className="font-semibold">{food.name}</p>
                      <p className="text-sm text-gray-500">
                        ₹{food.price} × {cart[food.id]}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setCart((current) => {
                            const next = { ...current };
                            if (next[food.id] <= 1) {
                              delete next[food.id];
                            } else {
                              next[food.id] -= 1;
                            }
                            return next;
                          })
                        }
                        className="rounded-lg border px-3 py-1 font-bold"
                        aria-label={`Remove one ${food.name}`}
                      >
                        −
                      </button>

                      <span>{cart[food.id]}</span>

                      <button
                        onClick={() => addToCart(food.id)}
                        className="rounded-lg border px-3 py-1 font-bold"
                        aria-label={`Add one ${food.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-lg font-bold">Total</span>
            <span className="text-2xl font-black text-orange-600">
              ₹{total}
            </span>
          </div>

          {cartCount > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-bold">Customer Details</h3>

              <div>
                <label
                  htmlFor="customerName"
                  className="mb-1 block font-medium"
                >
                  Full Name *
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  maxLength={100}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block font-medium">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
                />
              </div>

              <button
                onClick={placeOrder}
                disabled={submitting}
                className="w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Placing Order..." : `Place Order · ₹${total}`}
              </button>
            </div>
          )}

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl bg-orange-50 p-3 font-medium text-gray-800"
            >
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
