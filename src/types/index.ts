export type PlantType = 'flower' | 'herb' | 'vegetable';
export type Lifecycle = 'annual' | 'biennial' | 'perennial';
export type PlantingAction = 'start indoors' | 'direct sow' | 'transplant' | 'succession sow';
export type SquareStatus = 'empty' | 'planted' | 'growing' | 'harvesting' | 'done';

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
  seedQuantityPerSpace: number;
  depth: string;
  sowTimeOutside: string;
  insideStartTime: string;
  growHeight: string;
  growWidth: string;
  germinationInstructions: string;
  animalResistance: string;
  bloom: string;
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
