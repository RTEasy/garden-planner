import { Seed } from '../../types';

interface SeedPacketCardProps {
  seed: Seed;
}

export function SeedPacketCard({ seed }: SeedPacketCardProps) {
  // Simple plant emoji based on type
  const plantEmoji = seed.plantType === 'flower' ? '🌸'
    : seed.plantType === 'herb' ? '🌿'
    : '🥬';

  return (
    <div className="w-72 bg-amber-50 border-2 border-amber-600 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-amber-600 text-white px-3 py-2 text-center">
        <div className="text-lg font-bold capitalize">{seed.commonName}</div>
        <div className="text-amber-100 text-sm">'{seed.cultivar}'</div>
      </div>

      {/* Plant Image Area */}
      <div className="bg-gradient-to-b from-green-100 to-green-200 h-24 flex items-center justify-center">
        <span className="text-6xl">{plantEmoji}</span>
      </div>

      {/* Scientific Name */}
      <div className="bg-amber-100 px-3 py-1 text-center">
        <span className="text-sm italic text-amber-800">{seed.genusSpecies}</span>
      </div>

      {/* Details Grid */}
      <div className="p-3 text-xs space-y-2 bg-white">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div>
            <span className="font-semibold text-gray-600">Type:</span>
            <span className="ml-1 capitalize">{seed.plantType}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Lifecycle:</span>
            <span className="ml-1 capitalize">{seed.lifecycle}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Sun:</span>
            <span className="ml-1">{seed.sun}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Spacing:</span>
            <span className="ml-1">{seed.spacing}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Depth:</span>
            <span className="ml-1">{seed.depth}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Seeds/Space:</span>
            <span className="ml-1">{seed.seedQuantityPerSpace}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Height:</span>
            <span className="ml-1">{seed.growHeight}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-600">Width:</span>
            <span className="ml-1">{seed.growWidth}</span>
          </div>
        </div>

        <div className="border-t pt-2 mt-2">
          <div className="font-semibold text-gray-600 mb-1">Planting Calendar (Calistoga):</div>
          {seed.almanacIndoors && (
            <div><span className="text-gray-500">Start Indoors:</span> {seed.almanacIndoors}</div>
          )}
          {seed.almanacTransplant && (
            <div><span className="text-gray-500">Transplant:</span> {seed.almanacTransplant}</div>
          )}
          {seed.almanacDirectSow && (
            <div><span className="text-gray-500">Direct Sow:</span> {seed.almanacDirectSow}</div>
          )}
          {seed.almanacLastPlanting && (
            <div><span className="text-gray-500">Last Planting:</span> {seed.almanacLastPlanting}</div>
          )}
          {!seed.almanacIndoors && !seed.almanacTransplant && !seed.almanacDirectSow && (
            <>
              <div><span className="text-gray-500">Outdoors:</span> {seed.sowTimeOutside}</div>
              <div><span className="text-gray-500">Indoors:</span> {seed.insideStartTime}</div>
            </>
          )}
        </div>

        <div className="border-t pt-2 mt-2">
          <div><span className="font-semibold text-gray-600">Emerges:</span> {seed.daysToEmerge}</div>
          {seed.bloom && seed.bloom !== 'n/a' && (
            <div><span className="font-semibold text-gray-600">Blooms:</span> {seed.bloom}</div>
          )}
          <div><span className="font-semibold text-gray-600">Resistance:</span> {seed.animalResistance}</div>
        </div>

        {seed.germinationInstructions && (
          <div className="border-t pt-2 mt-2">
            <div className="font-semibold text-gray-600 mb-1">Germination Tips:</div>
            <div className="text-gray-700 leading-tight">{seed.germinationInstructions}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-amber-600 px-3 py-1 text-center">
        <span className="text-amber-100 text-xs">
          {seed.seedInventoryMg > 0 ? `${seed.seedInventoryMg}mg` : 'Seed Packet'}
        </span>
      </div>
    </div>
  );
}
