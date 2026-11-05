
import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f1] px-5 py-12">
      <div className="w-full max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
            <span className="text-orange-600">Dine</span>Desk
            <span className="text-orange-500">.</span>
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Welcome to DineDesk!
          </p>

          <p className="mt-2 text-gray-500">
            Your perfect dining experience starts here.
          </p>
        </div>

        <div className="mt-12 grid gap-7 md:grid-cols-2">
          <section className="rounded-3xl border border-orange-100 bg-white p-8 shadow-lg">
            <div className="text-5xl">🛡️</div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Admin
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              Manage customer orders, restaurant reservations, and their
              statuses from one dashboard.
            </p>

            <Link
              href="/admin/login"
              className="mt-7 block rounded-xl bg-orange-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-orange-700"
            >
              Admin Login
            </Link>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white p-8 shadow-lg">
            <div className="text-5xl">🍽️</div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Customer
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              Discover restaurants, explore the menu, place food orders,
              and reserve your favourite table.
            </p>

            <Link
              href="/login"
              className="mt-7 block rounded-xl border border-orange-600 px-5 py-3 text-center font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Customer Login
            </Link>

            <Link
              href="/signup"
              className="mt-3 block rounded-xl bg-orange-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-orange-700"
            >
              Create Customer Account
            </Link>
          </section>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          © 2026 DineDesk · Discover your table. Enjoy your moment.
        </p>
      </div>
    </main>
  );
}
