import { useState } from 'react';
import { seedCatalog, getSeedById } from './data/seedCatalog';
import { BED_POSITIONS } from './types';
import { useAuth } from './context/AuthContext';
import { AuthForm } from './components/auth/AuthForm';
import { LocationSetup } from './components/location/LocationSetup';
import { useGardenLocation } from './hooks/useGardenLocation';
import { useInventory } from './hooks/useInventory';
import { useSchedule } from './hooks/useSchedule';
import { useInSeason } from './hooks/useInSeason';
import { AddSeedModal } from './components/inventory/AddSeedModal';
import { SeedPacketCard } from './components/inventory/SeedPacketCard';
import { SeedLifecycleModal } from './components/inventory/SeedLifecycleModal';
import { ProcessType } from './types';
import { InventoryItemWithSeed } from './hooks/useInventory';
import { formatDateRange } from './utils/dateCalculations';
import './App.css';

type Tab = 'dashboard' | 'beds' | 'inventory' | 'schedule' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedBed, setSelectedBed] = useState<1 | 2 | 3>(1);
  const [showAddSeedModal, setShowAddSeedModal] = useState(false);
  const [hoveredSeed, setHoveredSeed] = useState<string | null>(null);
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
  const { activeTasks, upcomingTasks, futureTasks, loading: scheduleLoading, hasLocation, hasInventory } = useSchedule();
  const { activeSeeds, upcomingSeeds } = useInSeason();

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
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome to Your Garden</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-700">3</div>
                  <div className="text-gray-600">Raised Beds</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-700">48</div>
                  <div className="text-gray-600">Square Feet</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-amber-700">{inventory.length}</div>
                  <div className="text-gray-600">Seeds in Inventory</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('beds')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Beds
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage Seeds
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  View Schedule
                </button>
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
              <div className="grid grid-cols-4 gap-2 max-w-md">
                {BED_POSITIONS.map((position) => (
                  <button
                    key={position}
                    className="aspect-square bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 rounded-lg flex items-center justify-center text-amber-800 font-medium transition-colors"
                  >
                    {position}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-4">Click a square to view or assign plants</p>
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
              <div className="space-y-6">
                {/* In My Inventory */}
                {(() => {
                  const items = inventory.filter(i => i.status === 'in_inventory');
                  return (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
                        <h3 className="font-semibold text-gray-700">In My Inventory</h3>
                        <span className="ml-auto text-sm text-gray-400">{items.length} {items.length === 1 ? 'variety' : 'varieties'}</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-gray-400">No seeds waiting to be started.</p>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Name</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Cultivar</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm hidden sm:table-cell">Type</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Packets</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {items.map(item => (
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
                                <td className="px-4 py-3 text-gray-600 text-sm">{item.packetCount}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => openLifecycleModal(item)}
                                      className="text-sm text-green-700 font-medium hover:text-green-800"
                                    >
                                      Start Growing
                                    </button>
                                    <button
                                      onClick={() => removeFromInventory(item.id)}
                                      className="text-sm text-red-500 hover:text-red-600"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })()}

                {/* In Process */}
                {(() => {
                  const items = inventory.filter(i => i.status === 'in_process');
                  return (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                        <h3 className="font-semibold text-gray-700">In Process</h3>
                        <span className="ml-auto text-sm text-gray-400">{items.length} {items.length === 1 ? 'variety' : 'varieties'}</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-gray-400">Nothing started yet. Use "Start Growing" on a seed above.</p>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Name</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Cultivar</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Method</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm hidden sm:table-cell">Started</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {items.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800 capitalize">{item.seed.commonName}</td>
                                <td className="px-4 py-3 text-gray-600 text-sm">{item.seed.cultivar}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    item.processType === 'starting_indoors'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {item.processType === 'starting_indoors' ? 'Starting Indoors' : 'Direct Sow'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">
                                  {item.actionDate ? new Date(item.actionDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => advanceStatus(item.id, 'planted', undefined, new Date().toISOString().split('T')[0])}
                                    className="text-sm text-green-700 font-medium hover:text-green-800"
                                  >
                                    Mark Planted
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })()}

                {/* Planted */}
                {(() => {
                  const items = inventory.filter(i => i.status === 'planted');
                  return (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                        <h3 className="font-semibold text-gray-700">Planted</h3>
                        <span className="ml-auto text-sm text-gray-400">{items.length} {items.length === 1 ? 'variety' : 'varieties'}</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-gray-400">Nothing planted yet.</p>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Name</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm">Cultivar</th>
                              <th className="text-left px-4 py-2 text-gray-500 font-medium text-sm hidden sm:table-cell">Date Planted</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {items.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800 capitalize">{item.seed.commonName}</td>
                                <td className="px-4 py-3 text-gray-600 text-sm">{item.seed.cultivar}</td>
                                <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">
                                  {item.actionDate ? new Date(item.actionDate).toLocaleDateString() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })()}
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Planting Schedule</h2>
              {location?.lastFrostDate && (
                <span className="text-sm text-gray-500">
                  Last frost: {new Date(location.lastFrostDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {!hasLocation ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <p className="text-lg text-gray-800">Set up your garden location first</p>
                  <p className="text-gray-500 text-sm mt-2">
                    We need your frost dates to generate a personalized planting schedule.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Set Location
                  </button>
                </div>
              </div>
            ) : !hasInventory ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <p className="text-lg text-gray-800">Add seeds to your inventory</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Your schedule will be generated based on the seeds you have.
                  </p>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Seeds
                  </button>
                </div>
              </div>
            ) : scheduleLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Loading schedule...
              </div>
            ) : (
              <>
                {/* Active Tasks - Plant Now */}
                {activeTasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Plant Now
                    </h3>
                    <div className="space-y-3">
                      {activeTasks.map((task) => {
                        const matchingItem = inventory.find(i => i.seedId === task.seedId && i.status === 'in_inventory');
                        const inProgressItem = inventory.find(i => i.seedId === task.seedId && i.status === 'in_process');
                        return (
                          <div key={task.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <div>
                                <span className="font-medium text-gray-800 capitalize">{task.seedName}</span>
                                <span className="text-gray-500 ml-2">({task.cultivar})</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {inProgressItem ? (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                    {inProgressItem.processType === 'starting_indoors' ? 'Starting indoors' : 'Direct sowed'} {inProgressItem.actionDate ? `on ${new Date(inProgressItem.actionDate).toLocaleDateString()}` : ''}
                                  </span>
                                ) : matchingItem ? (
                                  <button
                                    onClick={() => openLifecycleModal(matchingItem)}
                                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors"
                                  >
                                    I started this
                                  </button>
                                ) : null}
                                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {task.action}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{formatDateRange(task.dateRange)}</p>
                            <p className="text-sm text-gray-500 mt-2">{task.instructions}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upcoming Tasks - Next 4 Weeks */}
                {upcomingTasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      Coming Up (Next 4 Weeks)
                    </h3>
                    <div className="space-y-3">
                      {upcomingTasks.map((task) => (
                        <div key={task.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-800 capitalize">{task.seedName}</span>
                              <span className="text-gray-500 ml-2">({task.cultivar})</span>
                            </div>
                            <span className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              {task.action}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{formatDateRange(task.dateRange)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Future Tasks */}
                {futureTasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                      Later This Season
                    </h3>
                    <div className="space-y-2">
                      {futureTasks.map((task) => (
                        <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium text-gray-700 capitalize">{task.seedName}</span>
                              <span className="text-gray-400 ml-2 text-sm">({task.cultivar})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-500">{task.action}</span>
                              <p className="text-xs text-gray-400">{formatDateRange(task.dateRange)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTasks.length === 0 && upcomingTasks.length === 0 && futureTasks.length === 0 && (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    No planting tasks scheduled. Your seeds may be out of season.
                  </div>
                )}
              </>
            )}
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
      <SeedLifecycleModal
        isOpen={!!lifecycleTarget}
        seedName={lifecycleTarget?.seed.commonName || ''}
        cultivar={lifecycleTarget?.seed.cultivar || ''}
        onConfirm={handleLifecycleConfirm}
        onClose={() => setLifecycleTarget(null)}
      />
    </div>
  );
}

export default App;
