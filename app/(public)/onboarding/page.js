"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OnboardingPage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ full_name: "", phone_number: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      
      setUser(session.user);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          phone_number: profile.phone_number || ""
        });
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (formData.phone_number.length < 10) {
      setMessage("Please enter a valid phone number.");
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          phone_number: formData.phone_number
        });

      if (error) throw error;
      
      const returnTo = localStorage.getItem('returnTo');
      if (returnTo) {
        localStorage.removeItem('returnTo');
        window.location.href = returnTo;
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setMessage("Error saving profile: " + err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-20 px-4 bg-zinc-50 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl border-4 border-yellow-100 max-w-lg w-full relative z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] mb-4 block">Almost There</span>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter leading-none mb-4">
            Complete your <span className="text-red-600 italic">Profile</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm">We need a tiny bit more info to send you your rewards and updates!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full p-5 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-yellow-400 focus:bg-white outline-none transition-all font-bold"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Phone Number (For Rewards)</label>
            <input 
              type="tel" 
              required
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              className="w-full p-5 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-yellow-400 focus:bg-white outline-none transition-all font-bold"
              placeholder="+91 9876543210"
            />
          </div>

          {message && (
            <div className="p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center bg-red-50 text-red-500">
               {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 active:scale-95 text-sm uppercase tracking-widest mt-8"
          >
            {saving ? "Saving..." : "Save & Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
