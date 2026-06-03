import Navbar from "./Navbar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-transparent">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
