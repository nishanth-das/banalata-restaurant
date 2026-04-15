import "../styles/globals.css";

export const metadata = {
  title: "BANALATA Bengali Desi Dhaba",
  description: "Traditional Bengali Desi Dhaba",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen font-sans antialiased text-gray-900 bg-zinc-50">
        {children}
      </body>
    </html>
  );
}
