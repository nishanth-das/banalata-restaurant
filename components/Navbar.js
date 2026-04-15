"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) setSession(currentSession);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "Gallery", href: "/gallery" },
    { name: "Play Game 🎮", href: "/game" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-100 shadow-lg">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center relative z-20">
        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="transition-transform hover:scale-105 active:scale-95">
          <img 
            src="/logo.png" 
            alt="Banalata Logo" 
            className="h-14 md:h-20 w-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.insertAdjacentHTML('afterend', '<span class="text-2xl font-black tracking-tighter text-red-600">BANALATA</span>');
            }}
          />
        </Link>

        {/* 📱 MOBILE HAMBURGER BUTTON 📱 */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-zinc-900 focus:outline-none"
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <span className={`w-full h-0.5 bg-current transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-full h-0.5 bg-current transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-full h-0.5 bg-current transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>

        {/* 💻 DESKTOP NAV 💻 */}
        <div className="hidden md:flex items-center gap-8 font-bold text-sm uppercase tracking-widest text-zinc-800">
          {navLinks.map(link => (
            <Link key={link.name} href={link.href} className="hover:text-red-600 transition-colors uppercase tracking-widest leading-none">
              {link.name}
            </Link>
          ))}
          
          {session ? (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="hover:text-red-600 transition-colors font-black">
                My Rewards
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-lg active:scale-95"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-2.5 rounded-xl font-black transition-all shadow-md active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* 📱 MOBILE NAV DRAWER 📱 */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b shadow-2xl transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[80vh] opacity-100 py-8' : 'max-h-0 opacity-0 py-0'}`}>
        <div className="flex flex-col items-center gap-6 px-4">
          {navLinks.map(link => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xl font-black text-zinc-900 uppercase tracking-tighter hover:text-red-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="w-full h-px bg-zinc-100 my-2"></div>

          {session ? (
            <div className="flex flex-col items-center gap-6 w-full">
              <Link 
                href="/dashboard" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl font-black text-zinc-900 uppercase tracking-tighter"
              >
                My Rewards 🎟️
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-xl"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-yellow-400 text-black text-center py-5 rounded-2xl font-black shadow-xl"
            >
              LOGIN / JOIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
