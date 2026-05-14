"use client";

import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // This component will also toggle the 'open' class on the sidebar
  const toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open");
      setOpen(!open);
    }
  };

  return (
    <div className="mobile-header">
      <Link href="/provider/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div style={{ width: 32, height: 32, background: "var(--brand)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LuUtensils style={{ color: "#fff", fontSize: "1rem" }} />
        </div>
        <span style={{ fontWeight: 900, fontSize: "1rem", color: "#fff", letterSpacing: "-0.04em" }}>TiffinPro</span>
      </Link>

      <button 
        onClick={toggleSidebar}
        style={{ 
          width: 40, height: 40, borderRadius: 10, background: "var(--s2)", 
          border: "1px solid var(--bd)", color: "var(--t1)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem"
        }}
      >
        {open ? <FiX /> : <FiMenu />}
      </button>
    </div>
  );
}
