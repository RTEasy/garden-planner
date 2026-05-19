import { useState } from 'react';
import { seedCatalog, getSeedById } from './data/seedCatalog';
import { BED_POSITIONS } from './types';
import { useAuth } from './context/AuthContext';
import { AuthForm } from './components/auth/AuthForm';
import { LocationSetup } from './components/location/LocationSetup';
import { useGardenLocation } from './hooks/useGardenLocation';
import { useInventory, InventoryItemWithSeed } from './hooks/useInventory';
import { useInSeason } from './hooks/useInSeason';
import { useBedSquares } from './hooks/useBedSquares';
import { useBedNames } from './hooks/useBedNames';
import { AddSeedModal } from './components/inventory/AddSeedModal';
import { SeedPacketCard } from './components/inventory/SeedPacketCard';
import { SeedLifecycleModal } from './components/inventory/SeedLifecycleModal';
import { BedSquareModal } from './components/beds/BedSquareModal';
import { SeedDotGrid } from './components/beds/SeedDotGrid';
import { ScheduleTimeline } from './components/schedule/ScheduleTimeline';
import { ProcessType } from './types';
import { parseAlmanacDateRange, formatDateRange } from './utils/dateCalculations';
import { getAdjacentPositions } from './data/companionPlanting';
import { differenceInDays } from 'date-fns';
import './App.css';

type Tab = 'dashboard' | 'beds' | 'inventory' | 'schedule' | 'settings';
type InventoryFilter = 'all' | 'vegetable' | 'herb' | 'flower' | 'in_progress';

