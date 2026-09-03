'use client';

import { useEffect } from 'react';
import { Navbar } from '@/components/landing/layout/Navbar';
import { HeroSection } from '@/components/landing/sections/HeroSection';
import { StatsBar } from '@/components/landing/sections/StatsBar';
import { ProblemSection } from '@/components/landing/sections/ProblemSection';
// import { WorkflowSection } from '@/components/landing/sections/WorkflowSection';
import { FeaturesSection } from '@/components/landing/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/sections/HowItWorksSection';
import { KPISection } from '@/components/landing/sections/KPISection';
import { PlatformSection } from '@/components/landing/sections/PlatformSection';
import { CorridorSection } from '@/components/landing/sections/CorridorSection';
import { ComparisonSection } from '@/components/landing/sections/ComparisonSection';
import { TestimonialsSection } from '@/components/landing/sections/TestimonialsSection';
import { SecuritySection } from '@/components/landing/sections/SecuritySection';
import { CTABanner } from '@/components/landing/sections/CTABanner';

export default function Home() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0A1628' }}>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <ProblemSection />
        {/* <WorkflowSection /> */}
        <FeaturesSection />
        <HowItWorksSection />
        <KPISection />
        <PlatformSection />
        <CorridorSection />
        <ComparisonSection />
        <TestimonialsSection />
        <SecuritySection />
        <CTABanner />
      </main>
    </div>
  );
}
