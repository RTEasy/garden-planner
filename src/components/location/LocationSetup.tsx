import { useState, useEffect } from 'react';
import { useGardenLocation } from '../../hooks/useGardenLocation';

// Common hardiness zones for the US
const HARDINESS_ZONES = [
  '3a', '3b', '4a', '4b', '5a', '5b', '6a', '6b',
  '7a', '7b', '8a', '8b', '9a', '9b', '10a', '10b', '11a', '11b'
];

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

  // Load existing data
  useEffect(() => {
    if (location) {
      setZipCode(location.zipCode);
      setHardinessZone(location.hardinessZone);
      setLastFrostDate(location.lastFrostDate);
      setFirstFrostDate(location.firstFrostDate);
    }
  }, [location]);

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
          </div>

          <div>
            <label htmlFor="hardinessZone" className="block text-sm font-medium text-gray-700 mb-1">
              USDA Hardiness Zone
            </label>
            <select
              id="hardinessZone"
              value={hardinessZone}
              onChange={(e) => setHardinessZone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="">Select zone...</option>
              {HARDINESS_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  Zone {zone}
                </option>
              ))}
            </select>
            <a
              href="https://planthardiness.ars.usda.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:text-green-700 mt-1 inline-block"
            >
              Find your zone →
            </a>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Frost Dates</h3>
          <p className="text-gray-500 text-sm mb-4">
            Enter your average last spring frost and first fall frost dates.
            These are used to calculate planting windows.
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
