import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Info,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { getGuideContent, GuideCategory } from '../../i18n/guide';

interface SegregationGuideProps {
  userLocale?: string | null;
}

export const SegregationGuide: React.FC<SegregationGuideProps> = ({ userLocale }) => {
  const content = useMemo(() => getGuideContent(userLocale), [userLocale]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'streams' | 'guidelines'>('streams');

  // Filter categories based on search or selected tab
  const filteredCategories = useMemo(() => {
    let list = content.categories;
    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list
        .map((cat) => {
          const matchAccepted = cat.acceptedItems.filter((i) => i.toLowerCase().includes(q));
          const matchProhibited = cat.prohibitedItems.filter((i) => i.toLowerCase().includes(q));
          const nameMatch = cat.name.toLowerCase().includes(q) || cat.binColor.toLowerCase().includes(q);
          if (nameMatch || matchAccepted.length > 0 || matchProhibited.length > 0) {
            return {
              ...cat,
              acceptedItems: nameMatch && matchAccepted.length === 0 ? cat.acceptedItems : matchAccepted.length > 0 ? matchAccepted : cat.acceptedItems,
              prohibitedItems: nameMatch && matchProhibited.length === 0 ? cat.prohibitedItems : matchProhibited.length > 0 ? matchProhibited : cat.prohibitedItems,
            };
          }
          return null;
        })
        .filter((c): c is GuideCategory => c !== null);
    }
    return list;
  }, [content, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Source Segregation Standard
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{content.guideTitle}</h2>
            <p className="text-emerald-100 text-sm">{content.guideSubtitle}</p>
          </div>
          <div className="hidden sm:flex bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-6 relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={content.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
          />
        </div>
      </div>

      {/* Main Mode Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('streams')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'streams'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Waste Streams &amp; Bins ({content.categories.length})
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'guidelines'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dos &amp; Don'ts Guidelines
        </button>
      </div>

      {activeTab === 'streams' ? (
        <div className="space-y-6">
          {/* Category Pill Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Streams
            </button>
            {content.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={
                  selectedCategory === cat.id
                    ? { backgroundColor: cat.colorCode }
                    : {}
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedCategory === cat.id ? '#ffffff' : cat.colorCode }}
                />
                {cat.binColor}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {filteredCategories.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">No waste items matching &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for generic terms like &ldquo;plastic&rdquo;, &ldquo;paper&rdquo;, or &ldquo;kitchen&rdquo;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.colorCode }}
                        />
                        <h3 className="font-semibold text-gray-900 text-base">{cat.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                      style={{ backgroundColor: cat.bgLight, color: cat.colorCode }}
                    >
                      {cat.binColor}
                    </span>
                  </div>

                  {/* Accepted Items */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      What Goes In
                    </div>
                    <ul className="grid grid-cols-1 gap-1 text-xs text-gray-700">
                      {cat.acceptedItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold leading-none mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prohibited Items */}
                  {cat.prohibitedItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      <div className="text-xs font-semibold text-rose-800 flex items-center gap-1.5 uppercase tracking-wide">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Do Not Mix Here
                      </div>
                      <ul className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                        {cat.prohibitedItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-400 font-bold leading-none mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Instructions */}
                  {cat.instructions.length > 0 && (
                    <div
                      className="rounded-xl p-3 text-xs space-y-1"
                      style={{ backgroundColor: cat.bgLight }}
                    >
                      <div className="font-semibold flex items-center gap-1" style={{ color: cat.colorCode }}>
                        <Info className="w-3 h-3" />
                        Disposal Protocol
                      </div>
                      {cat.instructions.map((inst, idx) => (
                        <p key={idx} className="text-gray-700 pl-4 relative">
                          <span className="absolute left-1 top-0 text-gray-400 font-mono text-[10px]">{idx + 1}.</span>
                          {inst}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Guidelines / Dos & Don'ts Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dos Card */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Community Segregation Best Practices (Dos)
            </div>
            <ul className="space-y-3">
              {content.dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-emerald-950 leading-relaxed">
                  <div className="bg-emerald-100 p-1 rounded-md text-emerald-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts Card */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Critical Prohibitions &amp; Violations (Don&apos;ts)
            </div>
            <ul className="space-y-3">
              {content.donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-950 leading-relaxed">
                  <div className="bg-rose-100 p-1 rounded-md text-rose-700 shrink-0 mt-0.5">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
