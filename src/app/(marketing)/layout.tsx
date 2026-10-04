import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

/** Layout for all public marketing pages. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
