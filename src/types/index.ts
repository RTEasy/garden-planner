export type PlantType = 'flower' | 'herb' | 'vegetable';
export type Lifecycle = 'annual' | 'biennial' | 'perennial';
export type PlantingAction = 'start indoors' | 'direct sow' | 'transplant' | 'succession sow';
export type SquareStatus = 'empty' | 'planted' | 'growing' | 'harvesting' | 'done';
export type SeedStatus = 'in_inventory' | 'in_process' | 'planted';
export type ProcessType = 'starting_indoors' | 'direct_sow';

export interface Seed {
  id: string;
  commonName: string;
  genusSpecies: string;
  cultivar: string;
  plantType: PlantType;
  lifecycle: Lifecycle;
  daysToEmerge: string;
  sun: string;
  spacing: string;
  seedQuantityPerSpace: number | string;
  depth: string;
  // Legacy relative timing (used as fallback)
  sowTimeOutside: string;
  insideStartTime: string;
  // Almanac-style specific date ranges (for Calistoga, CA - last frost Mar 25)
  almanacIndoors?: string;      // e.g., "Jan 27-Feb 10"
  almanacTransplant?: string;   // e.g., "Apr 8-15"
  almanacDirectSow?: string;    // e.g., "Feb 24-Mar 11"
  almanacLastPlanting?: string; // e.g., "Apr 8"
  growHeight: string;
  growWidth: string;
  germinationInstructions: string;
  animalResistance: string;
  bloom: string;
  seedInventoryMg: number;
}

export interface InventoryItem {
  id: string;
  seedId: string;
  quantityMg: number;
  dateAdded: string;
  notes?: string;
  userId: string;
}

export interface GardenLocation {
  id: string;
  userId: string;
  zipCode: string;
  hardinessZone: string;
  lastFrostDate: string; // ISO date string
  firstFrostDate: string; // ISO date string
}

export interface PlantingTask {
  id: string;
  userId: string;
  seedId: string;
  action: PlantingAction;
  startDate: string;
  endDate: string;
  location: string;
  squareFeet: number;
  notes: string;
  completed: boolean;
  completedDate?: string;
}

export interface BedSquare {
  id: string;
  userId: string;
  bed: 1 | 2 | 3;
  position: string; // A1, A2, ... D4
  plantedSeedId?: string;
  plantedDate?: string;
  status: SquareStatus;
  notes?: string;
}

// Grid positions for a 4x4 bed
export const BED_POSITIONS = [
  'A1', 'A2', 'A3', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D1', 'D2', 'D3', 'D4',
] as const;

export type BedPosition = typeof BED_POSITIONS[number];
