"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) setMessage(error.message);
    setLoading(false);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isPasswordMode) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/admin"; // Redirect on success
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback",
        },
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Check your email for the magic link!");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full text-center">
        <h2 className="text-3xl font-extrabold text-red-600 mb-8 tracking-tighter">Login to BANALATA</h2>
        
        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-200 hover:border-red-400 text-gray-700 font-bold py-3 px-4 rounded-xl mb-6 transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Login with Google
        </button>

        <div className="relative my-8 text-gray-400">
          <hr className="border-gray-200" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-black uppercase">
            OR USE EMAIL
          </span>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-zinc-100 p-1 rounded-xl mb-6 border border-zinc-200">
          <button 
            onClick={() => setIsPasswordMode(false)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!isPasswordMode ? 'bg-white shadow-sm text-red-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >✨ Magic Link</button>
          <button 
            onClick={() => setIsPasswordMode(true)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${isPasswordMode ? 'bg-white shadow-sm text-red-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >🔑 Password</button>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 border-2 border-zinc-100 rounded-xl focus:border-red-400 outline-none transition-all font-bold placeholder:text-zinc-300"
          />
          
          {isPasswordMode && (
             <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-4 border-2 border-zinc-100 rounded-xl focus:border-red-400 outline-none transition-all font-bold placeholder:text-zinc-300 animate-in fade-in slide-in-from-top-2"
             />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {loading ? "AUTHENTICATING..." : isPasswordMode ? "LOGIN WITH PASSWORD" : "SEND MAGIC LINK"}
          </button>
        </form>

        {message && (
          <p className="mt-6 text-sm font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
