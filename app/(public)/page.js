"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { claimRandomCouponFromPool, fetchUserCoupons } from "@/lib/coupon";
import ScratchCard from "@/components/ScratchCard";

export default function Home() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [rewardCode, setRewardCode] = useState(null);
  const [message, setMessage] = useState("");

  // Video State
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
      else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen();
      else if (videoRef.current.msRequestFullscreen) videoRef.current.msRequestFullscreen();
    }
  };

  const GOOGLE_REVIEW_URL = "https://g.page/r/CTaudV8wMFV0EAE/review"; // Placeholder, will guide user to update if needed

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleClaim = async () => {
    if (!user) {
      setMessage("Please login first to claim your reward.");
      return;
    }

    if (!file) {
      setMessage("Please upload a screenshot of your google review first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const existing = await fetchUserCoupons(user.id);
      const reviewCoupon = existing.find(c => c.source === 'review');

      if (reviewCoupon) {
        setRewardCode(reviewCoupon.coupon_code);
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('review-screenshots')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('review-screenshots')
        .getPublicUrl(filePath);

      // Claim from pool OR generate new with proof URL
      const claimedCoupon = await claimRandomCouponFromPool(user.id, 'review', publicUrl);
      if (claimedCoupon) {
        setRewardCode(claimedCoupon.coupon_code);
      } else {
        alert("Thanks for your review! We will send you a coupon soon.");
      }
      setMessage("Congratulations! Your review coupon is ready.");

    } catch (error) {
      console.error("Error claiming review coupon:", error.message);
      setMessage("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen selection:bg-red-200">
      {/* 🌟 PREMIUM HERO SECTION 🌟 */}
      <section className="relative min-h-[85vh] md:min-h-[95vh] flex flex-col justify-center text-center overflow-hidden pt-24 pb-16 bg-zinc-950">
        {/* Optimized Next.js Image Background */}
        <NextImage
          src="/images/hero.png"
          alt="Banalata Bengali Dhaba"
          fill
          priority
          className="object-cover z-0 scale-110 animate-subtle-zoom opacity-30"
          sizes="100vw"
        />

        {/* Dark Overlays to make video and text pop */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/80 z-10"></div>

        {/* Top links just under header */}
        <div className="absolute top-6 left-0 w-full z-30 px-4">
          <div className="container mx-auto flex flex-row justify-center gap-3 sm:gap-6 items-center text-[10px] sm:text-xs font-black tracking-widest uppercase">
            <a href="tel:+919862452313" className="text-white hover:text-yellow-400 transition-all flex items-center gap-1.5 sm:gap-2 group bg-white/15 backdrop-blur-md px-4 sm:px-6 py-2.5 rounded-full border border-white/40 hover:border-yellow-400 hover:bg-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <span className="group-hover:-rotate-12 transition-transform text-sm sm:text-base">🛵</span> 
              <span className="mt-0.5 drop-shadow-md">Delivery</span>
            </a>
            <Link href="/menu?type=party" className="text-white hover:text-red-400 transition-all flex items-center gap-1.5 sm:gap-2 group bg-white/15 backdrop-blur-md px-4 sm:px-6 py-2.5 rounded-full border border-white/40 hover:border-red-400 hover:bg-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <span className="group-hover:scale-110 transition-transform text-sm sm:text-base">🎉</span> 
              <span className="mt-0.5 drop-shadow-md">Events</span>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-20 flex-grow flex flex-col justify-center">

          {/* New Video Hero Layout */}
          <div className="max-w-4xl mx-auto mb-10 w-full">
            <h1 className="mb-8 text-center relative z-20">
              <span className="block text-xl sm:text-2xl md:text-3xl font-serif italic text-white font-medium tracking-wide drop-shadow-md mb-1 sm:mb-2">
                The Authentic Taste of
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl font-black relative inline-block tracking-tighter pb-1 sm:pb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                  Banalata
                </span>
                {/* Premium Glowing Tapered Underline */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110%] h-[4px] sm:h-[6px] bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>
              </span>
            </h1>
            
            {/* Premium Video Container */}
            <div className="relative w-full aspect-video rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(220,38,38,0.2)] border-2 sm:border-4 border-white/10 group bg-zinc-900">
               {/* Subtle glowing background behind video */}
               <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-yellow-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
               
               <video 
                 ref={videoRef}
                 autoPlay 
                 muted={isMuted}
                 loop 
                 playsInline 
                 poster="/images/v2/hero-poster.png"
                 className="relative z-10 w-full h-full object-cover"
                 onClick={togglePlay}
               >
                 {/* Banalata promotional video source */}
                 <source src="/videos/banalata.mp4" type="video/mp4" />
               </video>

               {/* Video Controls Overlay */}
               <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                 <button onClick={togglePlay} className="text-white/60 hover:text-white transition-colors w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-[10px] sm:text-xs">
                   {isPlaying ? (
                     <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 sm:w-4 sm:h-4"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                   ) : (
                     <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 sm:w-4 sm:h-4"><path d="M8 5v14l11-7z"/></svg>
                   )}
                 </button>
                 <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-[10px] sm:text-xs">
                   {isMuted ? (
                     <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 sm:w-4 sm:h-4"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                   ) : (
                     <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 sm:w-4 sm:h-4"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                   )}
                 </button>
                 <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-[10px] sm:text-xs">
                   <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 sm:w-4 sm:h-4"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                 </button>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 max-w-xl mx-auto w-full px-4 sm:px-6">
            {/* First Row */}
            <div className="flex flex-row justify-center gap-4 w-full">
              <Link
                href="/menu"
                className="group bg-yellow-400 hover:bg-white text-black font-black py-4 sm:py-5 px-2 rounded-2xl shadow-[0_10px_30px_rgba(251,191,36,0.4)] transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center gap-2 w-1/2"
              >
                MENU
                <span className="group-hover:translate-x-1 transition-transform italic text-lg">→</span>
              </Link>
              <Link
                href="/game"
                className="bg-red-600 hover:bg-white text-white hover:text-red-600 font-black py-4 sm:py-5 px-2 rounded-2xl shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center gap-2 w-1/2"
              >
                <span className="text-xl leading-none">🏆</span> PLAY & WIN
              </Link>
            </div>
            
            {/* Second Row */}
            <div className="flex flex-row justify-center gap-4 w-full">
              <a
                href="https://www.swiggy.com/menu/1361734?source=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-r from-[#fc8019] to-[#fd9945] hover:from-white hover:to-white text-white hover:text-[#fc8019] font-black py-4 sm:py-5 px-2 rounded-2xl shadow-[0_10px_30px_rgba(252,128,25,0.4)] transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center w-1/2 tracking-widest border border-white/10 hover:border-[#fc8019]/30"
              >
                SWIGGY
              </a>
              <a
                href="https://zomato.onelink.me/xqzv/nmu2fy95"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-r from-[#cb202d] to-[#e23744] hover:from-white hover:to-white text-white hover:text-[#cb202d] font-black py-4 sm:py-5 px-2 rounded-2xl shadow-[0_10px_30px_rgba(203,32,45,0.4)] transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center w-1/2 tracking-widest border border-white/10 hover:border-[#cb202d]/30"
              >
                ZOMATO
              </a>
            </div>
          </div>
        </div>

        {/* Floating Mouse Scroll Icon */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-bounce opacity-50">
          <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* 🛵 SLIM DELIVERY BANNER 🛵 */}
      <div className="bg-zinc-900 py-4 relative z-30 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border-y border-white/10">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs">
          <div className="flex items-center gap-3 text-yellow-400">
            <span className="text-2xl animate-bounce drop-shadow-md">🛵</span>
            <span>Cravings? We Deliver Fast.</span>
          </div>
          <span className="hidden sm:block text-zinc-600">|</span>
          <div className="flex items-center gap-3">
            <span>Now Available On</span>
            <span className="bg-[#fc8019] text-white px-2.5 py-1 rounded shadow-[0_0_10px_rgba(252,128,25,0.4)]">SWIGGY</span>
            <span className="bg-[#cb202d] text-white px-2.5 py-1 rounded shadow-[0_0_10px_rgba(203,32,45,0.4)]">ZOMATO</span>
          </div>
        </div>
      </div>

      {/* 🥘 SIGNATURE DISHES (THE "EYE CANDY") 🥘 */}
      <section className="py-16 md:py-24 px-4 bg-white relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-24">
            <span className="text-red-600 font-black text-sm uppercase tracking-[0.5em] mb-4 block">Hand-Picked Specialties</span>
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter">Chef's Signature <span className="text-yellow-500 italic font-serif">Creations</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Dish 1: Kosha */}
            <div className="group relative overflow-hidden rounded-[3rem] shadow-2xl h-[450px] md:h-[600px] cursor-pointer">
              <img src="/images/v2/kosha.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Mutton Kosha" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 p-10 transform group-hover:-translate-y-4 transition-transform duration-500">
                <span className="bg-red-600 px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-4 inline-block">Best Seller</span>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">BENGALI KOSHA MANGSHO</h3>
                <p className="text-zinc-400 text-sm font-medium line-clamp-2 mb-6">Slow-cooked tender mutton in a rich, dark gravy of hand-ground spices.</p>
                <Link href="/menu" className="inline-block bg-white text-black font-black text-xs px-8 py-3 rounded-xl uppercase tracking-widest hover:bg-yellow-400 transition-colors">See In Menu</Link>
              </div>
            </div>

            {/* Dish 2: Pulao */}
            <div className="group relative overflow-hidden rounded-[3rem] shadow-2xl h-[450px] md:h-[600px] md:mt-12 cursor-pointer shadow-yellow-100">
              <img src="/images/v2/pulao.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Basanti Pulao" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 p-10 transform group-hover:-translate-y-4 transition-transform duration-500">
                <span className="bg-yellow-400 px-4 py-1 rounded-full text-[10px] font-black text-black uppercase tracking-widest mb-4 inline-block">Classic Ritual</span>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">ROYAL BASANTI PULAO</h3>
                <p className="text-zinc-400 text-sm font-medium line-clamp-2 mb-6">Fragrant saffron rice garnished with golden raisins and toasted cashews.</p>
                <Link href="/menu" className="inline-block bg-white text-black font-black text-xs px-8 py-3 rounded-xl uppercase tracking-widest hover:bg-yellow-400 transition-colors">See In Menu</Link>
              </div>
            </div>

            {/* Dish 3: Doi */}
            <div className="group relative overflow-hidden rounded-[3rem] shadow-2xl h-[450px] md:h-[600px] cursor-pointer">
              <img src="/images/v2/doi.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Mishti Doi" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 p-10 transform group-hover:-translate-y-4 transition-transform duration-500">
                <span className="bg-zinc-800 px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-4 inline-block">Must-Have End</span>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">TRADITIONAL MISHTI DOI</h3>
                <p className="text-zinc-400 text-sm font-medium line-clamp-2 mb-6">Cool, creamy sweet yogurt served in authentic terra-cotta clay pots.</p>
                <Link href="/menu" className="inline-block bg-white text-black font-black text-xs px-8 py-3 rounded-xl uppercase tracking-widest hover:bg-yellow-400 transition-colors">See In Menu</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📖 STORY SECTION (THE VIBE) 📖 */}
      <section className="py-16 md:py-24 px-4 bg-zinc-50 overflow-hidden relative">
        {/* Subtle Brand Background */}
        <div className="absolute top-0 right-0 p-40 opacity-[0.03] select-none pointer-events-none rotate-45 text-9xl">BANALATA</div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 relative">
              <div className="absolute -inset-4 bg-red-600 rounded-[4rem] rotate-6 blur-2xl opacity-10"></div>
              <div className="relative group">
                <img
                  src="/images/about.png"
                  alt="Banalata Kitchen"
                  className="w-full h-[400px] md:h-[600px] object-cover rounded-[3.5rem] shadow-2xl relative z-10 border-8 border-white group-hover:rotate-1 transition-transform"
                />
                <div className="absolute bottom-10 -right-10 bg-yellow-400 p-8 rounded-3xl shadow-2xl z-20 max-w-[200px] rotate-3 animate-bounce-slow">
                  <p className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-2 font-serif italic">FROM TRIPURA</p>
                  <p className="text-lg leading-tight font-black text-zinc-900 uppercase">A Legacy in Every Grain.</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <span className="text-red-600 font-black text-xs uppercase tracking-[0.5em] mb-6 inline-block">The Banalata Spirit</span>
              <h2 className="text-5xl md:text-6xl font-black text-zinc-900 mb-8 tracking-tighter leading-none">
                Born with Tradition. <br />
                Served with <span className="text-red-600 italic">Pride.</span>
              </h2>
              <p className="text-zinc-600 text-lg leading-relaxed mb-10 font-medium">
                Our spice blends aren't just labels; they are family secrets. We source our morning ingredients daily from local markets to ensure that every bite of our fish and mutton transports you straight back to the heart of Kolkata.
              </p>

              <div className="grid grid-cols-2 gap-10 mb-12">
                <div className="group">
                  <div className="text-4xl font-black text-zinc-900 mb-2 group-hover:text-red-500 transition-colors tracking-tighter">100%</div>
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none">Market Fresh Sourcing</p>
                </div>
                <div className="group">
                  <div className="text-4xl font-black text-zinc-900 mb-2 group-hover:text-yellow-500 transition-colors tracking-tighter">Organic</div>
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none">Hand-Ground Spices</p>
                </div>
              </div>

              <a href="https://share.google/1wX6xN0UIZJlMCnPn" target="_blank" rel="noopener noreferrer" className="group bg-zinc-900 text-white font-black px-12 py-5 rounded-2xl shadow-xl hover:bg-black transition-all inline-flex items-center gap-4 text-sm tracking-widest active:scale-95">
                FIND US ON MAP 🚩
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 🎟️ REWARD CLAIM (SOCIAL PROOF) 🎟️ */}
      <section className="py-16 md:py-24 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-yellow-50 rounded-[3rem] md:rounded-[5rem] shadow-xl border-4 border-yellow-200 p-8 md:p-24 relative overflow-hidden group">
            {/* Decorative background pulse */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-400/30 transition-all duration-1000"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <div className="w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-md animate-bounce-slow">✨</div>
                <h2 className="text-4xl md:text-6xl font-black text-zinc-900 mb-8 leading-none tracking-tight">Love the Food? <br /><span className="text-red-600 italic">Get Rewarded.</span></h2>
                <p className="text-zinc-600 text-lg font-medium leading-relaxed mb-10">Help our small Dhaba grow! Leave a Google Review and unlock a premium food coupon for your next feast.</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-xs">1</span>
                    <p className="text-zinc-800 font-bold">Write a review on Google Maps</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-xs">2</span>
                    <p className="text-zinc-800 font-bold">Upload the screenshot here</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[3.5rem] p-10 md:p-12 border-2 border-yellow-100 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
                {message && (
                  <div className={`text-center mb-8 p-4 rounded-2xl font-bold text-xs uppercase tracking-widest animate-in fade-in zoom-in ${message.startsWith('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {message}
                  </div>
                )}

                {rewardCode ? (
                  <div className="text-center animate-in zoom-in-50 duration-700 w-full flex flex-col items-center">
                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em] mb-4">Your Gift Code</p>

                    <ScratchCard width={300} height={120}>
                      <span className="text-3xl font-black text-white tracking-widest italic drop-shadow-lg px-4 break-all">
                        {rewardCode}
                      </span>
                    </ScratchCard>

                    <p className="text-[10px] text-zinc-500 mt-8 font-black font-serif uppercase">*Screenshotted? Great! See you at the counter.</p>
                  </div>
                ) : (
                  <div className="w-full space-y-8">
                    <a
                      href={GOOGLE_REVIEW_URL}
                      target="_blank"
                      className="block w-full text-center py-4 rounded-2xl bg-zinc-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest transition-all mb-4"
                    >
                      Give Google Review ⭐️
                    </a>
                    <div className="flex flex-col gap-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Upload Proof</label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="text-[10px] text-zinc-500 file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-yellow-100 file:text-zinc-800 hover:file:bg-yellow-200 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={handleClaim}
                      disabled={uploading}
                      className="w-full bg-yellow-400 hover:bg-white text-black font-black py-6 rounded-3xl shadow-2xl transition-all disabled:opacity-50 active:scale-95 text-xs md:text-sm uppercase tracking-widest mt-4 px-4"
                    >
                      {uploading ? "Verifying..." : "Claim My Food Coupon →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 CUSTOMER REVIEWS (THE PROOF) 🌟 */}
      <section className="py-16 md:py-24 px-4 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl">
              <span className="text-red-600 font-dark text-xs uppercase tracking-[0.5em] mb-4 block">Guest Experiences</span>
              <h2 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none">Real Stories from <span className="underline decoration-yellow-400 decoration-wavy underline-offset-8">Our Tables</span></h2>
            </div>
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="text-yellow-400 text-3xl font-black">4.9/5</div>
              <div className="w-px h-10 bg-zinc-200"></div>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Google Rating <br /> (250+ Reviews)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { name: "Nishanth Das", date: "2 days ago", body: "Hands down the best Mutton Kosha in Agartala. The meat was falling off the bone. Authentic flavors!", stars: 5 },
              { name: "Rahul Das", date: "1 week ago", body: "The game feature on the website is so fun! We actually won a coupon and used it for lunch today. Highly recommend.", stars: 5 },
              { name: "Megha Gupta", date: "3 weeks ago", body: "Love the aesthetics of this place. The Basanti Pulao is so fragrant. Feels like home-cooked food.", stars: 5 }
            ].map((rev, i) => (
              <div key={i} className="bg-white p-12 rounded-[3.5rem] border border-zinc-100 hover:border-red-100 hover:shadow-2xl transition-all group">
                <div className="flex gap-1 mb-10">
                  {[...Array(rev.stars)].map((_, s) => <span key={s} className="text-yellow-400 text-lg">★</span>)}
                </div>
                <p className="text-zinc-600 font-medium text-lg leading-relaxed mb-10 italic">"{rev.body}"</p>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center font-black text-red-600">{rev.name[0]}</div>
                  <div>
                    <h4 className="font-black text-zinc-800 text-sm">{rev.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{rev.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* 🥬 BRAND PROMISES 🥬 */}
      <section className="py-16 md:py-20 px-4 bg-yellow-50/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: "🍃", title: "Daily Morning Market", desc: "We don't do frozen. Our chefs personally pick the fish and mutton every morning at 6 AM." },
              { icon: "🏺", title: "Stone Ground Magic", desc: "No machines for our spice mixes. We use traditional stone grinders for that intense aroma." },
              { icon: "🥘", title: "Heritage Claypot", desc: "Some dishes just taste better when cooked slow in earthen pots. We keep that tradition alive." }
            ].map((item, i) => (
              <div key={i} className="text-center p-12 rounded-[3rem] bg-white border-2 border-transparent hover:border-yellow-200 transition-all group shadow-sm hover:shadow-xl">
                <div className="text-6xl mb-10 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">{item.title}</h3>
                <p className="text-zinc-500 font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CSS ANIMATIONS 🚀 */}
      <style jsx global>{`
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 30s infinite alternate ease-in-out;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