function getStatusInfo(item: InventoryItemWithSeed): { label: string; color: string } {
  const today = new Date();
  const seed = getSeedById(item.seedId);

  if (item.status === 'planted') return { label: 'In a bed', color: 'teal' };

  if (item.status === 'in_process') {
    if (item.processType === 'starting_indoors') {
      const transplantRange = seed?.almanacTransplant ? parseAlmanacDateRange(seed.almanacTransplant) : null;
      if (transplantRange) {
        if (today >= transplantRange.start && today <= transplantRange.end)
          return { label: 'Ready to transplant', color: 'green' };
        const days = differenceInDays(transplantRange.start, today);
        if (days > 0) return { label: `Transplant in ${days}d`, color: 'blue' };
        return { label: 'Move to bed when ready', color: 'amber' };
      }
      const started = item.actionDate ? new Date(item.actionDate) : null;
      const label = started
        ? `Started ${started.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : 'Started indoors';
      return { label, color: 'blue' };
    }
    if (item.processType === 'direct_sow') return { label: 'Direct sowed', color: 'green' };
  }

  if (seed?.almanacIndoors) {
    const r = parseAlmanacDateRange(seed.almanacIndoors);
    if (r) {
      if (today >= r.start && today <= r.end) return { label: 'Start indoors now', color: 'blue' };
      const days = differenceInDays(r.start, today);
      if (days > 0 && days <= 21) return { label: `Start indoors in ${days}d`, color: 'blue' };
    }
  }
  if (seed?.almanacDirectSow) {
    const r = parseAlmanacDateRange(seed.almanacDirectSow);
    if (r) {
      if (today >= r.start && today <= r.end) return { label: 'Ready to sow now', color: 'green' };
      const days = differenceInDays(r.start, today);
      if (days > 0 && days <= 21) return { label: `Sow outside in ${days}d`, color: 'amber' };
    }
  }

  return { label: 'In inventory', color: 'gray' };
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedBed, setSelectedBed] = useState<1 | 2 | 3>(1);
  const [showAddSeedModal, setShowAddSeedModal] = useState(false);
  const [hoveredSeed, setHoveredSeed] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<{ bed: 1|2|3; position: string } | null>(null);
  const { user, loading, signOut } = useAuth();
  const { location } = useGardenLocation();
  const { inventory, loading: inventoryLoading, addToInventory, advanceStatus, removeFromInventory, removeAllFromInventory, importAllSeeds } = useInventory();
  const [lifecycleTarget, setLifecycleTarget] = useState<InventoryItemWithSeed | null>(null);

  const openLifecycleModal = (item: InventoryItemWithSeed) => setLifecycleTarget(item);

  const handleLifecycleConfirm = async (processType: ProcessType, actionDate: string) => {
    if (!lifecycleTarget) return;
    await advanceStatus(lifecycleTarget.id, 'in_process', processType, actionDate);
    setLifecycleTarget(null);
  };
  const { activeSeeds, upcomingSeeds } = useInSeason();
  const { bedSquares, getSquare, plantSquare, clearSquare, advanceStage } = useBedSquares();
  const { bedNames, setBedName } = useBedNames();
  const [editingBedName, setEditingBedName] = useState<1 | 2 | 3 | null>(null);
  const [editingBedNameValue, setEditingBedNameValue] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');
  const [showCatalog, setShowCatalog] = useState(false);

  const startEditingBedName = (bed: 1 | 2 | 3) => {
    setEditingBedName(bed);
    setEditingBedNameValue(bedNames[bed]);
  };

  const commitBedName = () => {
    if (editingBedName) {
      setBedName(editingBedName, editingBedNameValue);
      setEditingBedName(null);
    }
  };

  const indoorStarts = inventory.filter(i => i.status === 'in_process' && i.processType === 'starting_indoors');

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Garden Planner</h1>
            <p className="text-green-200 text-sm">Square Foot Garden Management</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-200 text-sm hidden sm:block">{user.email}</span>
            <button
              onClick={signOut}
              className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-4 overflow-x-auto">
            {(['dashboard', 'beds', 'inventory', 'schedule', 'settings'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-green-700 border-b-2 border-green-700'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="flex gap-6 items-start">

            {/* Left sidebar — inventory seeds */}
            <div className="w-48 shrink-0 hidden lg:block">
              <div className="bg-white rounded-lg shadow sticky top-20">
                <div className="px-3 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">My Seeds</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{inventory.length} varieties</p>
                </div>
                <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
                  {inventory.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3">No seeds yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {inventory.map(item => {
                        const seed = getSeedById(item.seedId);
                        return (
                          <li
                            key={item.id}
                            className="px-3 py-2 hover:bg-amber-50 cursor-default transition-colors"
                            onMouseEnter={() => seed && setHoveredSeed(seed.id)}
                            onMouseLeave={() => setHoveredSeed(null)}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                item.seed.plantType === 'vegetable' ? 'bg-green-500' :
                                item.seed.plantType === 'herb' ? 'bg-purple-400' :
                                'bg-pink-400'
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-gray-800 capitalize truncate">{item.seed.commonName}</div>
                                <div className="text-[10px] text-gray-400 truncate">{item.seed.cultivar}</div>
                              </div>
                              {item.status === 'planted' && (
                                <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-medium shrink-0">bed</span>
                              )}
                              {item.status === 'in_process' && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-medium shrink-0">indoor</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Hover card */}
            {hoveredSeed && getSeedById(hoveredSeed) && (
              <div className="fixed top-24 right-4 z-50 hidden lg:block">
                <SeedPacketCard seed={getSeedById(hoveredSeed)!} />
              </div>
            )}

            {/* Right — main dashboard content */}
            <div className="flex-1 min-w-0 space-y-6">

            {/* Onboarding checklist */}
            {(() => {
              const hasLocation = !!location?.lastFrostDate;
              const hasSeeds = inventory.length > 0;
              const hasPlanted = bedSquares.some(sq => sq.status !== 'empty');
              if (hasLocation && hasSeeds && hasPlanted) return null;
              const steps = [
                { done: hasLocation, label: 'Set your location', sub: 'Get accurate planting dates for Calistoga', onClick: () => setActiveTab('settings'), cta: 'Set Location' },
                { done: hasSeeds, label: 'Add seeds to your inventory', sub: 'Track what you have to plant', onClick: () => setActiveTab('inventory'), cta: 'Add Seeds' },
                { done: hasPlanted, label: 'Plant your first square', sub: 'Click any square in the Beds tab', onClick: () => setActiveTab('beds'), cta: 'Go to Beds' },
              ];
              return (
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                  <h3 className="font-semibold text-gray-800 mb-3">Getting Started with Square Foot Gardening</h3>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${step.done ? '' : 'bg-gray-50'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {step.done ? '✓' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${step.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{step.label}</div>
                          {!step.done && <div className="text-xs text-gray-500">{step.sub}</div>}
                        </div>
                        {!step.done && (
                          <button onClick={step.onClick} className="text-xs text-green-700 font-medium hover:text-green-800 shrink-0 whitespace-nowrap">
                            {step.cta} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Today's Focus */}
            {(activeSeeds.length > 0 || upcomingSeeds.length > 0) && (
              <div className={`rounded-lg p-5 border-2 ${activeSeeds.length > 0 ? 'bg-green-50 border-green-400' : 'bg-amber-50 border-amber-300'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeSeeds.length > 0 ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <h2 className={`font-semibold text-sm uppercase tracking-wide ${activeSeeds.length > 0 ? 'text-green-800' : 'text-amber-800'}`}>
                    {activeSeeds.length > 0 ? 'Ready to act now' : 'Coming up soon'}
                  </h2>
                </div>
                <div className="space-y-2">
                  {(activeSeeds.length > 0 ? activeSeeds : upcomingSeeds).slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.action === 'start indoors' ? 'bg-blue-100 text-blue-700' :
                          item.action === 'transplant' ? 'bg-violet-100 text-violet-700' :
                          'bg-green-100 text-green-700'
                        }`}>{item.action}</span>
                        <span className="text-sm font-medium text-gray-800 capitalize truncate">{item.seed.commonName}</span>
                        <span className="text-xs text-gray-500 truncate hidden sm:block">{item.seed.cultivar}</span>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{formatDateRange(item.dateRange)}</span>
                    </div>
                  ))}
                </div>
                {activeSeeds.length > 3 && (
                  <p className="text-xs text-green-700 mt-2">+{activeSeeds.length - 3} more ready — check the Schedule tab</p>
                )}
              </div>
            )}

            {/* Beds Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Your Beds</h2>
                <button
                  onClick={() => setActiveTab('beds')}
                  className="text-sm text-green-700 font-medium hover:text-green-800"
                >
                  Manage →
                </button>
              </div>
              {/* Color legend */}
              <div className="flex gap-4 mb-4 text-xs text-gray-500">
                {[['bg-green-500', 'Vegetable'], ['bg-purple-400', 'Herb'], ['bg-pink-400', 'Flower']].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {([1, 2, 3] as const).map(bed => {
                  const planted = BED_POSITIONS.filter(p => getSquare(bed, p)?.status === 'planted').length;
                  return (
                    <div key={bed} className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => { setActiveTab('beds'); setSelectedBed(bed); startEditingBedName(bed); }}
                        className="text-sm font-medium text-gray-600 hover:text-green-700 truncate max-w-full"
                        title="Click to rename"
                      >
                        {bedNames[bed]}
                      </button>
                      <div className="grid grid-cols-4 gap-1 w-full">
                        {BED_POSITIONS.map(position => {
                          const sq = getSquare(bed, position);
                          const isOccupied = sq && sq.status !== 'empty';
                          const sfg = isOccupied ? getSeedById(sq.plantedSeedId!)?.sfgPerSquare : undefined;
                          const squareColor =
                            sq?.status === 'harvesting' ? 'bg-amber-50 border-amber-400 hover:bg-amber-100' :
                            sq?.status === 'growing'    ? 'bg-teal-50 border-teal-400 hover:bg-teal-100' :
                            isOccupied                  ? 'bg-green-50 border-green-400 hover:bg-green-100' :
                                                          'bg-stone-50 border-stone-200 hover:bg-stone-100';
                          return (
                            <button
                              key={position}
                              onClick={() => {
                                setSelectedBed(bed);
                                setSelectedSquare({ bed, position });
                              }}
                              className={`aspect-square rounded border flex items-center justify-center p-0.5 transition-colors ${squareColor}`}
                            >
                              {isOccupied && sfg ? (
                                <SeedDotGrid count={sfg} plantType={sq.plantedSeedType} />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                      {/* Fill bar */}
                      <div className="w-full">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(planted / 16) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 text-center">{planted}/16 planted</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location status */}
            {location?.lastFrostDate ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800">Garden Location Set</h3>
                <p className="text-green-700 text-sm mt-1">
                  Zone {location.hardinessZone} • Last frost: {new Date(location.lastFrostDate).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800">Set Up Your Location</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Add your frost dates to get personalized planting schedules.
                </p>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="mt-2 text-amber-800 font-medium text-sm hover:text-amber-900"
                >
                  Go to Settings →
                </button>
              </div>
            )}

            {/* In Season Now */}
            {location?.lastFrostDate && (activeSeeds.length > 0 || upcomingSeeds.length > 0) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">In Season Now</h2>

                {activeSeeds.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Ready to Plant
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {activeSeeds.slice(0, 6).map((item, idx) => (
                        <div key={`${item.seed.id}-${item.action}-${idx}`} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="font-medium text-gray-800 capitalize">{item.seed.commonName}</div>
                          <div className="text-xs text-gray-500 italic">{item.seed.genusSpecies}</div>
                          <div className="text-sm text-green-700 mt-1">{item.action}</div>
                          <div className="text-xs text-gray-500">{formatDateRange(item.dateRange)}</div>
                        </div>
                      ))}
                    </div>
                    {activeSeeds.length > 6 && (
                      <p className="text-sm text-gray-500 mt-2">
                        +{activeSeeds.length - 6} more ready to plant
                      </p>
                    )}
                  </div>
                )}

                {upcomingSeeds.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Coming Up
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {upcomingSeeds.slice(0, 6).map((item, idx) => (
                        <div key={`${item.seed.id}-${item.action}-${idx}`} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="font-medium text-gray-800 capitalize">{item.seed.commonName}</div>
                          <div className="text-xs text-gray-500 italic">{item.seed.genusSpecies}</div>
                          <div className="text-sm text-amber-700 mt-1">{item.action}</div>
                          <div className="text-xs text-gray-500">{formatDateRange(item.dateRange)}</div>
                        </div>
                      ))}
                    </div>
                    {upcomingSeeds.length > 6 && (
                      <p className="text-sm text-gray-500 mt-2">
                        +{upcomingSeeds.length - 6} more coming up
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('schedule')}
                  className="mt-4 text-green-700 font-medium text-sm hover:text-green-800"
                >
                  View Full Schedule →
                </button>
              </div>
            )}

            {/* Indoor Starts */}
            {indoorStarts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Indoor Starts</h2>
                <div className="space-y-3">
                  {indoorStarts.map(item => {
                    const seed = getSeedById(item.seedId);
                    const transplantRange = seed?.almanacTransplant
                      ? parseAlmanacDateRange(seed.almanacTransplant)
                      : null;
                    const today = new Date();
                    const daysUntil = transplantRange
                      ? differenceInDays(transplantRange.start, today)
                      : null;
                    const isReady = transplantRange
                      ? today >= transplantRange.start && today <= transplantRange.end
                      : false;
                    const isPast = transplantRange ? today > transplantRange.end : false;

                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <span className="font-medium text-gray-800 capitalize">{item.seed.commonName}</span>
                            <span className="text-gray-500 text-sm ml-2">{item.seed.cultivar}</span>
                          </div>
                          {isReady && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              Ready to transplant
                            </span>
                          )}
                          {isPast && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                              Move to a bed when ready
                            </span>
                          )}
                          {daysUntil !== null && daysUntil > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              {daysUntil}d until transplant window
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-4 text-xs text-gray-500">
                          {item.actionDate && (
                            <span>Started {new Date(item.actionDate).toLocaleDateString()}</span>
                          )}
                          {transplantRange && (
                            <span>Transplant window: {formatDateRange(transplantRange)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Go to the Beds tab to assign a square when ready to transplant.
                </p>
              </div>
            )}
            </div>
          </div>
        )}

        {activeTab === 'beds' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((bed) => (
                <button
                  key={bed}
                  onClick={() => setSelectedBed(bed)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedBed === bed
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Box {bed}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-semibold text-gray-800">Box {selectedBed}:</span>
                {editingBedName === selectedBed ? (
                  <input
                    autoFocus
                    value={editingBedNameValue}
                    onChange={e => setEditingBedNameValue(e.target.value)}
                    onBlur={commitBedName}
                    onKeyDown={e => { if (e.key === 'Enter') commitBedName(); if (e.key === 'Escape') setEditingBedName(null); }}
                    className="text-xl font-semibold text-gray-800 border-b-2 border-green-500 outline-none bg-transparent"
                  />
                ) : (
                  <button
                    onClick={() => startEditingBedName(selectedBed)}
                    className="text-xl font-semibold text-gray-800 hover:text-green-700 group flex items-center gap-1"
                    title="Click to rename"
                  >
                    {bedNames[selectedBed]}
                    <span className="text-sm text-gray-400 group-hover:text-green-600 font-normal">✎</span>
                  </button>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-4">4' x 4' raised bed (16 square feet)</p>

              {/* Bed Grid */}
              <div className="grid grid-cols-4 gap-2 max-w-sm">
                {BED_POSITIONS.map((position) => {
                  const sq = getSquare(selectedBed, position);
                  const isOccupied = sq && sq.status !== 'empty';
                  const squareColor =
                    sq?.status === 'harvesting' ? 'bg-amber-50 border-amber-400 hover:bg-amber-100' :
                    sq?.status === 'growing'    ? 'bg-teal-50 border-teal-400 hover:bg-teal-100' :
                    isOccupied                  ? 'bg-green-50 border-green-400 hover:bg-green-100' :
                                                  'bg-stone-50 border-stone-200 hover:bg-stone-100';
                  return (
                    <button
                      key={position}
                      onClick={() => setSelectedSquare({ bed: selectedBed, position })}
                      className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1.5 transition-colors text-center ${squareColor}`}
                    >
                      {isOccupied ? (
                        <>
                          {(() => {
                            const sfg = getSeedById(sq.plantedSeedId!)?.sfgPerSquare;
                            return sfg ? (
                              <SeedDotGrid count={sfg} plantType={sq.plantedSeedType} />
                            ) : null;
                          })()}
                          <span className={`text-[10px] font-medium capitalize leading-tight mt-1 line-clamp-1 ${
                            sq.status === 'harvesting' ? 'text-amber-800' :
                            sq.status === 'growing' ? 'text-teal-800' : 'text-green-800'
                          }`}>
                            {sq.plantedSeedName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-stone-400 font-medium">{position}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-gray-400 text-xs mt-3">Click a square to plant or view</p>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="flex gap-6 items-start">
            {/* Left: seed list */}
            <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">My Seeds</h2>
                <p className="text-sm text-gray-500">{inventory.length} {inventory.length === 1 ? 'variety' : 'varieties'} in your collection</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={importAllSeeds}
                  className="text-sm text-gray-600 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Import All
                </button>
                <button
                  onClick={() => setShowAddSeedModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  + Add Seeds
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            {inventory.length > 0 && (() => {
              const tabs = [
                { key: 'all' as InventoryFilter, label: 'All', count: inventory.length },
                { key: 'vegetable' as InventoryFilter, label: 'Vegetables', count: inventory.filter(i => i.seed.plantType === 'vegetable').length },
                { key: 'herb' as InventoryFilter, label: 'Herbs', count: inventory.filter(i => i.seed.plantType === 'herb').length },
                { key: 'flower' as InventoryFilter, label: 'Flowers', count: inventory.filter(i => i.seed.plantType === 'flower').length },
                { key: 'in_progress' as InventoryFilter, label: 'In Progress', count: inventory.filter(i => i.status !== 'in_inventory').length },
              ].filter(t => t.key === 'all' || t.count > 0);
              return (
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setInventoryFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        inventoryFilter === tab.key
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                      {tab.key !== 'all' && (
                        <span className="ml-1.5 text-xs text-gray-400">{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}

            {inventoryLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Loading...</div>
            ) : inventory.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 mb-4">No seeds yet. Add seeds you own to track them here.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={importAllSeeds} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Import All Catalog Seeds
                  </button>
                  <button onClick={() => setShowAddSeedModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Add Seeds Manually
                  </button>
                </div>
              </div>
            ) : (() => {
              const filteredInventory = inventoryFilter === 'all'
                ? inventory
                : inventoryFilter === 'in_progress'
                  ? inventory.filter(i => i.status !== 'in_inventory')
                  : inventory.filter(i => i.seed.plantType === inventoryFilter);
              const statusColors: Record<string, string> = {
                green: 'bg-green-100 text-green-700',
                teal: 'bg-teal-100 text-teal-700',
                blue: 'bg-blue-100 text-blue-700',
                amber: 'bg-amber-100 text-amber-700',
                gray: 'bg-gray-100 text-gray-500',
              };
              return (
                <>
                  <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
                    {filteredInventory.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No seeds in this category.</div>
                    ) : filteredInventory.map(item => {
                      const statusInfo = getStatusInfo(item);
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                          onMouseEnter={() => setHoveredSeed(item.seedId)}
                          onMouseLeave={() => setHoveredSeed(null)}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.seed.plantType === 'vegetable' ? 'bg-green-500' :
                            item.seed.plantType === 'herb' ? 'bg-purple-400' : 'bg-pink-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-gray-800 capitalize">{item.seed.commonName}</span>
                              <span className="text-xs text-gray-400">{item.seed.cultivar}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                item.seed.plantType === 'vegetable' ? 'bg-green-50 text-green-600' :
                                item.seed.plantType === 'herb' ? 'bg-purple-50 text-purple-600' :
                                'bg-pink-50 text-pink-600'
                              }`}>{item.seed.plantType}</span>
                              {item.seed.sfgPerSquare && (
                                <span className="text-xs text-gray-400">{item.seed.sfgPerSquare}/sq ft</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColors[statusInfo.color] ?? statusColors.gray}`}>
                            {statusInfo.label}
                          </span>
                          <div className="flex items-center gap-3 shrink-0">
                            {item.status === 'in_inventory' && (
                              <>
                                <button
                                  onClick={() => openLifecycleModal(item)}
                                  className="text-xs text-green-700 font-medium hover:text-green-800 whitespace-nowrap"
                                >
                                  Start Indoors
                                </button>
                                <button
                                  onClick={() => removeFromInventory(item.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors"
                                  title="Remove"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                    <span>Direct sow: go to the Beds tab and click a square.</span>
                    <button
                      onClick={removeAllFromInventory}
                      className="text-red-300 hover:text-red-500 transition-colors"
                    >
                      Remove all seeds
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Browse Catalog */}
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowCatalog(prev => !prev)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                <span className="text-gray-400">{showCatalog ? '▾' : '▸'}</span>
                Browse seed catalog
                <span className="text-gray-400 font-normal text-xs">· {seedCatalog.length} varieties</span>
              </button>
              {showCatalog && (
                <div className="mt-3 relative">
                  <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
                    {seedCatalog.map(seed => {
                      const inInventory = inventory.some(i => i.seedId === seed.id);
                      return (
                        <div
                          key={seed.id}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors"
                          onMouseEnter={() => setHoveredSeed(seed.id)}
                          onMouseLeave={() => setHoveredSeed(null)}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            seed.plantType === 'vegetable' ? 'bg-green-500' :
                            seed.plantType === 'herb' ? 'bg-purple-400' : 'bg-pink-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 capitalize">{seed.commonName}</span>
                            <span className="text-xs text-gray-400 ml-2">{seed.cultivar}</span>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            seed.plantType === 'vegetable' ? 'bg-green-50 text-green-600' :
                            seed.plantType === 'herb' ? 'bg-purple-50 text-purple-600' :
                            'bg-pink-50 text-pink-600'
                          }`}>{seed.plantType}</span>
                          {inInventory ? (
                            <span className="text-xs text-gray-400 shrink-0">In collection</span>
                          ) : (
                            <button
                              onClick={() => addToInventory(seed.id, 1)}
                              className="text-xs text-green-700 font-medium hover:text-green-800 shrink-0"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            </div>{/* end left column */}

            {/* Right: sticky detail panel */}
            <div className="w-72 shrink-0 hidden lg:block sticky top-20">
              {hoveredSeed && getSeedById(hoveredSeed) ? (
                <SeedPacketCard seed={getSeedById(hoveredSeed)!} />
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-3">🌱</div>
                  <p className="text-sm text-gray-400">Hover a seed to see its details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Planting Calendar</h2>
              <span className="text-xs text-gray-400">Calistoga, CA · Last frost Mar 25 · First frost Nov 13</span>
            </div>
            <ScheduleTimeline inventory={inventory} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <LocationSetup />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-gray-500 text-sm">
          Garden Planner - Square Foot Gardening Made Easy
        </div>
      </footer>

      {/* Add Seed Modal */}
      <AddSeedModal
        isOpen={showAddSeedModal}
        onClose={() => setShowAddSeedModal(false)}
        onAdd={addToInventory}
      />

      {/* Seed Lifecycle Modal */}
      {(() => {
        const fullSeed = lifecycleTarget ? getSeedById(lifecycleTarget.seedId) : undefined;
        return (
          <SeedLifecycleModal
            isOpen={!!lifecycleTarget}
            seedName={lifecycleTarget?.seed.commonName || ''}
            cultivar={lifecycleTarget?.seed.cultivar || ''}
            defaultProcessType="starting_indoors"
            almanacIndoors={fullSeed?.almanacIndoors}
            almanacDirectSow={fullSeed?.almanacDirectSow}
            almanacTransplant={fullSeed?.almanacTransplant}
            onConfirm={handleLifecycleConfirm}
            onClose={() => setLifecycleTarget(null)}
          />
        );
      })()}

      {/* Bed Square Modal */}
      {selectedSquare && (() => {
        const sq = getSquare(selectedSquare.bed, selectedSquare.position);
        const availableSeeds = inventory.filter(i => i.status === 'in_inventory');
        const neighborSeeds = getAdjacentPositions(selectedSquare.position)
          .map(pos => getSquare(selectedSquare.bed, pos))
          .filter((s): s is NonNullable<typeof s> => !!s?.plantedSeedId)
          .map(s => ({ position: s.position, seedId: s.plantedSeedId!, seedName: s.plantedSeedName || '' }));
        return (
          <BedSquareModal
            isOpen={true}
            bed={selectedSquare.bed}
            position={selectedSquare.position}
            bedName={bedNames[selectedSquare.bed]}
            currentSeedId={sq?.plantedSeedId}
            currentSeedName={sq?.plantedSeedName}
            currentSeedType={sq?.plantedSeedType}
            currentStatus={sq?.status}
            plantedDate={sq?.plantedDate}
            availableSeeds={availableSeeds}
            neighborSeeds={neighborSeeds}
            onDirectSow={async (seedId) => {
              await plantSquare(selectedSquare.bed, selectedSquare.position, seedId);
              await advanceStatus(
                inventory.find(i => i.seedId === seedId && i.status === 'in_inventory')?.id || '',
                'planted',
                'direct_sow',
                new Date().toISOString().split('T')[0]
              );
              setSelectedSquare(null);
            }}
            onAdvanceStage={async (newStatus) => {
              await advanceStage(selectedSquare.bed, selectedSquare.position, newStatus);
              setSelectedSquare(null);
            }}
            onClear={async () => {
              await clearSquare(selectedSquare.bed, selectedSquare.position);
              setSelectedSquare(null);
            }}
            onClose={() => setSelectedSquare(null)}
          />
        );
      })()}
    </div>
  );
}

export default App;
