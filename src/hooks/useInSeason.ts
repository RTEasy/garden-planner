import { useMemo } from 'react';
import { useGardenLocation } from './useGardenLocation';
import { seedCatalog } from '../data/seedCatalog';
import { parseTimingString, getPlantingStatus, DateRange } from '../utils/dateCalculations';
import { Seed } from '../types';

export interface InSeasonSeed {
  seed: Seed;
  action: 'start indoors' | 'direct sow';
  dateRange: DateRange;
  status: 'active' | 'upcoming';
}

export function useInSeason() {
  const { location, loading } = useGardenLocation();

  const inSeasonSeeds = useMemo(() => {
    if (!location?.lastFrostDate || !location?.firstFrostDate) {
      return [];
    }

    const lastFrost = new Date(location.lastFrostDate);
    const firstFrost = new Date(location.firstFrostDate);
    const results: InSeasonSeed[] = [];

    for (const seed of seedCatalog) {
      // Check indoor start timing
      const indoorRange = parseTimingString(seed.insideStartTime, lastFrost, firstFrost);
      if (indoorRange) {
        const status = getPlantingStatus(indoorRange);
        if (status === 'active' || status === 'upcoming') {
          results.push({
            seed,
            action: 'start indoors',
            dateRange: indoorRange,
            status,
          });
        }
      }

      // Check outdoor sow timing
      const outdoorRange = parseTimingString(seed.sowTimeOutside, lastFrost, firstFrost);
      if (outdoorRange) {
        const status = getPlantingStatus(outdoorRange);
        if (status === 'active' || status === 'upcoming') {
          results.push({
            seed,
            action: 'direct sow',
            dateRange: outdoorRange,
            status,
          });
        }
      }
    }

    // Sort: active first, then by start date
    results.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return a.dateRange.start.getTime() - b.dateRange.start.getTime();
    });

    return results;
  }, [location]);

  const activeSeeds = useMemo(() => inSeasonSeeds.filter(s => s.status === 'active'), [inSeasonSeeds]);
  const upcomingSeeds = useMemo(() => inSeasonSeeds.filter(s => s.status === 'upcoming'), [inSeasonSeeds]);

  return {
    inSeasonSeeds,
    activeSeeds,
    upcomingSeeds,
    loading,
    hasLocation: !!location?.lastFrostDate,
  };
}
