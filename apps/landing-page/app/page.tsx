import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HeroSection } from "./components/sections/HeroSection";
import { StatsBar } from "./components/sections/StatsBar";
import { ProblemSection } from "./components/sections/ProblemSection";
import { WorkflowSection } from "./components/sections/WorkflowSection";
import { FeaturesSection } from "./components/sections/FeaturesSection";
import { HowItWorksSection } from "./components/sections/HowItWorksSection";
import { PlatformSection } from "./components/sections/PlatformSection";
import { KPISection } from "./components/sections/KPISection";
import { CorridorSection } from "./components/sections/CorridorSection";
import { ComparisonSection } from "./components/sections/ComparisonSection";
import { TestimonialsSection } from "./components/sections/TestimonialsSection";
import { SecuritySection } from "./components/sections/SecuritySection";
import { CTABanner } from "./components/sections/CTABanner";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <ProblemSection />
        <WorkflowSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PlatformSection />
        <KPISection />
        <CorridorSection />
        <ComparisonSection />
        <TestimonialsSection />
        <SecuritySection />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
