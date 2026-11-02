import React from 'react';
import { EcoNav } from '../components/EcoNav';
import { BlogSection } from '../components/home/BlogSection';
import { FAQSection } from '../components/home/FAQSection';
import { EcoFooter } from '../components/home/EcoFooter';

export const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101828] antialiased selection:bg-[#009B70] selection:text-white">
      {/* Navigation */}
      <EcoNav />

      <main id="main-content" tabIndex={-1} className="pt-24 focus:outline-hidden">
        {/* Civic Knowledge Base, Articles & Segregation Guides */}
        <BlogSection />

        {/* FAQ Section (Merged into Blog) */}
        <FAQSection />
      </main>

      {/* Footer */}
      <EcoFooter />
    </div>
  );
};

export default BlogPage;

