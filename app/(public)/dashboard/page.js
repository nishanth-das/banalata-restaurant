"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchUserCoupons } from "@/lib/coupon";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadCoupons(session.user.id);
      } else {
        setLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadCoupons(session.user.id);
      } else {
        setCoupons([]);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadCoupons = async (userId) => {
    setLoading(true);
    try {
      const data = await fetchUserCoupons(userId);
      setCoupons(data || []);
    } catch (error) {
      console.error("Error loading coupons:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[80vh]">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-4 border-dashed border-red-100 max-w-sm text-center">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🔒
          </div>
          <h2 className="text-2xl font-black text-zinc-800 mb-4 tracking-tight">Login Required</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Please login to view your earned coupons.
          </p>
          <Link 
            href="/login"
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            LOGIN TO CONTINUE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-zinc-800 tracking-tight">
            My <span className="text-red-600 underline decoration-yellow-400">Coupons</span>
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Manage and view your rewards from BANALATA.</p>
        </header>

        {coupons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coupons.map((coupon) => (
              <div 
                key={coupon.id} 
                className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-zinc-100 flex flex-col group overflow-hidden"
              >
                {/* Voucher Top Part */}
                <div className="p-8 border-b-4 border-dashed border-zinc-100 relative">
                   {/* Left Hole Punch */}
                   <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-zinc-50 rounded-full border-2 border-zinc-100"></div>
                   {/* Right Hole Punch */}
                   <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-zinc-50 rounded-full border-2 border-zinc-100"></div>
                   
                   <div className="flex justify-between items-start mb-6">
                        <span className="bg-zinc-900 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em]">
                            BANALATA REWARD
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic leading-none">
                            Source: {coupon.source}
                        </span>
                   </div>
                   
                   <div className="text-center py-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-2 leading-none">Code</p>
                        <h3 className="text-5xl font-black text-red-600 tracking-tighter italic">
                          {coupon.coupon_code}
                        </h3>
                   </div>
                </div>

                {/* Voucher Bottom Part */}
                <div className="p-8 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shadow-sm ${coupon.is_redeemed ? 'bg-zinc-300' : 'bg-green-500 animate-pulse'}`}></div>
                        <span className={`text-xs font-black uppercase tracking-widest ${coupon.is_redeemed ? 'text-zinc-400' : 'text-green-600 italic'}`}>
                            {coupon.is_redeemed ? 'Redeemed' : 'Ready to use'}
                        </span>
                    </div>
                    
                    {!coupon.is_redeemed && (
                        <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-2">
                           <span>VALID AT OUTLET</span>
                           <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                           <span>SCAN AT COUNTER</span>
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[3rem] text-center shadow-sm border border-dashed border-zinc-200">
            <div className="text-5xl mb-6">🏜️</div>
            <h2 className="text-2xl font-black text-zinc-800 mb-4">No coupons yet</h2>
            <p className="text-zinc-500 max-w-sm mx-auto mb-10">
              You haven't earned any rewards yet. Start playing or share your experience to get a free coupon!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/game" className="bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 px-8 rounded-2xl shadow-md transition-all active:scale-95">
                    🕹️ PLAY GAME
                </Link>
                <Link href="/" className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl shadow-md transition-all active:scale-95">
                    ⭐ GIVE REVIEW
                </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
