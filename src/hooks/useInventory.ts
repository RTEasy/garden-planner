import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { seedCatalog } from '../data/seedCatalog';
import { SeedStatus, ProcessType } from '../types';

export interface InventoryItem {
  id: string;
  seedId: string;
  quantityMg: number;
  packetCount: number;
  dateAdded: string;
  notes?: string;
  status: SeedStatus;
  processType?: ProcessType;
  actionDate?: string;
}

export interface InventoryItemWithSeed extends InventoryItem {
  seed: {
    commonName: string;
    genusSpecies: string;
    cultivar: string;
    plantType: string;
    spacing: string;
    sfgPerSquare?: number;
  };
}

export function useInventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItemWithSeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!user) {
      setInventory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select(`
          id,
          seed_id,
          quantity_mg,
          packet_count,
          date_added,
          notes,
          status,
          process_type,
          action_date,
          seed_catalog (
            common_name,
            genus_species,
            cultivar,
            plant_type,
            spacing
          )
        `)
        .eq('user_id', user.id)
        .order('date_added', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: InventoryItemWithSeed[] = (data || []).map((item: any) => ({
        id: item.id,
        seedId: item.seed_id,
        quantityMg: item.quantity_mg || 0,
        packetCount: item.packet_count || 0,
        dateAdded: item.date_added,
        notes: item.notes,
        status: (item.status || 'in_inventory') as SeedStatus,
        processType: item.process_type as ProcessType | undefined,
        actionDate: item.action_date || undefined,
        seed: {
          commonName: item.seed_catalog?.common_name || '',
          genusSpecies: item.seed_catalog?.genus_species || '',
          cultivar: item.seed_catalog?.cultivar || '',
          plantType: item.seed_catalog?.plant_type || '',
          spacing: item.seed_catalog?.spacing || '',
          sfgPerSquare: seedCatalog.find(s => s.id === item.seed_id)?.sfgPerSquare,
        },
      }));

      setInventory(mapped);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addToInventory = async (
    seedId: string,
    packetCount: number,
    quantityMg: number = 0,
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const { error: insertError } = await supabase.from('inventory').insert({
        user_id: user.id,
        seed_id: seedId,
        packet_count: packetCount,
        quantity_mg: quantityMg,
        notes: notes || null,
      });

      if (insertError) throw insertError;

      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Error adding to inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to inventory');
      return false;
    }
  };

  const updateInventoryItem = async (
    id: string,
    updates: { packetCount?: number; quantityMg?: number; notes?: string }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const updateData: any = {};
      if (updates.packetCount !== undefined) updateData.packet_count = updates.packetCount;
      if (updates.quantityMg !== undefined) updateData.quantity_mg = updates.quantityMg;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;

      const { error: updateError } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Error updating inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to update inventory');
      return false;
    }
  };

  const removeFromInventory = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Error removing from inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove from inventory');
      return false;
    }
  };

  const importAllSeeds = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      // Get existing seed IDs in inventory
      const existingSeedIds = new Set(inventory.map(item => item.seedId));

      // Filter to seeds not already in inventory
      const newSeeds = seedCatalog.filter(seed => !existingSeedIds.has(seed.id));

      if (newSeeds.length === 0) {
        return true; // All seeds already imported
      }

      // Bulk insert with default inventory quantities from catalog
      const { error: insertError } = await supabase.from('inventory').insert(
        newSeeds.map(seed => ({
          user_id: user.id,
          seed_id: seed.id,
          packet_count: 1,
          quantity_mg: seed.seedInventoryMg || 0,
        }))
      );

      if (insertError) throw insertError;

      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Error importing seeds:', err);
      setError(err instanceof Error ? err.message : 'Failed to import seeds');
      return false;
    }
  };

  const advanceStatus = async (
    id: string,
    status: SeedStatus,
    processType?: ProcessType,
    actionDate?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (processType !== undefined) updateData.process_type = processType;
      if (actionDate !== undefined) updateData.action_date = actionDate;

      const { error: updateError } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Error advancing status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
      return false;
    }
  };

  const removeAllFromInventory = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchInventory();
      return true;
    } catch (err) {
      console.error('Error removing all from inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove all from inventory');
      return false;
    }
  };

  return {
    inventory,
    loading,
    error,
    addToInventory,
    updateInventoryItem,
    advanceStatus,
    removeFromInventory,
    removeAllFromInventory,
    importAllSeeds,
    refresh: fetchInventory,
  };
}
