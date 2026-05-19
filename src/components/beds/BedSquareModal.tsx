import { useState } from 'react';
import { InventoryItemWithSeed } from '../../hooks/useInventory';

interface Props {
  isOpen: boolean;
  bed: 1 | 2 | 3;
  position: string;
  bedName: string;
  currentSeedId?: string;
  currentSeedName?: string;
  currentSeedType?: string;
  plantedDate?: string;
  availableSeeds: InventoryItemWithSeed[];
  onDirectSow: (seedId: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  vegetable: 'bg-green-100 text-green-800',
  herb: 'bg-purple-100 text-purple-800',
  flower: 'bg-pink-100 text-pink-800',
};

export function BedSquareModal({
  isOpen, bed, position, bedName,
  currentSeedId, currentSeedName, currentSeedType, plantedDate,
  availableSeeds, onDirectSow, onClear, onClose,
}: Props) {
  const [selectedSeedId, setSelectedSeedId] = useState('');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = availableSeeds.filter(i =>
    i.seed.commonName.toLowerCase().includes(search.toLowerCase()) ||
    i.seed.cultivar.toLowerCase().includes(search.toLowerCase())
  );

  // Square is already planted — show what's there
  if (currentSeedId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
          <div className="text-xs text-gray-400 mb-1">Box {bed} · Square {position}</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{bedName}</h2>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="font-medium text-gray-800 capitalize">{currentSeedName}</div>
            <div className="flex items-center gap-2 mt-1">
              {currentSeedType && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[currentSeedType] || 'bg-gray-100 text-gray-600'}`}>
                  {currentSeedType}
                </span>
              )}
              <span className="text-xs text-gray-500">
                Direct sowed {plantedDate ? `on ${new Date(plantedDate).toLocaleDateString()}` : ''}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClear}
              className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
            >
              Remove Plant
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Close
            </button>
          </div>
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

        <div className="max-h-52 overflow-y-auto space-y-1 mb-5">
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
              <span className="font-medium capitalize">{item.seed.commonName}</span>
              <span className="text-gray-400 ml-1.5 text-xs">{item.seed.cultivar}</span>
            </button>
          ))}
        </div>

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
