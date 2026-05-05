"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminHeader({ setIsSidebarOpen }) {
  const pathname = usePathname();

  return (
    <header className="h-20 lg:h-24 bg-white border-b-4 border-yellow-400 flex items-center justify-between px-4 lg:px-12 shadow-sm relative z-10">
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Mobile Hamburger */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 bg-zinc-100 rounded-lg text-zinc-900 focus:outline-none"
        >
          <span className="block w-6 h-0.5 bg-current mb-1.5"></span>
          <span className="block w-6 h-0.5 bg-current mb-1.5"></span>
          <span className="block w-6 h-0.5 bg-current"></span>
        </button>

        <div className="hidden lg:block w-1.5 h-8 bg-red-600 rounded-full"></div>
        <div>
          <h2 className="text-xl font-black text-zinc-800 tracking-tight leading-none uppercase">
            {pathname === "/admin" ? "Dashboard Overview" : "Settings"}
          </h2>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Banalata Management</span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <Link 
          href="/" 
          className="hidden md:block bg-zinc-100 hover:bg-zinc-200 text-zinc-500 font-black text-[10px] px-6 py-3 rounded-xl uppercase tracking-widest transition-all active:scale-95 border-b-4 border-zinc-200"
        >
          🌐 View Website
        </Link>
        <div className="flex items-center gap-2 lg:gap-3 bg-red-50 px-3 py-2 lg:px-5 lg:py-3 rounded-2xl border-2 border-red-100 italic">
          <span className="text-lg">👑</span>
          <span className="text-sm font-black text-red-600">Admin Mode</span>
        </div>
      </div>
    </header>
  );
}
