export default function Contact() {
  return (
    <div className="py-24 px-4 bg-yellow-50 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-16 md:mb-20 text-center px-4">
          <span className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block leading-none">Get In Touch</span>
          <h2 className="text-5xl lg:text-8xl font-black text-zinc-900 mb-6 md:mb-8 tracking-tighter leading-none">
            Contact <span className="text-red-600 italic">Us</span>
          </h2>
          <div className="w-24 md:w-32 h-2 bg-yellow-400 mx-auto rounded-full shadow-sm"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-stretch">
          {/* Contact Info */}
          <div className="flex flex-col justify-between space-y-8 lg:space-y-12">
            <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border-2 border-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

              <h3 className="text-3xl font-black text-zinc-900 mb-8 relative z-10">Visit Banalata</h3>
              <div className="space-y-6 md:space-y-8 text-zinc-600 relative z-10">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-black text-zinc-800 text-sm uppercase tracking-widest mb-1">Our Location</p>
                    <p className="font-medium text-lg">Dalura Rd (Beside Bir Bikram College of Pharmacy), Khayerpur, Old Agartala, Agartala, India, 799008</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="font-black text-zinc-800 text-sm uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="font-black text-2xl text-red-600 tracking-tighter">+91 98624 52313</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <p className="font-black text-zinc-800 text-sm uppercase tracking-widest mb-1">Email Support</p>
                    <p className="font-medium">contact@banalata.com</p>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/919862452313"
              target="_blank"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-6 px-8 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-4 text-xl active:scale-95"
            >
              <span className="text-3xl">💬</span> CHAT ON WHATSAPP
            </a>
          </div>

          {/* Map Section */}
          <div className="bg-white p-4 rounded-[4rem] shadow-2xl border-4 border-white h-full min-h-[300px] lg:min-h-[500px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3649.25109361283!2d91.3501125!3d23.845215899999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3753f30003862d99%3A0x745530305f75ae36!2sBanalata!5e0!3m2!1sen!2sin!4v1777654653120!5m2!1sen!2sin"
              className="w-full h-full rounded-[3rem] min-h-[250px] lg:min-h-[450px]"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
