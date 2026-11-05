
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReservationPage() {
  const searchParams = useSearchParams();

  const [restaurant, setRestaurant] = useState("The Golden Fork");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const selectedRestaurant = searchParams.get("restaurant");

    if (selectedRestaurant) {
      setRestaurant(selectedRestaurant);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant,
          date,
          time,
          guests: Number(guests),
          customerName: name,
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save reservation.");
      }

      setIsSuccess(true);
      setMessage(
        `Thank you, ${name}! Your reservation request for ${restaurant} on ${date} at ${time} for ${guests} guest(s) has been saved successfully.`
      );

      setDate("");
      setTime("19:00");
      setGuests("2");
      setName("");
      setEmail("");
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-5 py-12 text-[#24221f]">
      <div className="mx-auto max-w-2xl">
        <a
          href="/"
          className="font-semibold text-orange-600 hover:underline"
        >
          ← Back to DineDesk
        </a>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-lg sm:p-10">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            Your dining experience
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Reserve your table
          </h1>

          <p className="mt-3 text-gray-600">
            Choose your restaurant, date, time, and guest details.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block font-semibold">
                Restaurant
              </label>
              <select
                required
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
              >
                <option>The Golden Fork</option>
                <option>Spice Garden</option>
                <option>Urban Bistro</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Reservation date
              </label>
              <input
                type="date"
                required
                min={new Date().toLocaleDateString("en-CA")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold">
                  Reservation time
                </label>
                <select
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
                >
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="21:00">9:00 PM</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Number of guests
                </label>
                
<select
  value={guests}
  onChange={(e) => setGuests(e.target.value)}
  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
>
  {Array.from({ length: 50 }, (_, i) => i + 1).map((guest) => (
    <option key={guest} value={String(guest)}>
      {guest} {guest === 1 ? "guest" : "guests"}
    </option>
  ))}
</select>

              </div>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Your name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving reservation..." : "Request reservation"}
            </button>
          </form>

          {message && (
            <div
              role="status"
              className={`mt-6 rounded-xl border p-4 text-sm leading-6 ${
                isSuccess
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
