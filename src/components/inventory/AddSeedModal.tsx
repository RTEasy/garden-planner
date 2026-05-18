import { useState } from 'react';
import { seedCatalog, searchSeeds } from '../../data/seedCatalog';
import { Seed } from '../../types';

interface AddSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (seedId: string, packetCount: number, quantityMg: number, notes?: string) => Promise<boolean>;
}

export function AddSeedModal({ isOpen, onClose, onAdd }: AddSeedModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [packetCount, setPacketCount] = useState(1);
  const [quantityMg, setQuantityMg] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredSeeds = searchQuery.length >= 2 ? searchSeeds(searchQuery) : seedCatalog;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeed) return;

    setSubmitting(true);
    const success = await onAdd(
      selectedSeed.id,
      packetCount,
      quantityMg,
      notes.trim() || undefined
    );

    if (success) {
      setSearchQuery('');
      setSelectedSeed(null);
      setPacketCount(1);
      setQuantityMg(0);
      setNotes('');
      onClose();
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedSeed(null);
    setPacketCount(1);
    setQuantityMg(0);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Add Seeds to Inventory</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!selectedSeed ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Seeds
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {filteredSeeds.map((seed) => (
                  <button
                    key={seed.id}
                    type="button"
                    onClick={() => setSelectedSeed(seed)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-gray-800 capitalize">{seed.commonName}</div>
                      <div className="text-sm text-gray-500">{seed.cultivar}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      seed.plantType === 'vegetable' ? 'bg-green-100 text-green-700' :
                      seed.plantType === 'herb' ? 'bg-purple-100 text-purple-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {seed.plantType}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-800 capitalize">{selectedSeed.commonName}</div>
                    <div className="text-sm text-gray-600">{selectedSeed.cultivar}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSeed(null)}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packets
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={packetCount}
                    onChange={(e) => setPacketCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (mg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantityMg}
                    onChange={(e) => setQuantityMg(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g., Purchased from Baker Creek"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add to Inventory'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
