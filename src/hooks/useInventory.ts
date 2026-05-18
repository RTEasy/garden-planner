import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface InventoryItem {
  id: string;
  seedId: string;
  quantityMg: number;
  packetCount: number;
  dateAdded: string;
  notes?: string;
}

export interface InventoryItemWithSeed extends InventoryItem {
  seed: {
    commonName: string;
    cultivar: string;
    plantType: string;
    spacing: string;
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
          seed_catalog (
            common_name,
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
        seed: {
          commonName: item.seed_catalog?.common_name || '',
          cultivar: item.seed_catalog?.cultivar || '',
          plantType: item.seed_catalog?.plant_type || '',
          spacing: item.seed_catalog?.spacing || '',
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

  return {
    inventory,
    loading,
    error,
    addToInventory,
    updateInventoryItem,
    removeFromInventory,
    refresh: fetchInventory,
  };
}
