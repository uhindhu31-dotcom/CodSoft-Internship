
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <nav className="flex items-center justify-between bg-white px-8 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-700">
          EduManage
        </h1>

        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Login
        </Link>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="mb-4 font-semibold text-blue-600">
          STUDENT MANAGEMENT SYSTEM
        </p>

        <h2 className="text-4xl font-bold text-slate-900 md:text-6xl">
          Manage Education,
          <br />
          Simplify Everything.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          A single platform to manage students, teachers, attendance,
          examinations, fees, and academic activities.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Get Started
          </Link>

          <a
            href="#features"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Explore Features
          </a>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3"
      >
        {[
          {
            title: "Student Management",
            description: "Manage student profiles and academic details.",
            icon: "🎓",
          },
          {
            title: "Attendance Tracking",
            description: "Record and monitor daily attendance.",
            icon: "📋",
          },
          {
            title: "Exams & Results",
            description: "Organize examinations and student marks.",
            icon: "📊",
          },
          {
            title: "Fee Management",
            description: "Track fee payments and pending balances.",
            icon: "💳",
          },
          {
            title: "Teacher Management",
            description: "Organize teacher profiles and subjects.",
            icon: "👩‍🏫",
          },
          {
            title: "Announcements",
            description: "Share important academic updates.",
            icon: "📢",
          },
        ].map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-3xl">{feature.icon}</div>
            <h3 className="mt-4 text-xl font-bold text-slate-800">
              {feature.title}
            </h3>
            <p className="mt-2 text-slate-600">
              {feature.description}
            </p>
          </article>
        ))}
      </section>

      <footer className="border-t bg-white py-6 text-center text-sm text-slate-500">
        © 2026 EduManage. Student Management System.
      </footer>
    </main>
  );
}
