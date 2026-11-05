"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";

const restaurants = [
  {
    name: "The Golden Fork",
    cuisine: "Italian · Continental",
    rating: "4.8",
    time: "20–30 min",
    price: "₹800 for two",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    tag: "Popular",
  },
  {
    name: "Spice Garden",
    cuisine: "Indian · South Indian",
    rating: "4.7",
    time: "15–25 min",
    price: "₹500 for two",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
    tag: "Top rated",
  },
  {
    name: "Urban Bistro",
    cuisine: "Cafe · Burgers · Pizza",
    rating: "4.6",
    time: "25–35 min",
    price: "₹650 for two",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
    tag: "Trending",
  },
];

const categories = [
  { icon: "🍕", name: "Pizza" },
  { icon: "🍔", name: "Burgers" },
  { icon: "🍛", name: "Indian" },
  { icon: "🍜", name: "Asian" },
  { icon: "🥗", name: "Healthy" },
  { icon: "☕", name: "Cafe" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const customerName = session?.user?.name;
  const [selectedCategory, setSelectedCategory] = useState("");

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = `${restaurant.name} ${restaurant.cuisine}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "" ||
      restaurant.cuisine.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#fffdf9] text-[#24221f]">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
          <a href="#" className="text-2xl font-black tracking-tight">
            <span className="text-orange-600">Dine</span>Desk
            <span className="text-orange-500">.</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#restaurants" className="hover:text-orange-600">
              Explore
            </a>
            <a href="#categories" className="hover:text-orange-600">
              Cuisines
            </a>
            <a href="#about" className="hover:text-orange-600">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            {customerName ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-800">
                  Welcome, {customerName}
                </span>

                <button
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/";
                  }}
                  className="rounded-full border border-orange-500 px-5 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  Log out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-orange-50 sm:block"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-[#fff1e6]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24 lg:px-10">
          <div>
            <span className="inline-block rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700">
              ✨ Your next favourite meal awaits
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Discover places.
              <br />
              <span className="text-orange-600">Reserve moments.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">
              Find amazing restaurants, explore delicious cuisines, and book
              your perfect table — all in one place.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("restaurants")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg sm:flex-row"
            >
              <input
                type="search"
                placeholder="Restaurant or cuisine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
              >
                Explore now
              </button>
            </form>

            <div className="mt-7 flex flex-wrap gap-5 text-sm text-gray-600">
              <span>✓ Easy discovery</span>
              <span>✓ Simple booking</span>
              <span>✓ Great experiences</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-orange-200/50 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1100&q=85"
              alt="Beautiful restaurant dining experience"
              className="relative h-[320px] w-full rounded-[2rem] object-cover shadow-xl sm:h-[420px]"
            />
            <div className="absolute bottom-5 left-5 rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-sm text-gray-500">Make it memorable</p>
              <p className="mt-1 font-bold">Your table is waiting 🍽️</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="categories"
        className="mx-auto max-w-7xl px-5 py-14 lg:px-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
              Find your flavour
            </p>
            <h2 className="mt-2 text-3xl font-black">Explore by category</h2>
          </div>
          <a
            href="#restaurants"
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            View restaurants →
          </a>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => {
                setSelectedCategory(
                  selectedCategory === category.name ? "" : category.name
                );
                document.getElementById("restaurants")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className={`rounded-2xl border p-5 text-center transition hover:-translate-y-1 hover:shadow-md ${
                selectedCategory === category.name
                  ? "border-orange-500 bg-orange-100"
                  : "border-orange-100 bg-white hover:border-orange-300"
              }`}
            >
              <span className="text-3xl">{category.icon}</span>
              <p className="mt-3 text-sm font-bold">{category.name}</p>
            </button>
          ))}
        </div>
      </section>

      <section
        id="restaurants"
        className="bg-[#f8f6f2] px-5 py-14 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
            Handpicked for you
          </p>
          <h2 className="mt-2 text-3xl font-black">Restaurants to discover</h2>

          {(selectedCategory !== "" || search !== "") && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setSearch("");
              }}
              className="mt-4 rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Show all restaurants
            </button>
          )}

          <p className="mt-3 text-gray-600">
            Find your next favourite spot for lunch, dinner, or a special
            occasion.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <article
                key={restaurant.name}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="h-56 w-full object-cover"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-orange-700 shadow">
                    {restaurant.tag}
                  </span>
                  <span className="absolute bottom-4 right-4 rounded-lg bg-white px-3 py-1.5 text-sm font-bold shadow">
                    ★ {restaurant.rating}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold">{restaurant.name}</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {restaurant.cuisine}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2 text-sm text-gray-600">
                    <span>◷ {restaurant.time}</span>
                    <span>{restaurant.price}</span>
                  </div>

                  <a
                    href={`/reservation?restaurant=${encodeURIComponent(restaurant.name)}`}
                    className="mt-5 block rounded-xl bg-orange-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-orange-700"
                  >
                    Reserve a table
                  </a>
                </div>
              </article>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <p className="mt-6 text-center text-gray-600">
              No restaurants found. Try another name or cuisine.
            </p>
          )}

          <p className="mt-5 text-xs text-gray-500">
            Sample restaurant listings for the homepage demonstration.
          </p>
        </div>
      </section>

      <section id="about" className="px-5 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-orange-600">
          Good food, great memories
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black sm:text-4xl">
          Your dining experience starts with DineDesk.
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
          Explore restaurants, discover new flavours, and plan your next meal
          with ease.
        </p>
      </section>

      <footer className="bg-[#24221f] px-5 py-8 text-center text-sm text-gray-300">
        <p className="text-xl font-black text-white">
          <span className="text-orange-400">Dine</span>Desk.
        </p>
        <p className="mt-3">Discover your table. Enjoy your moment.</p>
        <p className="mt-5 text-gray-500">
          © 2026 DineDesk. Built for food lovers.
        </p>
      </footer>
    </main>
  );
}