"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { generateCouponCode, saveCoupon } from "@/lib/coupon";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ADMIN_EMAILS } from "@/lib/admins";
import { fetchPendingImages, moderateImage } from "@/lib/gallery";
import { processMenuImage } from "@/lib/imageProcessor";

const MENU_CATEGORIES = [
  "Breakfast", "Soup", "Snacks", "Sandwich", "Momos", "Rice", "Tea & Coffee", 
  "Chinese Starter - Veg", "Chinese Starter - Non Veg", "Daal", "Chinese Rice", 
  "Chinese Gravy", "Desi Style Meat", "Meat Indian Style", "Special Fish", "Egg", 
  "Sutki", "Fry", "Salad", "Roti", "Tandoori", "Roti/Naan", "Noodles", "Biryani", 
  "Desert", "Shakes", "Mocktail", "Fresh Juice", "Chef's Special", "Signature Item"
];

export default function AdminPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use searchParams or default to menu
  const activeTab = searchParams.get('tab') || "menu";
  
  // Menu State
  const [menuItems, setMenuItems] = useState([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [menuForm, setMenuForm] = useState({ 
    id: null, 
    name: "", 
    category: "Breakfast", 
    price: "", 
    description: "", 
    menu_type: "regular",
    dietary_preference: "none",
    image_url: "" 
  });
  const [menuImage, setMenuImage] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState(null);
  
  // Coupon State
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: "", source: "manual", expires_at: "", reward_text: "" });

  // Customers State
  const [profiles, setProfiles] = useState([]);

  // Gallery State
  const [pendingImages, setPendingImages] = useState([]);
  const [approvedImages, setApprovedImages] = useState([]);
  const [galleryUploadForm, setGalleryUploadForm] = useState({ description: "" });
  const [galleryImage, setGalleryImage] = useState(null);
  const [galleryTab, setGalleryTab] = useState('pending'); // 'pending' or 'live'

  // Inquiries State
  const [inquiries, setInquiries] = useState([]);

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
    fetchProfiles();
    fetchInquiries();
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
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
    const pending = await fetchPendingImages();
    const approved = await fetchApprovedImages();
    setPendingImages(pending || []);
    setApprovedImages(approved || []);
  };

  const fetchInquiries = async () => {
    const { data } = await supabase.from('party_inquiries').select('*').order('created_at', { ascending: false });
    setInquiries(data || []);
  };

  const handleAdminGalleryUpload = async (e) => {
    e.preventDefault();
    if (!galleryImage) return alert("Select an image first!");
    setLoading(true);
    try {
      await uploadGalleryImage(galleryImage, galleryUploadForm.description, user.id, true);
      setGalleryImage(null);
      setGalleryUploadForm({ description: "" });
      fetchGallery();
      alert("Photo uploaded directly to live gallery!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryAction = async (id, action) => {
    await moderateImage(id, action);
    fetchGallery();
  };

  // --- Menu Handlers ---
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalImageUrl = menuForm.image_url;

      // 1. Upload Image if a new one is selected
      if (menuImage) {
        const fileName = `${Date.now()}-${menuImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, menuImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrl;
      }

      const itemData = {
        name: menuForm.name,
        category: menuForm.category,
        price: parseInt(menuForm.price),
        description: menuForm.description,
        menu_type: menuForm.menu_type,
        dietary_preference: menuForm.dietary_preference,
        image_url: finalImageUrl
      };

      let result;
      if (menuForm.id) {
        result = await supabase.from('menu').update(itemData).eq('id', menuForm.id);
      } else {
        result = await supabase.from('menu').insert([itemData]);
      }

      if (result.error) throw result.error;

      setMenuForm({ id: null, name: "", category: "Breakfast", price: "", description: "", menu_type: "regular", dietary_preference: "none", image_url: "" });
      setMenuImage(null);
      setMenuImagePreview(null);
      setIsCustomCategory(false);
      fetchMenu();
      alert("Dish saved successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
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
      // If creating for a pool, userId is null
      const isPool = couponForm.source !== 'manual';
      const targetUserId = isPool ? null : user.id;
      
      const expiresAt = couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null;

      let finalCode = couponForm.code;
      if (!finalCode) {
        if (couponForm.reward_text) {
          // e.g. "Free Munch" -> "FREE-MUNCH"
          finalCode = couponForm.reward_text.toUpperCase().trim().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
        } else {
          finalCode = generateCouponCode();
        }
      }

      await saveCoupon(targetUserId, finalCode, couponForm.source, null, expiresAt, couponForm.reward_text);
      setCouponForm({ code: "", source: "manual", expires_at: "", reward_text: "" });
      fetchCoupons();
      alert("Coupon Added Successfully!");
    } catch (err) {
      alert("Error adding coupon: " + err.message);
    }
  };

  const markCouponRedeemed = async (id) => {
    const { error } = await supabase.from('coupons').update({ is_redeemed: true }).eq('id', id);
    if (error) {
       alert("Error marking redeemed: " + error.message);
    } else {
       fetchCoupons();
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Phone Number", "Email", "Total Coupons Claimed"];
    const csvContent = [
      headers.join(","),
      ...profiles.map(p => {
        const userCouponsCount = coupons.filter(c => c.user_id === p.id).length;
        // Escape quotes and wrap in quotes for robust CSV
        const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        return [
          escapeCSV(p.full_name),
          escapeCSV(p.phone_number),
          escapeCSV(p.email || 'N/A'),
          userCouponsCount
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Banalata_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                      {MENU_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {existingCategories.filter(c => !MENU_CATEGORIES.includes(c)).map(c => (
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

                  {/* Menu Type Toggle */}
                  <div className="flex bg-zinc-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setMenuForm({...menuForm, menu_type: 'regular'})}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${menuForm.menu_type === 'regular' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-400'}`}
                    >Regular</button>
                    <button
                      type="button"
                      onClick={() => setMenuForm({...menuForm, menu_type: 'party'})}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${menuForm.menu_type === 'party' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-400'}`}
                    >Party Package</button>
                  </div>

                  {/* Dietary Preference Toggle */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Dietary Preference</label>
                    <div className="flex bg-zinc-100 p-1 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setMenuForm({...menuForm, dietary_preference: 'veg'})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${menuForm.dietary_preference === 'veg' ? 'bg-white text-green-600 shadow-sm' : 'text-zinc-400'}`}
                      >🟢 Veg</button>
                      <button
                        type="button"
                        onClick={() => setMenuForm({...menuForm, dietary_preference: 'non-veg'})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${menuForm.dietary_preference === 'non-veg' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-400'}`}
                      >🔴 Non-Veg</button>
                      <button
                        type="button"
                        onClick={() => setMenuForm({...menuForm, dietary_preference: 'none'})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${menuForm.dietary_preference === 'none' ? 'bg-white text-zinc-600 shadow-sm' : 'text-zinc-400'}`}
                      >⚪ N/A</button>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Dish Image</label>
                    <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 aspect-video flex items-center justify-center bg-zinc-50">
                      {(menuImagePreview || menuForm.image_url) ? (
                        <img src={menuImagePreview || menuForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <span className="text-3xl block mb-2">📸</span>
                          <span className="text-[8px] font-black uppercase text-zinc-400">Click to upload</span>
                        </div>
                      )}
                      <input 
                        type="file" accept="image/*" 
                        onChange={async (e) => {
                          const f = e.target.files[0];
                          if (f) {
                            try {
                              // 🔥 MAGIC HAPPENS HERE: Auto-crop and compress
                              const processedBlob = await processMenuImage(f);
                              const processedFile = new File([processedBlob], f.name, { type: "image/webp" });
                              
                              setMenuImage(processedFile);
                              setMenuImagePreview(URL.createObjectURL(processedFile));
                            } catch (err) {
                              alert("Failed to process image. Try a different one.");
                            }
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-red-700 transition-all uppercase tracking-widest text-sm">
                    {menuForm.id ? "UPDATE ITEM" : "ADD TO MENU"}
                  </button>
                  {menuForm.id && (
                    <button 
                      type="button" onClick={() => { setMenuForm({ id: null, name: "", category: "Breakfast", price: "", description: "", menu_type: "regular", dietary_preference: "none", image_url: "" }); setIsCustomCategory(false); setMenuImagePreview(null); }}
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
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-black text-zinc-800 tracking-tight leading-none uppercase">
                          {item.dietary_preference === 'veg' && <span className="text-green-500 mr-2 text-sm">🟢</span>}
                          {item.dietary_preference === 'non-veg' && <span className="text-red-500 mr-2 text-sm">🔴</span>}
                          {item.name}
                        </h4>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${item.menu_type === 'party' ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                          {item.menu_type}
                        </span>
                      </div>
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
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">Community <span className="text-red-600 italic">Gallery</span></h2>
                  <p className="text-zinc-500 font-medium tracking-tight mt-2 italic">Manage what the world sees of Banalata.</p>
               </div>
               
               {/* Gallery Sub-Tabs */}
               <div className="flex bg-zinc-100 p-1 rounded-2xl">
                 <button 
                   onClick={() => setGalleryTab('pending')}
                   className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${galleryTab === 'pending' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-400'}`}
                 >Pending ({pendingImages.length})</button>
                 <button 
                   onClick={() => setGalleryTab('live')}
                   className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${galleryTab === 'live' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-400'}`}
                 >Live Gallery ({approvedImages.length})</button>
                 <button 
                   onClick={() => setGalleryTab('upload')}
                   className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${galleryTab === 'upload' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400'}`}
                 >+ Admin Upload</button>
               </div>
            </div>

            {galleryTab === 'pending' ? (
              pendingImages.length === 0 ? (
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
              )
            ) : galleryTab === 'live' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {approvedImages.map(img => (
                    <div key={img.id} className="relative group rounded-3xl overflow-hidden aspect-square shadow-lg border-2 border-white">
                       <img src={img.image_url} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                          <p className="text-white text-[10px] font-bold mb-4 line-clamp-3">"{img.description}"</p>
                          <button 
                            onClick={() => handleGalleryAction(img.id, 'delete')}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-110 transition-all"
                          >
                            Delete Forever 🗑️
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="max-w-xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border-t-8 border-red-600">
                 <h3 className="text-2xl font-black text-zinc-900 mb-8 uppercase tracking-tighter">Admin <span className="text-red-600 italic">Direct Upload</span></h3>
                 <form onSubmit={handleAdminGalleryUpload} className="space-y-6">
                    <div className="aspect-video bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                       {galleryImage ? (
                         <img src={URL.createObjectURL(galleryImage)} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-zinc-300 font-black uppercase tracking-widest text-xs">Drop Photo Here</span>
                       )}
                       <input 
                         type="file" accept="image/*" required
                         onChange={e => setGalleryImage(e.target.files[0])}
                         className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                    </div>
                    <textarea 
                      placeholder="Enter a caption for this moment..."
                      required
                      className="w-full p-6 bg-zinc-50 border-2 border-zinc-100 rounded-3xl outline-none focus:border-red-600 font-bold italic"
                      value={galleryUploadForm.description}
                      onChange={e => setGalleryUploadForm({ ...galleryUploadForm, description: e.target.value })}
                    />
                    <button type="submit" className="w-full bg-red-600 text-white font-black py-6 rounded-2xl shadow-xl uppercase tracking-widest text-sm hover:bg-red-700 transition-all">
                       Post to Live Gallery 🚀
                    </button>
                 </form>
              </div>
            )}
          </div>
        ) : activeTab === 'coupons' ? (
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
                      <option value="game_minor">Game Pool: Minor Reward (Levels 1-9) 🍫</option>
                      <option value="game_grand">Game Pool: Grand Prize (Level 10) 🏆</option>
                      <option value="review">Review Reward Pool 🌟</option>
                    </select>
                  </div>
                  
                  <input
                    type="text" placeholder="Custom Code (Optional)"
                    className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-yellow-500 outline-none font-bold"
                    value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })}
                  />

                  <input
                    type="text" placeholder="Reward Description (e.g. Free Munch or 15% OFF)"
                    className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-yellow-500 outline-none font-bold text-zinc-800"
                    value={couponForm.reward_text} onChange={e => setCouponForm({ ...couponForm, reward_text: e.target.value })}
                  />

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Valid Until (Optional)</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-yellow-500 outline-none font-bold text-zinc-500"
                      value={couponForm.expires_at} onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                    />
                  </div>
                  
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
                            {cp.reward_text && <span className="block text-sm font-bold text-yellow-600 mb-1">{cp.reward_text}</span>}
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
                  {coupons.filter(c => c.user_id).slice(0, 10).map(cp => {
                    const prof = profiles.find(p => p.id === cp.user_id);
                    return (
                    <div key={cp.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                         <div className="flex flex-col items-start gap-1 mb-1">
                           <div className="flex items-center gap-3">
                             <div className="text-lg font-black text-yellow-400 tracking-wider">
                               {cp.coupon_code}
                             </div>
                             <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white uppercase tracking-widest">{cp.source}</span>
                           </div>
                           {cp.reward_text && (
                             <span className="text-sm font-bold text-red-400">{cp.reward_text}</span>
                           )}
                         </div>
                         <div className="text-sm font-bold text-zinc-300">
                           {prof ? `${prof.full_name} • ${prof.phone_number}` : 'Unknown Customer'}
                         </div>
                       </div>
                       <div className="flex flex-wrap items-center gap-3">
                         {cp.screenshot_url && (
                           <a href={cp.screenshot_url} target="_blank" className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/40 transition-all uppercase tracking-widest flex items-center gap-1">
                             <span>🖼️</span> View Proof
                           </a>
                         )}
                         {cp.expires_at && (
                           <span className="text-[10px] font-bold text-red-400 uppercase bg-red-500/10 px-2 py-1 rounded">Exp: {new Date(cp.expires_at).toLocaleDateString()}</span>
                         )}
                         <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${cp.is_redeemed ? 'bg-zinc-800 text-zinc-500' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                           {cp.is_redeemed ? 'Redeemed' : 'Active'}
                         </span>
                         {!cp.is_redeemed && (
                            <button onClick={() => markCouponRedeemed(cp.id)} className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-yellow-400 text-black hover:bg-yellow-500 hover:scale-105 transition-all shadow-lg shadow-yellow-400/20">Mark Used</button>
                         )}
                       </div>
                    </div>
                  )})}
                  {coupons.filter(c => c.user_id).length === 0 && <div className="text-center py-10 text-zinc-600 font-bold uppercase tracking-widest text-xs">No customer claims yet</div>}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'customers' && (
           <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border-b-8 border-yellow-400">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Customer CRM</h2>
                  <p className="text-zinc-500 font-medium text-sm mt-1">Manage profiles and marketing data</p>
                </div>
                 <div className="flex items-center gap-4">
                  <div className="bg-yellow-50 text-yellow-600 font-black text-xl px-6 py-3 rounded-2xl border-2 border-yellow-100 flex items-center gap-3 shadow-inner">
                    <span>👥</span> {profiles.length} <span className="text-sm">Total</span>
                  </div>
                  <button 
                    onClick={exportToCSV}
                    className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-2xl shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    <span>📊</span> Export Excel
                  </button>
                </div>
             </div>

             <div className="space-y-6">
                {profiles.map(profile => {
                   const userCoupons = coupons.filter(c => c.user_id === profile.id);
                   return (
                     <div key={profile.id} className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 hover:border-yellow-200 transition-all">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                         <div>
                            <h4 className="text-xl font-black text-zinc-800 tracking-tight">{profile.full_name || "Unknown"}</h4>
                            <p className="text-sm font-bold text-zinc-500">{profile.phone_number || "No Phone"}</p>
                         </div>
                         <div className="flex gap-2">
                            <span className="bg-white border border-zinc-200 text-xs font-black uppercase px-4 py-2 rounded-xl text-zinc-600">
                              🎟️ {userCoupons.length} Coupons
                            </span>
                         </div>
                       </div>

                       {userCoupons.length > 0 && (
                          <div className="bg-white rounded-2xl p-4 border border-zinc-100 flex flex-wrap gap-3">
                             {userCoupons.map(cp => (
                               <div key={cp.id} className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100">
                                  <span className={`text-sm font-black ${cp.is_redeemed ? 'text-zinc-400 line-through' : 'text-yellow-600'}`}>{cp.coupon_code}</span>
                                  {!cp.is_redeemed && (
                                     <button 
                                       onClick={() => markCouponRedeemed(cp.id)} 
                                       className="text-[10px] font-black uppercase text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl shadow-md hover:-translate-y-0.5 transition-all ml-auto"
                                     >
                                       Redeem Now
                                     </button>
                                  )}
                               </div>
                             ))}
                          </div>
                       )}
                     </div>
                   );
                })}
             </div>
           </div>
        )}
      </div>
  );
}
