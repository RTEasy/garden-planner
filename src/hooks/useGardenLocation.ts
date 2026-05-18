import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface GardenLocation {
  id?: string;
  zipCode: string;
  hardinessZone: string;
  lastFrostDate: string;
  firstFrostDate: string;
}

export function useGardenLocation() {
  const { user } = useAuth();
  const [location, setLocation] = useState<GardenLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch location on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchLocation();
  }, [user]);

  const fetchLocation = async () => {
    if (!supabase || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('garden_locations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      setError(error.message);
    } else if (data) {
      setLocation({
        id: data.id,
        zipCode: data.zip_code || '',
        hardinessZone: data.hardiness_zone || '',
        lastFrostDate: data.last_frost_date || '',
        firstFrostDate: data.first_frost_date || '',
      });
    }
    setLoading(false);
  };

  const saveLocation = async (locationData: Omit<GardenLocation, 'id'>) => {
    if (!supabase || !user) return { error: 'Not authenticated' };

    setError(null);

    // Check if location exists
    const { data: existing } = await supabase
      .from('garden_locations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from('garden_locations')
        .update({
          zip_code: locationData.zipCode,
          hardiness_zone: locationData.hardinessZone,
          last_frost_date: locationData.lastFrostDate || null,
          first_frost_date: locationData.firstFrostDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from('garden_locations')
        .insert({
          user_id: user.id,
          zip_code: locationData.zipCode,
          hardiness_zone: locationData.hardinessZone,
          last_frost_date: locationData.lastFrostDate || null,
          first_frost_date: locationData.firstFrostDate || null,
        })
        .select()
        .single();
    }

    if (result.error) {
      setError(result.error.message);
      return { error: result.error.message };
    }

    setLocation({
      id: result.data.id,
      zipCode: result.data.zip_code || '',
      hardinessZone: result.data.hardiness_zone || '',
      lastFrostDate: result.data.last_frost_date || '',
      firstFrostDate: result.data.first_frost_date || '',
    });

    return { error: null };
  };

  return {
    location,
    loading,
    error,
    saveLocation,
    refetch: fetchLocation,
  };
}
