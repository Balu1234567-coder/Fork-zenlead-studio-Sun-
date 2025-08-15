import { Hero } from "@/components/Hero";
import { FeatureSection } from "@/components/FeatureSection";
import { PricingCards } from "@/components/PricingCards";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { UseCasesSection } from "@/components/UseCasesSection";
import { Footer } from "@/components/Footer";
import DebugApiStatus from "@/components/DebugApiStatus";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      <Hero />

      {/* Temporary debug component - remove after fixing the 500 error */}
      <div className="py-8">
        <DebugApiStatus />
      </div>

      <FeatureSection />
      <HowItWorks />
      <UseCasesSection />
      <PricingCards />
      <Footer />
    </div>
  );
};

export default Index;
