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

  const indoorStarts = inventory.filter(i => i.status === 'in_process' && i.processType === 'starting_indoors');

  const bedNames = {
    1: 'Vegetables & Herbs',
    2: 'Cucumbers & Alliums',
    3: 'Cut Flowers & Herbs',
  };

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
                      <div className="text-sm font-medium text-gray-600">Box {bed}</div>
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
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Box {selectedBed}: {bedNames[selectedBed]}
              </h2>
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
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-gray-800">My Seeds</h2>
              <div className="flex gap-2">
                <button
                  onClick={importAllSeeds}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Import All Seeds
                </button>
                <button
                  onClick={removeAllFromInventory}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Remove All
                </button>
                <button
                  onClick={() => setShowAddSeedModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Add Seeds
                </button>
              </div>
            </div>

            {inventoryLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                Loading...
              </div>
            ) : inventory.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 mb-4">No seeds yet. Add seeds you own to track them here.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={importAllSeeds}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Import All Catalog Seeds
                  </button>
                  <button
                    onClick={() => setShowAddSeedModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Seeds Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-sm">Name</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-sm">Cultivar</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-sm hidden sm:table-cell">Type</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-sm">Status</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800 capitalize">{item.seed.commonName}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{item.seed.cultivar}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.seed.plantType === 'vegetable' ? 'bg-green-100 text-green-700' :
                            item.seed.plantType === 'herb' ? 'bg-purple-100 text-purple-700' :
                            'bg-pink-100 text-pink-700'
                          }`}>{item.seed.plantType}</span>
                        </td>
                        <td className="px-4 py-3">
                          {item.status === 'in_inventory' && (
                            <span className="text-xs text-gray-500">In inventory</span>
                          )}
                          {item.status === 'in_process' && item.processType === 'starting_indoors' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Starting indoors</span>
                          )}
                          {item.status === 'in_process' && item.processType === 'direct_sow' && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Direct sowed</span>
                          )}
                          {item.status === 'planted' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Planted</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.status === 'in_inventory' && (
                              <button
                                onClick={() => openLifecycleModal(item)}
                                className="text-sm text-green-700 font-medium hover:text-green-800"
                              >
                                Start Indoors
                              </button>
                            )}
                            {item.status === 'in_inventory' && (
                              <button
                                onClick={() => removeFromInventory(item.id)}
                                className="text-sm text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-gray-50 text-gray-400 text-sm">
                  {inventory.length} {inventory.length === 1 ? 'variety' : 'varieties'} · To direct sow, go to the Beds tab and click a square.
                </div>
              </div>
            )}

            {/* Seed Catalog Reference */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Seed Catalog</h3>
              <p className="text-sm text-gray-500 mb-4">Hover over a seed to view packet details</p>
              <div className="relative">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-gray-600 font-medium">Cultivar</th>
                        <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {seedCatalog.map((seed) => (
                        <tr
                          key={seed.id}
                          className="hover:bg-amber-50 cursor-pointer transition-colors"
                          onMouseEnter={() => setHoveredSeed(seed.id)}
                          onMouseLeave={() => setHoveredSeed(null)}
                        >
                          <td className="px-4 py-3 font-medium text-gray-800 capitalize">{seed.commonName}</td>
                          <td className="px-4 py-3 text-gray-600">{seed.cultivar}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              seed.plantType === 'vegetable' ? 'bg-green-100 text-green-700' :
                              seed.plantType === 'herb' ? 'bg-purple-100 text-purple-700' :
                              'bg-pink-100 text-pink-700'
                            }`}>
                              {seed.plantType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 bg-gray-50 text-gray-500 text-sm">
                    {seedCatalog.length} seed varieties available
                  </div>
                </div>

                {/* Seed Packet Tooltip - Fixed position to stay in view */}
                {hoveredSeed && getSeedById(hoveredSeed) && (
                  <div className="fixed top-24 right-4 z-50 hidden lg:block">
                    <SeedPacketCard seed={getSeedById(hoveredSeed)!} />
                  </div>
                )}
              </div>
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
