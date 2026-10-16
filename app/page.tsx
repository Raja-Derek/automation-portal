// Halaman utama (Server Component).
// Merender AutomationPortal yang merupakan Client Component
// karena memakai hooks + localStorage.

import AutomationPortal from "@/components/AutomationPortal";

export default function Home() {
  return <AutomationPortal />;
}
