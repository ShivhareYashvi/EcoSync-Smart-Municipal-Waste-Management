import React from 'react';
import { EcoNav } from '../components/EcoNav';
import { BhopalOperationsSection } from '../components/home/BhopalOperationsSection';
import { RecyclingSection } from '../components/home/RecyclingSection';
import { EcoFooter } from '../components/home/EcoFooter';

export const OperationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101828] antialiased selection:bg-[#009B70] selection:text-white">
      {/* Navigation */}
      <EcoNav />

      <main id="main-content" tabIndex={-1} className="pt-24 focus:outline-hidden">
        {/* Operations Command View & Real-time Telemetry */}
        <BhopalOperationsSection />

        {/* Recycling & Circular Loop (Merged into Operations) */}
        <RecyclingSection />
      </main>

      {/* Footer */}
      <EcoFooter />
    </div>
  );
};

export default OperationsPage;

