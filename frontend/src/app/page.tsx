import { redirect } from "next/navigation";

export default function RootPage() {
  // Simple redirect to the app shell
  redirect("/dashboard");
}
