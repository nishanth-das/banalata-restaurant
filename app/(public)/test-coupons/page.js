"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateCouponCode, saveCoupon, fetchUserCoupons } from "@/lib/coupon";
import Link from "next/link";

export default function TestCouponsPage() {
  const [session, setSession] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Get Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadData(session.user.id);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadData(session.user.id);
      } else {
        setCoupons([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (userId) => {
    try {
      setLoading(true);
      const data = await fetchUserCoupons(userId);
      setCoupons(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoupon = async () => {
    if (!session) {
      setError("You must be logged in to generate a coupon!");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const newCode = generateCouponCode();
      const savedCoupon = await saveCoupon(session.user.id, newCode, 'game');
      setCoupons([savedCoupon, ...coupons]);
    } catch (err) {
      setError(err.message + " (Did you run the SQL in Supabase yet?)");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">Please log in to test the Coupon System.</p>
        <Link href="/login" className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-50">
        <h2 className="text-3xl font-extrabold text-red-600 mb-6">Coupon System Test</h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          This is a temporary page to verify that the **Supabase Database** integration works. 
          Make sure you have run the SQL commands from `supabase/schema.sql`.
        </p>

        <button
          onClick={handleGenerateCoupon}
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold py-4 rounded-xl shadow-lg mb-8 transition-transform transform active:scale-95 disabled:opacity-50"
        >
          {loading ? "Processing..." : "🎟️ Generate Test Coupon"}
        </button>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-4 mb-8">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-yellow-400 pb-2">
            Your Generated Coupons
          </h3>
          
          {coupons.length === 0 ? (
            <p className="text-gray-400 italic">No coupons found. Generate your first one above!</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {coupons.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-5 bg-zinc-50 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-mono font-bold text-red-600 text-lg">{c.coupon_code}</p>
                    <p className="text-xs text-gray-400">Source: <span className="uppercase">{c.source}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase leading-none block mb-1">Created At</span>
                    <span className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
