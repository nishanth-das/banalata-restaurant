import { supabase } from '@/lib/supabaseClient';
import GalleryClient from './GalleryClient';

export const dynamic = 'force-dynamic';

// 🌟 DYNAMIC SEO 🌟
// This helps Google index your restaurant's popular dishes based on real user photos!
export async function generateMetadata() {
  const { data: images } = await supabase
    .from('gallery')
    .select('description')
    .eq('is_approved', true)
    .limit(5);

  const keywords = images?.map(img => img.description).filter(Boolean).join(', ') || 'Authentic Bengali Food';

  return {
    title: 'Signature Gallery | Banalata Bengali Desi Dhaba',
    description: `Experience the visual feast of Banalata. Genuine moments captured at our Dhaba. Featuring: ${keywords.substring(0, 150)}...`,
    openGraph: {
      title: 'Banalata Community Gallery',
      description: 'A visual journey through authentic Bengali flavors and traditions.',
    },
  };
}

export default async function GalleryPage() {
  // Fetch initial data on the server for faster LCP (Largest Contentful Paint)
  const { data: initialImages } = await supabase
    .from('gallery')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      {/* 📸 HERO SECTION 📸 */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-40 scale-105"
          style={{ backgroundImage: "url('/images/hero.png')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10"></div>
        
        <div className="relative z-20 text-center px-4">
          <span className="text-red-600 font-black text-sm uppercase tracking-[0.5em] mb-4 block">Our Visual Story</span>
          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter">
            Signature <span className="text-yellow-500 italic font-serif">Moments</span>
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto mt-6 font-medium">
            A collection of genuine memories, flavors, and traditions captured by our community.
          </p>
        </div>
      </section>

      {/* 🖼️ INTERACTIVE GALLERY 🖼️ */}
      <GalleryClient initialData={initialImages || []} />
    </div>
  );
}
