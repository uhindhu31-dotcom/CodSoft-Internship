
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ReservationsDashboard from "./ReservationsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session.user.email.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    redirect("/");
  }

  return <ReservationsDashboard />;
}
