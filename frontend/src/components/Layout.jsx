import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Spacer: réserve la place du header fixed */}
      <div className="h-[110px] md:h-[120px]" aria-hidden="true" />

      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
