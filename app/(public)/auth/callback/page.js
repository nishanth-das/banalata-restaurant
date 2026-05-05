"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[Auth Callback] Auth Error:", error.message);
        window.location.href = "/login?error=" + encodeURIComponent(error.message);
        return;
      }
      
      const checkProfileAndRedirect = async (session) => {
        // Wait a tiny bit for the database trigger to create the profile row if it's a new signup
        await new Promise(res => setTimeout(res, 500));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number')
          .eq('id', session.user.id)
          .single();

        if (!profile?.phone_number) {
          window.location.href = "/onboarding";
        } else {
          window.location.href = "/";
        }
      };

      if (data?.session) {
        await checkProfileAndRedirect(data.session);
      } else {
        // Small delay to allow Supabase internals to catch up
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData?.session) {
            await checkProfileAndRedirect(retryData.session);
          } else {
            window.location.href = "/";
          }
        }, 1500);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      <p className="mt-4 text-gray-600 font-medium tracking-wide">Finalizing your login...</p>
    </div>
  );
}
