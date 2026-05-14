"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiGrid, FiUsers, FiTruck, FiClipboard, 
  FiBook, FiCreditCard, FiSettings, FiStar 
} from "react-icons/fi";

const NAV = [
  { href: "/provider/dashboard",    icon: <FiGrid />,        label: "Dashboard" },
  { href: "/provider/customers",    icon: <FiUsers />,       label: "Customers" },
  { href: "/provider/deliveries",   icon: <FiTruck />,       label: "Deliveries" },
  { href: "/provider/menu",         icon: <FiClipboard />,   label: "Menu" },
  { href: "/provider/history",      icon: <FiBook />,        label: "Ledger" },
  { href: "/provider/billing",      icon: <FiCreditCard />,  label: "Billing" },
  { href: "/provider/settings",     icon: <FiSettings />,    label: "Settings" },
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
        <FiStar />
        Subscription
      </Link>
    </div>
  );
}
