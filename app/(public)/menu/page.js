"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuType, setActiveMenuType] = useState('regular'); // 'regular' or 'party'
  const [selectedItem, setSelectedItem] = useState(null); // For the "Know More" popup
  const [activeCategory, setActiveCategory] = useState(''); // Used for scroll spy
  
  // Party Inquiry State
  const [inquiryForm, setInquiryForm] = useState({
    name: '', phone: '', guests: '', event_date: '', event_type: 'Birthday', notes: ''
  });
  const [inquiryStatus, setInquiryStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'

  
  useEffect(() => {
    fetchMenu();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('type') === 'party') {
        setActiveMenuType('party');
      }
    }
  }, []);

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('menu_type', 'regular'); // Only fetch regular menu items now

    if (error) console.error(error);
    else setMenuItems(data || []);
    setLoading(false);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInquiryStatus('submitting');
    const { error } = await supabase.from('party_inquiries').insert([inquiryForm]);
    if (error) {
      console.error(error);
      setInquiryStatus('error');
    } else {
      setInquiryStatus('success');
      setInquiryForm({ name: '', phone: '', guests: '', event_date: '', event_type: 'Birthday', notes: '' });
    }
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[80vh] bg-[#DA251D]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="mt-4 font-black uppercase tracking-widest text-white/50 text-[10px]">Preparing the kitchen...</p>
      </div>
    );
  }

  // Define a set of icons for categories
  const categoryIcons = {
    'Breakfast': '🍳', 'Soup': '🥣', 'Snacks': '🍟', 'Sandwich': '🥪', 
    'Momos': '🥟', 'Rice': '🍚', 'Tea & Coffee': '☕', 
    'Chinese Starter - Veg': '🥢', 'Chinese Starter - Non Veg': '🍗', 
    'Daal': '🍲', 'Chinese Rice': '🥡', 'Chinese Gravy': '🥘', 
    'Desi Style Meat': '🍖', 'Meat Indian Style': '🍛', 'Special Fish': '🐟', 
    'Egg': '🥚', 'Sutki': '🌶️', 'Fry': '🍤', 'Salad': '🥗', 
    'Roti': '🫓', 'Tandoori': '🍢', 'Roti/Naan': '🫓', 'Noodles': '🍜', 
    'Biryani': '🥘', 'Desert': '🍨', 'Desserts': '🍨', 'Shakes': '🥤', 
    'Mocktail': '🍹', 'Fresh Juice': '🧃', 'Chef\'s Special': '👨‍🍳', 
    'Signature Item': '👑', 'Beverages': '🍹', 'Main Course': '🥘', 
    'Starters': '🥟', 'Breads': '🫓', 'Thali': '🍛', 'default': '🍽️'
  };

  return (
    <div className="min-h-screen bg-[#DA251D] text-white pb-24">
      {/* 🚀 PREMIUM HEADER 🚀 */}
      <div className="bg-[#DA251D] border-b border-red-700/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-[1400px]">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-1 text-white">
                  OUR <span className="italic text-yellow-400">MENU</span>
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
                >Party Inquiries</button>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        {activeMenuType === 'party' ? (
          <div className="max-w-3xl mx-auto bg-white text-zinc-900 rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <span className="text-red-600 font-black text-[10px] uppercase tracking-[0.5em] mb-4 block">Let's Celebrate</span>
              <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">Book Your <span className="text-yellow-500 italic font-serif">Event</span></h3>
              <p className="text-zinc-500 font-medium">Fill out the details below and we will get back to you with a custom party menu and quote!</p>
            </div>
            
            {inquiryStatus === 'success' ? (
              <div className="bg-green-50 text-green-700 p-10 rounded-3xl text-center border-2 border-green-200">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-2xl font-black mb-2">Request Received!</h4>
                <p className="font-medium">We'll review your details and call you shortly to plan the perfect menu.</p>
                <button onClick={() => setInquiryStatus('idle')} className="mt-8 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">Book Another Event</button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Your Name</label>
                    <input required type="text" value={inquiryForm.name} onChange={e => setInquiryForm({...inquiryForm, name: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 py-4 focus:outline-none focus:border-red-500 transition-colors font-bold" placeholder="e.g. Rahul Das" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Phone Number</label>
                    <input required type="tel" value={inquiryForm.phone} onChange={e => setInquiryForm({...inquiryForm, phone: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 py-4 focus:outline-none focus:border-red-500 transition-colors font-bold" placeholder="e.g. +91 98765 43210" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Event Type</label>
                    <select required value={inquiryForm.event_type} onChange={e => setInquiryForm({...inquiryForm, event_type: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 py-4 focus:outline-none focus:border-red-500 transition-colors font-bold appearance-none">
                      <option>Birthday</option>
                      <option>Marriage / Reception</option>
                      <option>Anniversary</option>
                      <option>Corporate Event</option>
                      <option>Casual Get-together</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Date</label>
                    <input required type="date" value={inquiryForm.event_date} onChange={e => setInquiryForm({...inquiryForm, event_date: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 py-4 focus:outline-none focus:border-red-500 transition-colors font-bold text-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Total Guests</label>
                    <input required type="number" min="1" value={inquiryForm.guests} onChange={e => setInquiryForm({...inquiryForm, guests: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 py-4 focus:outline-none focus:border-red-500 transition-colors font-bold" placeholder="e.g. 50" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Special Requests (Optional)</label>
                  <textarea value={inquiryForm.notes} onChange={e => setInquiryForm({...inquiryForm, notes: e.target.value})} className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 py-4 focus:outline-none focus:border-red-500 transition-colors font-bold min-h-[120px]" placeholder="Any specific dishes or dietary requirements?"></textarea>
                </div>

                {inquiryStatus === 'error' && <p className="text-red-500 text-sm font-bold text-center">Something went wrong. Please try again or call us.</p>}

                <button disabled={inquiryStatus === 'submitting'} type="submit" className="w-full bg-red-600 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest disabled:opacity-50">
                  {inquiryStatus === 'submitting' ? 'Sending Request...' : 'Submit Inquiry →'}
                </button>
              </form>
            )}
          </div>
        ) : categories.length === 0 ? (
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
                                {item.dietary_preference === 'veg' && <span className="text-green-500 mr-2 text-sm bg-white/10 px-1 py-0.5 rounded" title="Veg">🟢</span>}
                                {item.dietary_preference === 'non-veg' && <span className="text-red-500 mr-2 text-sm bg-white/10 px-1 py-0.5 rounded" title="Non-Veg">🔴</span>}
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
                         {selectedItem.dietary_preference === 'veg' && <span className="text-green-600 mr-3 text-2xl" title="Veg">🟢</span>}
                         {selectedItem.dietary_preference === 'non-veg' && <span className="text-red-600 mr-3 text-2xl" title="Non-Veg">🔴</span>}
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
