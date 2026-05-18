import { useState, useEffect } from 'react';
import { useGardenLocation } from '../../hooks/useGardenLocation';
import { lookupZoneByZip, getFrostDatesByZone, formatFrostDateForInput } from '../../utils/zipCodeLookup';

interface LocationSetupProps {
  onClose?: () => void;
}

export function LocationSetup({ onClose }: LocationSetupProps) {
  const { location, loading, error, saveLocation } = useGardenLocation();

  const [zipCode, setZipCode] = useState('');
  const [hardinessZone, setHardinessZone] = useState('');
  const [lastFrostDate, setLastFrostDate] = useState('');
  const [firstFrostDate, setFirstFrostDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [zoneLookupMessage, setZoneLookupMessage] = useState<string | null>(null);

  // Load existing data
  useEffect(() => {
    if (location) {
      setZipCode(location.zipCode);
      setHardinessZone(location.hardinessZone);
      setLastFrostDate(location.lastFrostDate);
      setFirstFrostDate(location.firstFrostDate);
    }
  }, [location]);

  // Auto-lookup zone when zip code changes
  useEffect(() => {
    if (zipCode.length >= 3) {
      const result = lookupZoneByZip(zipCode);
      if (result.zone) {
        setHardinessZone(result.zone);
        setZoneLookupMessage(`Zone ${result.zone} detected`);

        // Also suggest frost dates if not already set
        const frostDates = getFrostDatesByZone(result.zone);
        if (frostDates && !lastFrostDate) {
          setLastFrostDate(formatFrostDateForInput(frostDates.lastFrost));
        }
        if (frostDates && !firstFrostDate) {
          setFirstFrostDate(formatFrostDateForInput(frostDates.firstFrost));
        }
      } else {
        setZoneLookupMessage(result.error);
      }
    } else {
      setZoneLookupMessage(null);
    }
  }, [zipCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const result = await saveLocation({
      zipCode,
      hardinessZone,
      lastFrostDate,
      firstFrostDate,
    });

    if (result.error) {
      setSaveError(result.error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-500">Loading location settings...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Garden Location</h2>
          <p className="text-gray-500 text-sm mt-1">
            Set your location to get personalized planting schedules
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code
            </label>
            <input
              id="zipCode"
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="12345"
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter your zip code to auto-detect your zone
            </p>
          </div>

          <div>
            <label htmlFor="hardinessZone" className="block text-sm font-medium text-gray-700 mb-1">
              USDA Hardiness Zone
            </label>
            <input
              id="hardinessZone"
              type="text"
              value={hardinessZone}
              onChange={(e) => setHardinessZone(e.target.value)}
              placeholder="e.g., 7a"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-gray-50"
            />
            {zoneLookupMessage && (
              <p className={`text-xs mt-1 ${zoneLookupMessage.includes('detected') ? 'text-green-600' : 'text-amber-600'}`}>
                {zoneLookupMessage}
              </p>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Frost Dates</h3>
          <p className="text-gray-500 text-sm mb-4">
            These dates are auto-suggested based on your zone. Adjust them if you know your local averages.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="lastFrostDate" className="block text-sm font-medium text-gray-700 mb-1">
                Last Spring Frost
              </label>
              <input
                id="lastFrostDate"
                type="date"
                value={lastFrostDate}
                onChange={(e) => setLastFrostDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Average date of last frost in spring
              </p>
            </div>

            <div>
              <label htmlFor="firstFrostDate" className="block text-sm font-medium text-gray-700 mb-1">
                First Fall Frost
              </label>
              <input
                id="firstFrostDate"
                type="date"
                value={firstFrostDate}
                onChange={(e) => setFirstFrostDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Average date of first frost in fall
              </p>
            </div>
          </div>
        </div>

        {(error || saveError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error || saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            Location saved successfully!
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </form>
    </div>
  );
}
