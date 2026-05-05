"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DineInMenu() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeMenuType, setActiveMenuType] = useState('regular'); // 'regular' or 'party'
  const [selectedItem, setSelectedItem] = useState(null); // For the "Know More" popup
  const [activeCategory, setActiveCategory] = useState(''); // Used for scroll spy
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    const checkAuthAndFetchMenu = async () => {
      // 1. Check Authentication & Profile
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/dine-in');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!profile?.phone_number) {
        // If they somehow skipped onboarding
        localStorage.setItem('returnTo', '/dine-in/menu');
        router.push('/onboarding');
        return;
      }
      
      setUserProfile(profile);
      setAuthChecking(false);

      // 2. Fetch Menu
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching menu:", error.message);
      } else {
        setMenuItems(data || []);
      }
      setLoading(false);
    };

    checkAuthAndFetchMenu();
  }, [router]);

  // 1. Filter items based on Regular vs Party
  const filteredByType = menuItems.filter(item => item.menu_type === activeMenuType);

  // 2. Get unique categories for the active type
  const categories = [...new Set(filteredByType.map(item => item.category))];
  
  // 3. Group items by category
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = filteredByType.filter(item => item.category === cat);
    return acc;
  }, {});

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      // Adjust offset for sticky headers
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Set default active category to first one if none selected
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  if (authChecking || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[80vh] bg-[#DA251D]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="mt-4 font-black uppercase tracking-widest text-white/50 text-[10px]">
          {authChecking ? "Verifying Table Access..." : "Preparing the kitchen..."}
        </p>
      </div>
    );
  }

  // Define a set of icons for categories
  const categoryIcons = {
    'Beverages': '🍹',
    'Main Course': '🥘',
    'Starters': '🥟',
    'Desserts': '🍨',
    'Breads': '🫓',
    'Thali': '🍛',
    'default': '🍽️'
  };

  return (
    <div className="min-h-screen bg-[#DA251D] text-white pb-24">
      {/* 🚀 PREMIUM HEADER 🚀 */}
      <div className="bg-[#DA251D] border-b border-red-700/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-[1400px]">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-400 mb-1 block">
                  Welcome, {userProfile?.full_name?.split(' ')[0] || 'Guest'}!
                </span>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-1 text-white">
                  DINE-IN <span className="italic text-yellow-400">MENU</span>
                </h2>
              </div>

              {/* Regular vs Party Switcher */}
              <div className="flex bg-black/20 p-1 rounded-full w-full md:w-auto border border-white/10">
                <button 
                  onClick={() => { setActiveMenuType('regular'); setActiveCategory(''); }}
                  className={`flex-1 md:w-32 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${activeMenuType === 'regular' ? 'bg-white text-[#DA251D] shadow-lg' : 'text-white/60 hover:text-white'}`}
                >Regular</button>
                <button 
                  onClick={() => { setActiveMenuType('party'); setActiveCategory(''); }}
                  className={`flex-1 md:w-32 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${activeMenuType === 'party' ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                >Party Package</button>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        {categories.length === 0 ? (
          <div className="text-center py-32 opacity-50">
             <div className="text-8xl mb-6">🍽️</div>
             <p className="font-black uppercase tracking-[0.3em] text-xs text-white">Menu is being curated...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* 🥗 LEFT SIDEBAR (STICKY) 🥗 */}
            <div className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-32 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-4 lg:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-left transition-all shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal
                      ${activeCategory === cat
                        ? 'bg-yellow-400 text-black shadow-lg font-black' 
                        : 'bg-black/10 hover:bg-black/20 text-white border border-white/5 font-bold'
                      }`}
                  >
                    <span className="text-xl">{categoryIcons[cat] || categoryIcons['default']}</span>
                    <span className="text-sm tracking-wide">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 🥘 MAIN MENU CONTENT 🥘 */}
            <div className="flex-1 flex flex-col gap-12">
              {categories.map(category => (
                <div key={category} id={`category-${category}`} className="scroll-mt-32">
                  <h3 className="text-3xl font-black mb-6 text-white border-b border-white/10 pb-4 inline-block tracking-tight">
                    {category}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {groupedItems[category].map(item => (
                      <div 
                        key={item.id}
                        className="group relative h-48 md:h-64 rounded-3xl overflow-hidden cursor-pointer shadow-lg bg-black/40 border border-white/10 hover:border-yellow-400/50 transition-all duration-300"
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Background Image */}
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-[#DA251D]/20 flex items-center justify-center">
                            <span className="text-6xl opacity-20">🍲</span>
                          </div>
                        )}
                        
                        {/* Dark Bottom Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90"></div>
                        
                        {/* Content Container */}
                        <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                          <div className="flex justify-between items-end gap-4">
                            <div className="flex-1">
                              <h4 className="text-xl md:text-2xl font-black text-white leading-tight mb-1 group-hover:text-yellow-400 transition-colors">
                                {item.name}
                              </h4>
                              <p className="text-white/60 text-xs md:text-sm line-clamp-1 mb-2 font-medium">
                                {item.description || "Authentic Bengali preparation."}
                              </p>
                              <div className="font-black text-lg md:text-xl text-white">
                                <span className="text-yellow-400 mr-1">₹</span>{item.price}
                              </div>
                            </div>
                            
                            <div className="shrink-0 flex flex-col items-end">
                              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Know More <span className="text-lg leading-none">↗</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        {item.menu_type === 'party' && (
                          <div className="absolute top-4 right-4 z-30 bg-red-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
                            Party Pack 🥂
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        )}
      </div>

      {/* 🔮 THE "KNOW MORE" POPUP MODAL 🔮 */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
           {/* Dark Overlay */}
           <div 
             className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-500"
             onClick={() => setSelectedItem(null)}
           ></div>

           {/* Modal Card */}
           <div className="relative z-10 w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black z-20 hover:scale-110 transition-all"
              >✕</button>

              <div className="flex flex-col">
                 <div className="h-48 md:h-80 relative overflow-hidden">
                    {selectedItem.image_url ? (
                      <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-6xl">🥘</div>
                    )}
                    <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-yellow-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-black shadow-lg">
                      {selectedItem.category}
                    </div>
                 </div>

                 <div className="p-8 md:p-12 text-black">
                    <div className="flex justify-between items-start mb-6">
                       <h3 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
                         {selectedItem.name}
                       </h3>
                       <span className="text-3xl font-black text-red-600 tracking-tighter leading-none">₹{selectedItem.price}</span>
                    </div>

                    <p className="text-zinc-500 font-medium leading-relaxed text-lg mb-10 italic">
                      {selectedItem.description || "Our signature recipe, slow-cooked with fresh ingredients and authentic spices from our heritage kitchen."}
                    </p>

                    <div className="flex gap-4">
                       <button 
                         onClick={() => setSelectedItem(null)}
                         className="flex-1 bg-[#DA251D] text-white font-black py-6 rounded-2xl uppercase tracking-widest text-xs hover:bg-red-800 transition-all shadow-lg"
                       >
                         CLOSE VIEW
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
