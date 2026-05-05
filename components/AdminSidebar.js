"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Menu Management", href: "/admin?tab=menu", icon: "🥘" },
    { name: "Coupon Tracker", href: "/admin?tab=coupons", icon: "🎟️" },
    { name: "Customer CRM", href: "/admin?tab=customers", icon: "👥" },
    { name: "Gallery Moderation", href: "/admin?tab=gallery", icon: "📸" },
    { name: "Settings", href: "#", icon: "⚙️", disabled: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-red-600 min-h-screen text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand Logo Area */}
      <div className="p-8 border-b border-red-500 bg-red-700/30">
        <Link href="/" className="flex flex-col items-center gap-3 group">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
          <div className="text-center">
            <h1 className="text-xl font-black tracking-tighter leading-none">ADMIN</h1>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Command Center</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-grow py-8 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsOpen && setIsOpen(false)}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group ${
              pathname === item.href || (item.name === "Dashboard" && pathname === "/admin")
                ? "bg-yellow-400 text-red-600 shadow-xl scale-105"
                : item.disabled 
                  ? "opacity-40 cursor-not-allowed" 
                  : "hover:bg-red-500 hover:translate-x-2"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="uppercase tracking-widest">{item.name}</span>
            {item.disabled && <span className="ml-auto text-[8px] bg-red-800 px-2 py-1 rounded-md">SOON</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-6 mt-auto border-t border-red-500">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/10"
        >
          🚪 LOGOUT EXIT
        </button>
      </div>

      {/* Decorative Accent */}
      <div className="absolute top-0 right-0 w-1 h-full bg-yellow-400/30"></div>
    </aside>
    </>
  );
}
