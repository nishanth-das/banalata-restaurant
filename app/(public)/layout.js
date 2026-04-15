import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-zinc-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            {/* Brand Branding */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-3xl font-black text-red-600 tracking-tighter mb-6 underline decoration-yellow-400">BANALATA</h3>
              <p className="text-zinc-400 text-sm leading-relaxed text-center md:text-left mb-6 max-w-xs">
                Authentic Bengali Desi Dhaba serving the finest traditional recipes. Your destination for taste and heritage.
              </p>

              <h4 className="font-black text-white uppercase tracking-widest text-xs mb-4">Follow Us On</h4>
              <div className="flex gap-4">
                <a href="https://facebook.com" className="w-10 h-10 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9 8H7v4h2v9h4v-9h3.61L17 8h-4V7a1 1 0 0 1 1-1h2V2h-3c-3 0-5 2-5 5v1z" /></svg>
                </a>
                <a href="https://instagram.com" className="w-10 h-10 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a href="https://youtube.com" className="w-10 h-10 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="font-black text-white uppercase tracking-widest text-sm mb-8 border-b-2 border-red-600 pb-2">Quick Navigation</h4>
              <div className="flex flex-col gap-4 text-zinc-400 font-bold text-sm text-center md:text-left">
                <Link href="/" className="hover:text-red-500 transition-colors">Home</Link>
                <Link href="/menu" className="hover:text-red-500 transition-colors">Menu</Link>
                <Link href="/gallery" className="hover:text-red-500 transition-colors">Signature Gallery 📸</Link>
                <Link href="/game" className="hover:text-red-500 transition-colors">Play & Win 🎮</Link>
                <Link href="/contact" className="hover:text-red-500 transition-colors">Contact Us</Link>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="font-black text-white uppercase tracking-widest text-sm mb-8 border-b-2 border-red-600 pb-2">Find Us</h4>
              <p className="text-zinc-400 text-sm mb-4">Dalura Rd (Beside Bir Bikram College of Pharmacy), Khayerpur, Old Agartala, Agartala, India, 799008</p>
              <p className="text-zinc-400 text-sm mb-4 font-black">Phone: +91 98624 52313</p>
              <p className="text-zinc-400 text-sm">Open 10:00 AM - 11:30 PM</p>
            </div>
          </div>

          <div className="pt-10 border-t border-zinc-800 text-center flex flex-col gap-4">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
              © 2026 BANALATA BENGALI DESI DHABA. ALL RIGHTS RESERVED.
            </p>
            <p className="text-zinc-500 text-sm font-medium">
              Made by <a href="https://your-portfolio-link.com" target="_blank" className="text-red-500 hover:underline hover:text-yellow-400 transition-all font-black">Nishanth Das</a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
