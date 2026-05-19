import { useState } from 'react';
import { InventoryItemWithSeed } from '../../hooks/useInventory';
import { SeedDotGrid } from './SeedDotGrid';

type SquareStatus = 'empty' | 'planted' | 'growing' | 'harvesting' | 'done';

interface Props {
  isOpen: boolean;
  bed: 1 | 2 | 3;
  position: string;
  bedName: string;
  currentSeedId?: string;
  currentSeedName?: string;
  currentSeedType?: string;
  currentStatus?: SquareStatus;
  plantedDate?: string;
  availableSeeds: InventoryItemWithSeed[];
  onDirectSow: (seedId: string) => void;
  onAdvanceStage: (status: 'growing' | 'harvesting') => void;
  onClear: () => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  vegetable: 'bg-green-100 text-green-800',
  herb: 'bg-purple-100 text-purple-800',
  flower: 'bg-pink-100 text-pink-800',
};

const STAGE_LABELS: Record<string, string> = {
  planted: 'Just planted',
  growing: 'Growing',
  harvesting: 'Ready to harvest',
};

const STAGE_BG: Record<string, string> = {
  planted: 'bg-green-50 border-green-200',
  growing: 'bg-teal-50 border-teal-200',
  harvesting: 'bg-amber-50 border-amber-200',
};

export function BedSquareModal({
  isOpen, bed, position, bedName,
  currentSeedId, currentSeedName, currentSeedType, currentStatus, plantedDate,
  availableSeeds, onDirectSow, onAdvanceStage, onClear, onClose,
}: Props) {
  const [selectedSeedId, setSelectedSeedId] = useState('');
  const [search, setSearch] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (!isOpen) return null;

  const filtered = availableSeeds.filter(i =>
    i.seed.commonName.toLowerCase().includes(search.toLowerCase()) ||
    i.seed.cultivar.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = availableSeeds.find(i => i.seedId === selectedSeedId);
  const status = currentStatus ?? 'planted';

  // Square is already planted — show what's there + stage controls
  if (currentSeedId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
          <div className="text-xs text-gray-400 mb-1">Box {bed} · Square {position}</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{bedName}</h2>

          <div className={`border rounded-lg p-4 mb-4 ${STAGE_BG[status] ?? STAGE_BG.planted}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-gray-800 capitalize">{currentSeedName}</div>
              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                {STAGE_LABELS[status] ?? status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {currentSeedType && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[currentSeedType] || 'bg-gray-100 text-gray-600'}`}>
                  {currentSeedType}
                </span>
              )}
              <span className="text-xs text-gray-500">
                Planted {plantedDate ? `on ${new Date(plantedDate).toLocaleDateString()}` : ''}
              </span>
            </div>
          </div>

          {/* Stage advancement */}
          {!confirmingClear && (
            <div className="mb-4 space-y-2">
              {status === 'planted' && (
                <button
                  onClick={() => onAdvanceStage('growing')}
                  className="w-full text-left px-4 py-2.5 bg-teal-50 border border-teal-300 rounded-lg text-sm text-teal-800 hover:bg-teal-100 transition-colors font-medium"
                >
                  It sprouted! → Mark as Growing
                </button>
              )}
              {status === 'growing' && (
                <button
                  onClick={() => onAdvanceStage('harvesting')}
                  className="w-full text-left px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800 hover:bg-amber-100 transition-colors font-medium"
                >
                  Ready to harvest! → Mark as Harvesting
                </button>
              )}
            </div>
          )}

          {confirmingClear ? (
            <div>
              <p className="text-sm text-gray-700 mb-3">
                Remove <span className="font-medium capitalize">{currentSeedName}</span> from this square?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClear}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Yes, remove
                </button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingClear(true)}
                className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
              >
                {status === 'harvesting' ? 'All done — clear square' : 'Remove Plant'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty square — seed picker
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="text-xs text-gray-400 mb-1">Box {bed} · Square {position}</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{bedName}</h2>

        <input
          type="text"
          placeholder="Search seeds..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          autoFocus
        />

        <div className="max-h-44 overflow-y-auto space-y-1 mb-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {availableSeeds.length === 0 ? 'Add seeds to your inventory first.' : 'No matches.'}
            </p>
          ) : filtered.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedSeedId(item.seedId)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                selectedSeedId === item.seedId
                  ? 'bg-green-50 border-green-400'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium capitalize">{item.seed.commonName}</span>
                  <span className="text-gray-400 ml-1.5 text-xs">{item.seed.cultivar}</span>
                </div>
                {item.seed.sfgPerSquare && (
                  <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium ml-2 shrink-0">
                    {item.seed.sfgPerSquare}/sq ft
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* SFG density preview */}
        {selectedItem && selectedItem.seed.sfgPerSquare && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-4">
            <SeedDotGrid count={selectedItem.seed.sfgPerSquare} plantType={selectedItem.seed.plantType} />
            <div className="text-xs text-gray-600">
              <div className="font-medium capitalize text-gray-800">{selectedItem.seed.commonName}</div>
              <div>{selectedItem.seed.sfgPerSquare} plant{selectedItem.seed.sfgPerSquare > 1 ? 's' : ''} per square foot</div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { if (selectedSeedId) { onDirectSow(selectedSeedId); setSelectedSeedId(''); setSearch(''); } }}
            disabled={!selectedSeedId}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            Direct Sow
          </button>
          <button
            onClick={() => { onClose(); setSelectedSeedId(''); setSearch(''); }}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
