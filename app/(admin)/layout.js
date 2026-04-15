"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { ADMIN_EMAILS } from "@/lib/admins";

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
        setIsAdmin(true);
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-zinc-50 font-black text-red-600 animate-pulse uppercase tracking-[0.3em]">Authenticating...</div>;
  }

  // If NOT Admin, don't show the Sidebar and Header!
  if (!isAdmin) {
    return <div className="min-h-screen bg-white flex flex-col">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <AdminHeader />
        <main className="p-12 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
