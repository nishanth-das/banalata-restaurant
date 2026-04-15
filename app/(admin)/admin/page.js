"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateCouponCode, saveCoupon } from "@/lib/coupon";
import Link from "next/link";
import { ADMIN_EMAILS } from "@/lib/admins";
import { fetchPendingImages, moderateImage } from "@/lib/gallery";

export default function AdminPage({ searchParams }) {
  // Next.js 15 requires unwrapping searchParams!
  const resolvedParams = use(searchParams);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use searchParams or default to menu
  const activeTab = resolvedParams?.tab || "menu";
  
  // Menu State
  const [menuItems, setMenuItems] = useState([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [menuForm, setMenuForm] = useState({ id: null, name: "", category: "Starters", price: "", description: "" });
  
  // Coupon State
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: "", source: "manual" });

  // Gallery State
  const [pendingImages, setPendingImages] = useState([]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
        loadData();
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  const loadData = async () => {
    fetchMenu();
    fetchCoupons();
    fetchGallery();
  };

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu').select('*').order('category', { ascending: true });
    setMenuItems(data || []);
  };

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
  };

  const fetchGallery = async () => {
    const data = await fetchPendingImages();
    setPendingImages(data || []);
  };

  const handleGalleryAction = async (id, action) => {
    await moderateImage(id, action);
    fetchGallery();
  };

  // --- Menu Handlers ---
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    const itemData = {
      name: menuForm.name,
      category: menuForm.category,
      price: parseInt(menuForm.price),
      description: menuForm.description
    };

    let result;
    if (menuForm.id) {
      result = await supabase.from('menu').update(itemData).eq('id', menuForm.id);
    } else {
      result = await supabase.from('menu').insert([itemData]);
    }

    if (result.error) {
      alert("Error: " + result.error.message);
    } else {
      setMenuForm({ id: null, name: "", category: "Starters", price: "", description: "" });
      setIsCustomCategory(false);
      fetchMenu();
    }
  };

  const deleteMenuItem = async (id) => {
    if (confirm("🚨 Are you sure? This dish will be permanently removed from the menu.")) {
      const { error } = await supabase.from('menu').delete().eq('id', id);
      if (error) {
        alert("Delete failed: " + error.message);
        console.error("Supabase Delete Error:", error);
      } else {
        fetchMenu();
      }
    }
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomCategory(true);
      setMenuForm({ ...menuForm, category: "" });
    } else {
      setIsCustomCategory(false);
      setMenuForm({ ...menuForm, category: val });
    }
  };

  const deleteCoupon = async (id) => {
    if (confirm("🚨 Are you sure? This coupon will be permanently erased from history.")) {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) {
        alert("Delete failed: " + error.message);
      } else {
        fetchCoupons();
      }
    }
  };

  // --- Coupon Handlers ---
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      // If creating for a pool (game/review), userId is null
      const targetUserId = (couponForm.source === 'game' || couponForm.source === 'review') ? null : user.id;
      
      await saveCoupon(targetUserId, couponForm.code || generateCouponCode(), couponForm.source);
      setCouponForm({ code: "", source: "manual" });
      fetchCoupons();
      alert("Coupon Added Successfully!");
    } catch (err) {
      alert("Error adding coupon: " + err.message);
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-red-600 animate-pulse">LOADING DASHBOARD...</div>;

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-white px-4 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-50/50 via-transparent to-transparent opacity-50"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-400/10 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-600/5 rounded-full blur-[100px]"></div>

          <div className="relative z-10">
            <div className="text-9xl mb-12 animate-bounce drop-shadow-2xl">🚫</div>
            <h2 className="text-6xl md:text-8xl font-black text-zinc-900 mb-6 tracking-tighter leading-none">
              STOP RIGHT <br />
              <span className="text-red-600">THERE!</span>
            </h2>
            <p className="text-zinc-500 mb-12 font-medium text-xl max-w-lg mx-auto leading-relaxed">
              Only the legendary restaurant owner has the keys to this vault. Unauthorized access is strictly delicious but prohibited.
            </p>
            <Link 
              href="/" 
              className="inline-block bg-zinc-900 hover:bg-black text-white font-black px-12 py-6 rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-sm"
            >
              Return to Safety
            </Link>
          </div>
      </div>
    );
  }

  // Get unique categories for the dropdown
  const existingCategories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="container mx-auto">
        {activeTab === 'menu' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-red-600 sticky top-24">
                <h3 className="text-xl font-black text-zinc-800 mb-6 uppercase tracking-tight">
                  {menuForm.id ? "Edit Item" : "Add New Dish"}
                </h3>
                <form onSubmit={handleMenuSubmit} className="space-y-4">
                  <input
                    type="text" placeholder="Dish Name" required
                    className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-red-500 outline-none font-bold placeholder:text-zinc-300"
                    value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                  />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Food Category</label>
                    <select
                      className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-red-500 outline-none font-bold"
                      value={isCustomCategory ? "CUSTOM" : menuForm.category} 
                      onChange={handleCategoryChange}
                    >
                      <option value="Starters">Starters</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                      {existingCategories.filter(c => !["Starters", "Main Course", "Desserts", "Beverages"].includes(c)).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="CUSTOM" className="text-red-600 font-bold">+ New Category...</option>
                    </select>
                  </div>

                  {isCustomCategory && (
                    <input
                      type="text" placeholder="Enter Category Name" required
                      className="w-full p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl focus:border-red-500 outline-none font-bold animate-in fade-in slide-in-from-top-2"
                      value={menuForm.category} 
                      onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}
                    />
                  )}
                  <input
                    type="number" placeholder="Price (₹)" required
                    className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-red-500 outline-none font-bold placeholder:text-zinc-300"
                    value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                  />
                  <textarea
                    placeholder="Brief Description"
                    className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-red-500 outline-none font-bold min-h-[100px] placeholder:text-zinc-300"
                    value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                  />
                  <button type="submit" className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-red-700 transition-all uppercase tracking-widest text-sm">
                    {menuForm.id ? "UPDATE ITEM" : "ADD TO MENU"}
                  </button>
                  {menuForm.id && (
                    <button 
                      type="button" onClick={() => { setMenuForm({ id: null, name: "", category: "Starters", price: "", description: "" }); setIsCustomCategory(false); }}
                      className="w-full bg-zinc-100 text-zinc-500 font-bold py-2 rounded-xl text-xs uppercase tracking-widest"
                    >Cancel Edit</button>
                  )}
                </form>
              </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 font-black text-xs leading-none border-2 border-red-100">
                      ₹{item.price}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-zinc-800 tracking-tight leading-none mb-1 uppercase">{item.name}</h4>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMenuForm(item)}
                      className="p-3 bg-zinc-50 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                    >✏️</button>
                    <button
                      onClick={() => deleteMenuItem(item.id)}
                      className="p-3 bg-zinc-50 text-zinc-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'gallery' ? (
          <div className="space-y-12">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">Community <span className="text-red-600 italic">Submissions</span></h2>
                  <p className="text-zinc-500 font-medium tracking-tight mt-2 italic">Review photos and captions shared by your guests.</p>
               </div>
               <div className="bg-red-50 text-red-600 font-black px-6 py-2 rounded-full text-xs uppercase tracking-widest border-2 border-red-100">
                  {pendingImages.length} PENDING APPROVAL
               </div>
            </div>

            {pendingImages.length === 0 ? (
               <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-zinc-100 text-center">
                  <div className="text-6xl mb-6">🏜️</div>
                  <h3 className="text-xl font-black text-zinc-300 uppercase tracking-widest">The queue is empty.</h3>
                  <p className="text-zinc-400 font-medium">Sit back and relax while your guests take some photos!</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {pendingImages.map(img => (
                    <div key={img.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-zinc-100 flex flex-col group">
                        <div className="relative h-64 overflow-hidden">
                           <img src={img.image_url} alt="Pending" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="p-8 flex-grow">
                           <p className="text-zinc-800 font-serif italic text-lg leading-tight mb-4">"{img.description}"</p>
                           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Submitted on {new Date(img.created_at).toLocaleDateString()}</p>
                           
                           <div className="flex gap-4">
                              <button 
                                onClick={() => handleGalleryAction(img.id, 'approve')}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95"
                              >
                                Approve ✅
                              </button>
                              <button 
                                onClick={() => handleGalleryAction(img.id, 'delete')}
                                className="flex-1 bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-400 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95"
                              >
                                Reject 🗑️
                              </button>
                           </div>
                        </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Manual Coupon Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-yellow-400 sticky top-24">
                <h3 className="text-xl font-black text-zinc-800 mb-6 uppercase tracking-tight">Create Reward Pool</h3>
                <form onSubmit={handleCouponSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Coupon Target</label>
                    <select
                      className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-yellow-500 outline-none font-bold"
                      value={couponForm.source} onChange={e => setCouponForm({ ...couponForm, source: e.target.value })}
                    >
                      <option value="manual">Manual Admin Code</option>
                      <option value="game">Game Reward Pool 🎮</option>
                      <option value="review">Review Reward Pool 🌟</option>
                    </select>
                  </div>
                  
                  <input
                    type="text" placeholder="Custom Code (Optional)"
                    className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-yellow-500 outline-none font-bold"
                    value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })}
                  />
                  
                  <button type="submit" className="w-full bg-yellow-400 text-black font-black py-4 rounded-2xl shadow-lg hover:bg-yellow-500 transition-all uppercase tracking-widest text-sm">
                    {couponForm.source === 'manual' ? "Create Now" : "Add to Pool"}
                  </button>

                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold leading-tight">
                      {couponForm.source === 'manual' ? 
                        "• Manual codes are assigned directly to you for sharing." :
                        "• Pool codes wait for users to win them. If the pool is empty, a random code will be generated."}
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* All Coupons List */}
            <div className="lg:col-span-2 space-y-8">
              {/* Reward Templates (Pool) */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black uppercase text-zinc-800 tracking-tight">Active Reward Pool (Templates)</h3>
                   <span className="bg-blue-50 text-[10px] font-black px-4 py-2 rounded-full text-blue-600 uppercase tracking-widest">
                     {coupons.filter(c => !c.user_id).length} BLUEPRINTS
                   </span>
                </div>
                
                <div className="space-y-3">
                  {coupons.filter(c => !c.user_id).map(cp => (
                    <div key={cp.id} className="group bg-zinc-50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-yellow-100 hover:shadow-xl transition-all flex items-center justify-between">
                       <div className="flex items-center gap-6">
                         <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-200 font-black text-xl tracking-tight text-zinc-800">
                           {cp.coupon_code}
                         </div>
                         <div>
                            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{cp.source}</span>
                            <div className="flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                               <span className="text-[11px] font-bold text-zinc-600 uppercase">Infinite Template</span>
                            </div>
                         </div>
                       </div>
                       
                       <button 
                         onClick={() => deleteCoupon(cp.id)}
                         className="p-4 bg-white text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                       >
                         🗑️
                       </button>
                    </div>
                  ))}
                  {coupons.filter(c => !c.user_id).length === 0 && <div className="text-center py-10 text-zinc-300 font-bold uppercase tracking-widest text-xs">No pool templates created yet</div>}
                </div>
              </div>

              {/* Customer Claims (History) */}
              <div className="bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">🎟️</div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <h3 className="text-xl font-black uppercase text-white tracking-tight">Recent Customer Claims</h3>
                   <span className="bg-white/10 text-[10px] font-black px-4 py-2 rounded-full text-zinc-400 uppercase tracking-widest leading-none">
                     HISTORY
                   </span>
                </div>
                
                <div className="space-y-4 relative z-10">
                  {coupons.filter(c => c.user_id).slice(0, 10).map(cp => (
                    <div key={cp.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="text-lg font-black text-yellow-400 tracking-wider">
                           {cp.coupon_code}
                         </div>
                         <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{cp.source}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         {cp.screenshot_url && (
                           <a href={cp.screenshot_url} target="_blank" className="text-[10px] font-black text-blue-400 underline uppercase tracking-widest">View Proof</a>
                         )}
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${cp.is_redeemed ? 'bg-zinc-800 text-zinc-500' : 'bg-green-500/10 text-green-400'}`}>
                           {cp.is_redeemed ? 'Redeemed' : 'Active'}
                         </span>
                       </div>
                    </div>
                  ))}
                  {coupons.filter(c => c.user_id).length === 0 && <div className="text-center py-10 text-zinc-600 font-bold uppercase tracking-widest text-xs">No customer claims yet</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
