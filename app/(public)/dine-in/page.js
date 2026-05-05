"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DineInLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if they are already logged in and have a phone number
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.phone_number) {
          // Already fully onboarded, go to menu
          router.push('/dine-in/menu');
          return;
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleLoginClick = () => {
    // Save the return intent so the auth callback and onboarding know where to go
    localStorage.setItem('returnTo', '/dine-in/menu');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-20 px-4 bg-zinc-50 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-400/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2"></div>
      
      <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl border-4 border-red-100 max-w-lg w-full relative z-10 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-8 shadow-inner">
          🍽️
        </div>
        
        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] mb-4 block">Welcome to Your Table</span>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none mb-6">
          Ready to <span className="text-yellow-500 italic">Order?</span>
        </h1>
        
        <p className="text-zinc-500 font-medium text-sm leading-relaxed mb-10">
          To view our exclusive dine-in menu and place your order, please log in briefly. We use this to bring the right food to the right person!
        </p>

        <button 
          onClick={handleLoginClick}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-xl hover:shadow-red-500/30 transition-all active:scale-95 text-sm uppercase tracking-widest flex items-center justify-center gap-3"
        >
          Login to View Menu <span className="text-lg leading-none">→</span>
        </button>
        
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-6">
          Quick & Secure via Google
        </p>
      </div>
    </div>
  );
}
