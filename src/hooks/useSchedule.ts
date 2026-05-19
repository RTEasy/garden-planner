import { useMemo } from 'react';
import { startOfDay, isBefore } from 'date-fns';
import { useInventory } from './useInventory';
import { useGardenLocation } from './useGardenLocation';
import { getSeedById } from '../data/seedCatalog';
import { parseTimingString, parseAlmanacDateRange, parseLastPlantingDate, DateRange, getPlantingStatus } from '../utils/dateCalculations';
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
  lastPlantingDate?: string;
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

      // Start Seeds Indoors task
      // Prefer Almanac dates, fall back to relative timing
      const indoorRange = parseAlmanacDateRange(seed.almanacIndoors) ||
        parseTimingString(seed.insideStartTime, lastFrost, firstFrost);

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
          lastPlantingDate: seed.almanacLastPlanting,
        });
      }

      // Transplant Outdoors task
      const transplantRange = parseAlmanacDateRange(seed.almanacTransplant);
      if (transplantRange) {
        generatedTasks.push({
          id: `${item.seedId}-transplant`,
          seedId: item.seedId,
          seedName: seed.commonName,
          cultivar: seed.cultivar,
          action: 'transplant',
          dateRange: transplantRange,
          status: getPlantingStatus(transplantRange),
          instructions: `Transplant ${seed.commonName} seedlings outdoors. Spacing: ${seed.spacing}`,
          lastPlantingDate: seed.almanacLastPlanting,
        });
      }

      // Direct Sow task
      const directSowRange = parseAlmanacDateRange(seed.almanacDirectSow) ||
        (seed.insideStartTime === 'not recommended' ? parseTimingString(seed.sowTimeOutside, lastFrost, firstFrost) : null);

      if (directSowRange) {
        generatedTasks.push({
          id: `${item.seedId}-directsow`,
          seedId: item.seedId,
          seedName: seed.commonName,
          cultivar: seed.cultivar,
          action: 'direct sow',
          dateRange: directSowRange,
          status: getPlantingStatus(directSowRange),
          instructions: `Direct sow ${seed.commonName} outdoors. Spacing: ${seed.spacing}, Depth: ${seed.depth}`,
          lastPlantingDate: seed.almanacLastPlanting,
        });
      }
    }

    // Generate extended tasks for seeds where optimal window passed but lastPlantingDate is still future
    const today = startOfDay(new Date());
    for (const item of inventory) {
      const seed = getSeedById(item.seedId);
      if (!seed?.almanacLastPlanting) continue;

      const lastPlanting = parseLastPlantingDate(seed.almanacLastPlanting);
      if (!lastPlanting || isBefore(lastPlanting, today)) continue;

      const seedTasks = generatedTasks.filter(t => t.seedId === item.seedId);
      const hasActiveOrUpcoming = seedTasks.some(t => t.status === 'active' || t.status === 'upcoming');
      if (hasActiveOrUpcoming) continue;

      const canDirectSow = seed.insideStartTime === 'not recommended' || !!seed.almanacDirectSow;
      const action: PlantingAction = canDirectSow ? 'direct sow' : 'transplant';

      generatedTasks.push({
        id: `${item.seedId}-extended`,
        seedId: item.seedId,
        seedName: seed.commonName,
        cultivar: seed.cultivar,
        action,
        dateRange: { start: today, end: lastPlanting },
        status: 'active',
        instructions: action === 'direct sow'
          ? `Direct sow ${seed.commonName} outdoors now. Spacing: ${seed.spacing}, Depth: ${seed.depth}. Last chance to plant: ${seed.almanacLastPlanting}.`
          : `Transplant ${seed.commonName} seedlings outdoors now. Spacing: ${seed.spacing}. Last chance to plant: ${seed.almanacLastPlanting}.`,
        lastPlantingDate: seed.almanacLastPlanting,
      });
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
