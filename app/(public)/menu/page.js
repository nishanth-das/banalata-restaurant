"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching menu:", error.message);
      } else {
        // Group items by category
        const grouped = data.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        }, {});
        
        const result = Object.keys(grouped).map(cat => ({
          category: cat,
          items: grouped[cat]
        }));
        
        setMenuItems(result);
      }
      setLoading(false);
    };

    fetchMenu();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="py-24 px-4 bg-yellow-50 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-16 md:mb-24 text-center px-4">
            <span className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block leading-none">Handmade Flavors</span>
            <h2 className="text-5xl md:text-8xl font-black text-zinc-900 mb-6 md:mb-8 tracking-tighter leading-none">
              Our <span className="text-red-600 italic">Menu</span>
            </h2>
            <div className="w-24 md:w-32 h-2 bg-yellow-400 mx-auto rounded-full shadow-sm"></div>
        </header>
        
        <div className="space-y-32">
          {menuItems.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-4 md:gap-8 mb-10 md:mb-12">
                <h3 className="text-2xl md:text-3xl font-black text-zinc-800 uppercase tracking-widest whitespace-nowrap">
                  {cat.category}
                </h3>
                <div className="flex-1 h-[2px] bg-zinc-200"></div>
                <div className="text-zinc-300 text-3xl">🪷</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {cat.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex flex-col p-10 bg-white rounded-[3rem] shadow-sm border-2 border-zinc-50 hover:border-red-500 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6 border-b-2 border-zinc-50 pb-6 group-hover:border-red-50 transition-colors">
                      <span className="font-black text-2xl text-zinc-800 group-hover:text-red-600 transition-colors leading-tight">
                        {item.name}
                      </span>
                    </div>
                    <div className="mb-6">
                        <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                          {item.description || "Traditional Bengali preparation made with authentic spices and fresh local ingredients."}
                        </p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="font-black text-2xl text-zinc-900 tracking-tighter">
                          ₹{item.price}
                        </span>
                        <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                           +
                        </div>
                    </div>

                    {/* Subtle Top Accent */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
