import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-transparent pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 flex flex-col p-4 md:p-8">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
