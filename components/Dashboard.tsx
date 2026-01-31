import React from 'react';
import { Asset, AssetType, ViewMode } from '../types';
import {
  Users,
  MapPin,
  Video,
  Plus,
  ArrowUpRight,
  Activity,
  Clock,
  Zap,
  Box,
  Film,
  Sparkles,
  Settings as GearIcon
} from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
  onChangeMode: (mode: ViewMode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ assets, onChangeMode }) => {
  const charCount = assets.filter(a => a.type === AssetType.CHARACTER).length;
  const locCount = assets.filter(a => a.type === AssetType.LOCATION).length;
  const videoCount = assets.filter(a => a.type === AssetType.VIDEO).length;
  const propCount = assets.filter(a => a.type === AssetType.PROP).length;
  const recentAssets = [...assets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div className="flex-1 bg-slate-950 p-8 h-full overflow-y-auto text-white">

      {/* Header Section */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Studio</h1>
          <p className="text-slate-400 mt-1 text-sm">Create mascot content for your marketing campaigns</p>
        </div>
        <button
          onClick={() => onChangeMode(ViewMode.CHARACTER_CREATOR)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 transition-all glow-primary"
        >
          <Plus size={16} /> New Mascot
        </button>
      </header>

      {/* Quick Production - White Card Style */}
      <section className="mb-8 bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-4">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">1</div>
          <h3 className="text-lg font-bold text-slate-800">Quick Production</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionBtn icon={Users} label="Create Mascot" desc="Design 3D brand character" onClick={() => onChangeMode(ViewMode.CHARACTER_CREATOR)} />
          <ActionBtn icon={MapPin} label="Build Scene" desc="Generate brand backgrounds" onClick={() => onChangeMode(ViewMode.WORLD_BUILDER)} />
          <ActionBtn icon={Video} label="Animate Ad" desc="Create promotional video" onClick={() => onChangeMode(ViewMode.VIDEO_MAKER)} />
          <ActionBtn icon={Box} label="Add Props" desc="Marketing elements" onClick={() => { }} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Stats + Recent - Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Mascots" count={charCount} color="text-primary" bg="bg-primary/10" />
            <StatCard icon={MapPin} label="Scenes" count={locCount} color="text-blue-500" bg="bg-blue-500/10" />
            <StatCard icon={Video} label="Videos" count={videoCount} color="text-purple-500" bg="bg-purple-500/10" />
            <StatCard icon={Box} label="Props" count={propCount} color="text-orange-500" bg="bg-orange-500/10" />
          </div>

          {/* Recent Activity - White Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
                <h3 className="font-bold text-slate-800">Recent Activity</h3>
              </div>
              <button onClick={() => onChangeMode(ViewMode.ASSETS)} className="text-xs text-primary hover:text-primary-hover transition-colors font-medium">View All Library</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
              {recentAssets.map(asset => (
                <div key={asset.id} className="p-3 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
                    <img src={asset.thumbnailUrl} className="w-full h-full object-cover" alt={asset.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-800 group-hover:text-primary truncate transition-colors">{asset.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="uppercase bg-slate-100 px-1.5 py-0.5 rounded">{asset.type}</span>
                      <span>•</span>
                      <span>{asset.createdAt}</span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              ))}
              {recentAssets.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: System Status - Dark Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={14} /> System Health
            </h3>
            <div className="space-y-4">
              <StatusRow label="AI Models" status="Online" color="bg-primary" />
              <StatusRow label="Render Engine" status="Idle" color="bg-orange-400" />

              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-medium">
                  <span className="flex items-center gap-2"><Film size={14} /> Video Gen Quota</span>
                  <span>12 / 60 Mins</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[20%] rounded-full"></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right">Resets in 14 days</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-6 text-center">
            <Sparkles size={24} className="text-primary mx-auto mb-2" />
            <p className="text-xs text-slate-400 mb-3">Need more processing power?</p>
            <button className="text-xs bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg transition-all font-semibold w-full">
              Upgrade to Enterprise
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Sub-components with clean styling ---
const StatCard = ({ icon: Icon, label, count, color, bg }: any) => (
  <div className="bg-slate-900 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between">
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-white">{count}</p>
    </div>
    <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center`}>
      <Icon size={20} />
    </div>
  </div>
);

const ActionBtn = ({ icon: Icon, label, desc, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-primary/50 transition-all rounded-xl text-left group w-full"
  >
    <div className="p-2.5 bg-white border border-slate-200 rounded-lg group-hover:bg-primary group-hover:text-white group-hover:border-primary text-slate-600 transition-colors shrink-0">
      <Icon size={20} />
    </div>
    <div>
      <span className="font-semibold text-sm text-slate-800 block">{label}</span>
      <span className="text-[10px] text-slate-500">{desc}</span>
    </div>
  </button>
);

const StatusRow = ({ label, status, color }: any) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`}></span>
      <span className="text-white font-medium">{status}</span>
    </div>
  </div>
);