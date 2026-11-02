import React from 'react';
import { EcoNav } from '../components/EcoNav';
import { AboutSection } from '../components/home/AboutSection';
import { EcoFooter } from '../components/home/EcoFooter';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101828] antialiased selection:bg-[#009B70] selection:text-white">
      {/* Navigation */}
      <EcoNav />

      <main id="main-content" tabIndex={-1} className="pt-24 focus:outline-hidden">
        {/* Mission, Vision, SWM Compliance & Municipal Governance */}
        <AboutSection />
      </main>

      {/* Footer */}
      <EcoFooter />
    </div>
  );
};

export default AboutPage;

