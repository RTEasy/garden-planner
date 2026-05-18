import { useMemo } from 'react';
import { useInventory } from './useInventory';
import { useGardenLocation } from './useGardenLocation';
import { getSeedById } from '../data/seedCatalog';
import { parseTimingString, DateRange, getPlantingStatus } from '../utils/dateCalculations';
import { PlantingAction } from '../types';

export interface PlantingTask {
  id: string;
  seedId: string;
  seedName: string;
  cultivar: string;
  action: PlantingAction;
  dateRange: DateRange;
  status: 'past' | 'active' | 'upcoming' | 'future';
  instructions: string;
}

export function useSchedule() {
  const { inventory, loading: inventoryLoading } = useInventory();
  const { location, loading: locationLoading } = useGardenLocation();

  const tasks = useMemo(() => {
    if (!location?.lastFrostDate || !location?.firstFrostDate) {
      return [];
    }

    const lastFrost = new Date(location.lastFrostDate);
    const firstFrost = new Date(location.firstFrostDate);
    const generatedTasks: PlantingTask[] = [];

    for (const item of inventory) {
      const seed = getSeedById(item.seedId);
      if (!seed) continue;

      // Indoor start task
      const indoorRange = parseTimingString(seed.insideStartTime, lastFrost, firstFrost);
      if (indoorRange) {
        generatedTasks.push({
          id: `${item.seedId}-indoor`,
          seedId: item.seedId,
          seedName: seed.commonName,
          cultivar: seed.cultivar,
          action: 'start indoors',
          dateRange: indoorRange,
          status: getPlantingStatus(indoorRange),
          instructions: seed.germinationInstructions || `Start ${seed.commonName} seeds indoors`,
        });
      }

      // Outdoor sow task
      const outdoorRange = parseTimingString(seed.sowTimeOutside, lastFrost, firstFrost);
      if (outdoorRange) {
        const action: PlantingAction = seed.insideStartTime === 'not recommended'
          ? 'direct sow'
          : 'transplant';

        generatedTasks.push({
          id: `${item.seedId}-outdoor`,
          seedId: item.seedId,
          seedName: seed.commonName,
          cultivar: seed.cultivar,
          action,
          dateRange: outdoorRange,
          status: getPlantingStatus(outdoorRange),
          instructions: action === 'direct sow'
            ? `Direct sow ${seed.commonName} outdoors. Spacing: ${seed.spacing}, Depth: ${seed.depth}`
            : `Transplant ${seed.commonName} seedlings outdoors. Spacing: ${seed.spacing}`,
        });
      }
    }

    // Sort by start date
    generatedTasks.sort((a, b) => a.dateRange.start.getTime() - b.dateRange.start.getTime());

    return generatedTasks;
  }, [inventory, location]);

  const activeTasks = useMemo(() => tasks.filter(t => t.status === 'active'), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter(t => t.status === 'upcoming'), [tasks]);
  const futureTasks = useMemo(() => tasks.filter(t => t.status === 'future'), [tasks]);
  const pastTasks = useMemo(() => tasks.filter(t => t.status === 'past'), [tasks]);

  return {
    tasks,
    activeTasks,
    upcomingTasks,
    futureTasks,
    pastTasks,
    loading: inventoryLoading || locationLoading,
    hasLocation: !!location?.lastFrostDate,
    hasInventory: inventory.length > 0,
  };
}
