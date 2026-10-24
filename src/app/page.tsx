import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ToolDirectory from "@/components/home/ToolDirectory";
import { isCategoryFilter } from "@/lib/tools/catalog";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { category } = await searchParams;
  const initialCategory = isCategoryFilter(category) ? category : "all";
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <main id="main-content">
        <HeroSection />
        <ToolDirectory key={initialCategory} initialCategory={initialCategory} />
      </main>
      <Footer />
    </>
  );
}
