import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface BedSquareData {
  id: string;
  bed: 1 | 2 | 3;
  position: string;
  plantedSeedId?: string;
  plantedSeedName?: string;
  plantedSeedType?: string;
  plantedDate?: string;
  status: 'empty' | 'planted' | 'growing' | 'harvesting' | 'done';
}

export function useBedSquares() {
  const { user } = useAuth();
  const [bedSquares, setBedSquares] = useState<BedSquareData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBedSquares = useCallback(async () => {
    if (!user) { setBedSquares([]); setLoading(false); return; }

    const { data, error } = await supabase
      .from('bed_squares')
      .select(`
        id, bed, position, planted_seed_id, planted_date, status,
        seed_catalog (common_name, plant_type)
      `)
      .eq('user_id', user.id);

    if (error) { console.error('Error fetching bed squares:', error); setLoading(false); return; }

    setBedSquares((data || []).map((sq: any) => ({
      id: sq.id,
      bed: sq.bed,
      position: sq.position,
      plantedSeedId: sq.planted_seed_id ?? undefined,
      plantedSeedName: sq.seed_catalog?.common_name ?? undefined,
      plantedSeedType: sq.seed_catalog?.plant_type ?? undefined,
      plantedDate: sq.planted_date ?? undefined,
      status: sq.status ?? 'empty',
    })));

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBedSquares(); }, [fetchBedSquares]);

  const plantSquare = async (bed: 1 | 2 | 3, position: string, seedId: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from('bed_squares').upsert({
      user_id: user.id,
      bed,
      position,
      planted_seed_id: seedId,
      planted_date: new Date().toISOString().split('T')[0],
      status: 'planted',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,bed,position' });
    if (error) { console.error('Error planting square:', error); return false; }
    await fetchBedSquares();
    return true;
  };

  const clearSquare = async (bed: 1 | 2 | 3, position: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from('bed_squares').upsert({
      user_id: user.id,
      bed,
      position,
      planted_seed_id: null,
      planted_date: null,
      status: 'empty',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,bed,position' });
    if (error) { console.error('Error clearing square:', error); return false; }
    await fetchBedSquares();
    return true;
  };

  const getSquare = (bed: 1 | 2 | 3, position: string) =>
    bedSquares.find(sq => sq.bed === bed && sq.position === position);

  const advanceStage = async (
    bed: 1 | 2 | 3,
    position: string,
    status: 'growing' | 'harvesting'
  ): Promise<boolean> => {
    if (!user) return false;
    const sq = getSquare(bed, position);
    if (!sq?.id) return false;
    const { error } = await supabase
      .from('bed_squares')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sq.id)
      .eq('user_id', user.id);
    if (error) { console.error('Error advancing stage:', error); return false; }
    await fetchBedSquares();
    return true;
  };

  return { bedSquares, loading, plantSquare, clearSquare, getSquare, advanceStage };
}
