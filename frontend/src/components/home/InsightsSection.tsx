import React from 'react';
import { BlogSection } from './BlogSection';

export { BLOG_ARTICLES, type BlogArticle as InsightArticle } from './BlogSection';

/**
 * @deprecated Use `BlogSection` instead. Retained for backwards compatibility.
 */
export const InsightsSection: React.FC = () => {
  return <BlogSection />;
};
