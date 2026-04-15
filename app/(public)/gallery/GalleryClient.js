"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { uploadGalleryImage, fetchApprovedImages } from "@/lib/gallery";
import Link from "next/link";

export default function GalleryClient({ initialData }) {
  const [images, setImages] = useState(initialData);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ files: [], description: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleUpload = async () => {
    if (form.files.length === 0) return setMessage("Please select at least one photo.");
    if (form.files.length > 5) return setMessage("You can only upload 5 photos at a time.");
    if (!form.description) return setMessage("Please add a short description for SEO.");

    setUploading(true);
    setMessage("");

    try {
      let successCount = 0;
      for (const file of form.files) {
        setMessage(`Optimizing & Uploading image ${successCount + 1} of ${form.files.length}...`);
        await uploadGalleryImage(file, form.description, user.id);
        successCount++;
      }
      
      setMessage(`🎉 ${successCount} photos submitted! They will appear after Admin approval.`);
      setForm({ files: [], description: "" });
      setTimeout(() => setIsModalOpen(false), 3000);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      {/* 🚀 UPLOAD CTA 🚀 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 bg-zinc-50 p-8 md:p-12 rounded-[3rem] border border-zinc-100 shadow-sm relative overflow-hidden group">
         <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all duration-1000"></div>
         <div>
            <h2 className="text-3xl font-black text-zinc-900 mb-2 leading-none">Shared a meal with us?</h2>
            <p className="text-zinc-500 font-medium tracking-tight">Post your favorite dishes and help others discover the taste of Banalata.</p>
         </div>
         
         {user ? (
            <button 
              onClick={() => {
                setForm({ files: [], description: "" });
                setMessage("");
                setIsModalOpen(true);
              }}
              className="bg-zinc-900 text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:bg-red-600 transition-all whitespace-nowrap active:scale-95 flex items-center gap-3 uppercase text-xs tracking-widest"
            >
               Upload Your Moment 📸
            </button>
         ) : (
            <Link 
              href="/login"
              className="bg-zinc-900 text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:bg-black transition-all whitespace-nowrap active:scale-95 flex items-center gap-3 uppercase text-xs tracking-widest"
            >
               Login to Share 🔒
            </Link>
         )}
      </div>

      {/* 🖼️ THE GALLERY GRID 🖼️ */}
      {images.length === 0 ? (
        <div className="text-center py-20 opacity-30">
           <div className="text-6xl mb-4">🌫️</div>
           <p className="font-black uppercase tracking-[0.2em] text-xs">The gallery is waiting for its first moment...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((img) => (
            <div key={img.id} className="group relative break-inside-avoid overflow-hidden rounded-[2.5rem] bg-zinc-100 shadow-xl border border-white hover:shadow-2xl transition-all duration-500">
               <img 
                  src={img.image_url} 
                  alt={`Banalata Dhaba: ${img.description}`} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 min-h-[300px]"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                  <p className="text-white font-serif italic text-lg mb-2 leading-tight">"{img.description}"</p>
                  <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest">Captured on {new Date(img.created_at).toLocaleDateString()}</p>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* 📤 UPLOAD MODAL 📤 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] w-full max-w-lg relative animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 md:top-8 md:right-8 text-zinc-400 hover:text-zinc-900 transition-colors text-2xl z-20"
              >✕</button>

              <h3 className="text-2xl md:text-3xl font-black text-zinc-900 mb-6 md:mb-8 tracking-tighter">New <span className="text-yellow-500 italic font-serif">Community post</span></h3>
              
              <div className="space-y-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Select Photos (Max 5)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={(e) => setForm({...form, files: Array.from(e.target.files)})}
                      className="text-[10px] text-zinc-500 file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200 cursor-pointer"
                    />
                    {form.files.length > 0 && <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest ml-2">{form.files.length} photos selected</p>}
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Short Description (for SEO)</label>
                    <textarea 
                      placeholder="What are we looking at? e.g. The crispy luchi at Banalata"
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                      rows={3}
                      className="p-6 bg-zinc-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-3xl outline-none transition-all text-sm font-medium border-dashed border-zinc-200"
                    />
                 </div>

                 {message && (
                   <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${message.startsWith('Error') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {message}
                   </div>
                 )}

                 <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95"
                 >
                    {uploading ? "Optimizing & Uploading..." : "POST TO GALLERY →"}
                 </button>
                 
                 <p className="text-[10px] text-center text-zinc-400 font-medium px-4">
                    *Your photo will be optimized to WebP and reviewed by our team before going live.
                 </p>
              </div>
           </div>
        </div>
      )}
    </section>
  );
}
