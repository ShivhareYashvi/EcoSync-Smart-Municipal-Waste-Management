import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  Coins,
  Cpu,
  FileCheck2,
  Gift,
  Layers,
  Leaf,
  MapPin,
  MapPinned,
  MessageSquareWarning,
  Navigation,
  Recycle,
  Scale,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureModule {
  title: string;
  badge: string;
  role: string;
  status: string;
  icon: typeof Truck;
  summary: string;
  capabilities: string[];
  link: string;
  linkText: string;
}

const FEATURE_MODULES: FeatureModule[] = [
  {
    title: 'Pickup Scheduling',
    badge: 'Core Citizen Workflow',
    role: 'Citizen & Driver',
    status: 'Operational · 14/14 Tests Passed',
    icon: Truck,
    summary:
      'Doorstep waste collection scheduling with automated duplicate check, visual waste categorisation, and high-accuracy GPS gate pinning.',
    capabilities: [
      'Duplicate prevention by user, date, and stream',
      'Leaflet high-accuracy GPS gate pin-drop',
      'Automatic zone & coordinates inheritance fallback',
      'Driver assignment and physical scale weigh-in'
    ],
    link: '/dashboard/user?tab=console',
    linkText: 'Open Pickup Console'
  },
  {
    title: 'Complaint Management',
    badge: 'Civic Accountability',
    role: 'Citizen & Admin',
    status: 'Operational · SLA Tracked',
    icon: MessageSquareWarning,
    summary:
      'Decentralized civic grievance portal where citizens report missed pickups, overflowing bins, and illegal dumps with photo proof.',
    capabilities: [
      'Community upvoting to prioritize urgent issues',
      'Photo URL attachments & GPS coordinates',
      'Admin resolution queue with SLA timers',
      'Municipal hotspot clustering & heatmap density'
    ],
    link: '/dashboard/user?tab=community',
    linkText: 'Open Community Desk'
  },
  {
    title: 'Rewards & Green Tier',
    badge: 'Behavioral Economics',
    role: 'Citizen Portal',
    status: 'Active · Closed-Loop Ledger',
    icon: Gift,
    summary:
      'CPCB-aligned gamification engine awarding verified points for source segregation, driving civic participation and zero-landfill milestones.',
    capabilities: [
      'Points awarded upon driver weight verification',
      '3-Tier progression: Bronze, Silver & Gold',
      'Instant catalog redemption for utility bill credits',
      'Citizen dispute mechanism with fraud protection'
    ],
    link: '/dashboard/user?tab=rewards',
    linkText: 'View Points & Catalog'
  },
  {
    title: 'Route Visualization',
    badge: 'Fleet Logistics & IoT',
    role: 'Driver, Admin & Citizen',
    status: 'Live · WebSockets Connected',
    icon: MapPinned,
    summary:
      'Real-time vehicle telemetry powered by Leaflet, OpenStreetMap, and WebSockets broadcasting driver location and live ETAs.',
    capabilities: [
      'Sub-second WebSocket driver telemetry broadcast',
      'Dynamic Haversine distance and arrival alert (<300m)',
      'Turn-by-turn Google Maps dispatch navigation',
      'TSP route optimization and stop status updates'
    ],
    link: '/dashboard/driver',
    linkText: 'Open Field Console'
  },
  {
    title: 'Recycling Analytics',
    badge: 'Circular Economy & EPR',
    role: 'Recycler, Public & Admin',
    status: 'Active · CPCB Aligned',
    icon: Recycle,
    summary:
      'Transparent scrap rates directory, Legal Metrology digital receipts, and zone-level municipal waste diversion metrics.',
    capabilities: [
      'Live public scrap price board by material stream',
      'Multi-item doorstep scrap collection calculator',
      'CPCB digital receipts with verifiable EPR credits',
      'Zone-level Recharts analytics for waste diversion'
    ],
    link: '/price-board',
    linkText: 'Inspect Scrap Board'
  }
];

export function FeatureModulesPage() {
  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Platform Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            EcoSync Core Feature Modules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full-stack municipal waste operations, verified against backend SQLite/PostgreSQL APIs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>5 / 5 Modules Operational</span>
          </span>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {FEATURE_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <article
              key={mod.title}
              className="glass-card rounded-[2.5rem] p-6 sm:p-7 shadow-sm transition hover:shadow-md hover:border-emerald-200 flex flex-col justify-between"
            >
              <div>
                {/* Top Strip */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                      {mod.role}
                    </span>
                    <span className="block text-[11px] font-semibold text-emerald-700 mt-1">
                      {mod.status}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  {mod.badge}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">{mod.title}</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{mod.summary}</p>

                {/* Key Capabilities List */}
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    System Capabilities:
                  </span>
                  {mod.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={mod.link}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 transition"
                >
                  <span>{mod.linkText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
