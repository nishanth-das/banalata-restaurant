"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuType, setActiveMenuType] = useState('regular'); // 'regular' or 'party'
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null); // For the "Know More" popup
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
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

  // 1. Filter items based on Regular vs Party
  const filteredByType = menuItems.filter(item => item.menu_type === activeMenuType);

  // 2. Get unique categories for the active type
  const categories = ['All', ...new Set(filteredByType.map(item => item.category))];

  // 3. Filter items based on active category
  const finalItems = activeCategory === 'All' 
    ? filteredByType 
    : filteredByType.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[80vh] bg-[#FDF9F0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <p className="mt-4 font-black uppercase tracking-widest text-zinc-400 text-[10px]">Preparing the kitchen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0] pb-24">
      {/* 🚀 PREMIUM HEADER 🚀 */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none mb-2">
                  OUR <span className="text-red-600 italic">MENU</span>
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Authentic Bengali Flavors</p>
              </div>

              {/* Regular vs Party Switcher */}
              <div className="flex bg-zinc-100 p-1 rounded-2xl w-full md:w-auto">
                <button 
                  onClick={() => { setActiveMenuType('regular'); setActiveCategory('All'); }}
                  className={`flex-1 md:w-40 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeMenuType === 'regular' ? 'bg-white text-red-600 shadow-lg scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}
                >Regular</button>
                <button 
                  onClick={() => { setActiveMenuType('party'); setActiveCategory('All'); }}
                  className={`flex-1 md:w-40 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeMenuType === 'party' ? 'bg-red-600 text-white shadow-lg scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}
                >Party Package</button>
              </div>
           </div>
        </div>

        {/* 🥗 HORIZONTAL CATEGORY SCROLLER 🥗 */}
        <div className="border-t border-zinc-50 overflow-x-auto no-scrollbar" ref={scrollRef}>
           <div className="container mx-auto px-4 flex gap-3 py-5 whitespace-nowrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeCategory === cat 
                    ? 'bg-yellow-400 text-black shadow-[0_10px_20px_-5px_rgba(250,204,21,0.4)] scale-105 border-2 border-yellow-500' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-transparent'}`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* 🥘 THE BENTO MENU GRID 🥘 */}
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
        {finalItems.length === 0 ? (
          <div className="text-center py-32 opacity-20">
             <div className="text-8xl mb-6">🍽️</div>
             <p className="font-black uppercase tracking-[0.3em] text-xs">Menu is being curated...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {finalItems.map((item) => (
              <div 
                key={item.id} 
                className="group relative h-[450px] rounded-[3.5rem] overflow-hidden shadow-2xl bg-zinc-900 border-4 border-white hover:scale-[1.02] transition-all duration-500"
              >
                {/* Food Image */}
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <span className="text-6xl opacity-20">🥘</span>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-10 z-20">
                   <div className="flex justify-between items-end gap-4 mb-4">
                      <div>
                         <span className="inline-block px-4 py-1 rounded-full bg-yellow-400 text-[8px] font-black uppercase tracking-widest text-black mb-3">
                           {item.category}
                         </span>
                         <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">
                           {item.name}
                         </h4>
                      </div>
                      <div className="text-right">
                         <span className="block text-red-600 font-black text-2xl tracking-tighter drop-shadow-sm">₹{item.price}</span>
                      </div>
                   </div>
                   
                   <p className="text-zinc-300 text-xs font-medium leading-relaxed mb-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                     {item.description || "Traditional Bengali preparation made with authentic spices."}
                   </p>
                   
                   <div className="flex items-center gap-4 border-t border-white/10 pt-6 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                      <button 
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 bg-white text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-colors"
                      >
                        Know More ↗
                      </button>
                      <div className="w-12 h-12 rounded-2xl border-2 border-white/20 flex items-center justify-center text-white text-lg">
                        +
                      </div>
                   </div>
                </div>

                {/* Status Badges */}
                {item.menu_type === 'party' && (
                  <div className="absolute top-8 right-8 z-30 bg-red-600 text-white px-6 py-2 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
                    Party Pack 🥂
                  </div>
                )}
              </div>
            ))}
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
                 <div className="h-80 relative overflow-hidden">
                    {selectedItem.image_url ? (
                      <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-6xl">🥘</div>
                    )}
                    <div className="absolute top-8 left-8 bg-yellow-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-black">
                      {selectedItem.category}
                    </div>
                 </div>

                 <div className="p-12">
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
                         className="flex-1 bg-zinc-900 text-white font-black py-6 rounded-2xl uppercase tracking-widest text-xs hover:bg-black transition-all"
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
