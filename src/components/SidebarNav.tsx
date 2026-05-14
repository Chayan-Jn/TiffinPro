"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LuLayoutDashboard, LuUsers, LuTruck, LuClipboardList, 
  LuBookOpen, LuCreditCard, LuSettings, LuStar 
} from "react-icons/lu";

const NAV = [
  { href: "/provider/dashboard",    icon: <LuLayoutDashboard />, label: "Dashboard" },
  { href: "/provider/customers",    icon: <LuUsers />,           label: "Customers" },
  { href: "/provider/deliveries",   icon: <LuTruck />,           label: "Deliveries" },
  { href: "/provider/menu",         icon: <LuClipboardList />,    label: "Menu" },
  { href: "/provider/history",      icon: <LuBookOpen />,        label: "Ledger" },
  { href: "/provider/billing",      icon: <LuCreditCard />,      label: "Billing" },
  { href: "/provider/settings",     icon: <LuSettings />,        label: "Settings" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <div style={{ padding: "0.75rem 0", flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <div className="sidebar-section">Management</div>
      {NAV.map(n => {
        const isActive = pathname === n.href;
        return (
          <Link 
            key={n.href} 
            href={n.href} 
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            {n.icon}
            {n.label}
          </Link>
        );
      })}
      
      <div className="sidebar-section" style={{ marginTop: "1.5rem" }}>Account</div>
      <Link 
        href="/provider/subscription" 
        className={`nav-item special ${pathname === "/provider/subscription" ? "active" : ""}`}
      >
        <LuStar />
        Subscription
      </Link>
    </div>
  );
}
