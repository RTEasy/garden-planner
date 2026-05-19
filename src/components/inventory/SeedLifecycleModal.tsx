import { useState } from 'react';
import { ProcessType } from '../../types';
import { parseAlmanacDateRange, formatDateRange } from '../../utils/dateCalculations';

interface Props {
  isOpen: boolean;
  seedName: string;
  cultivar: string;
  defaultProcessType?: ProcessType;
  almanacIndoors?: string;
  almanacDirectSow?: string;
  almanacTransplant?: string;
  onConfirm: (processType: ProcessType, actionDate: string) => void;
  onClose: () => void;
}

export function SeedLifecycleModal({
  isOpen, seedName, cultivar, defaultProcessType,
  almanacIndoors, almanacDirectSow, almanacTransplant,
  onConfirm, onClose,
}: Props) {
  const [processType, setProcessType] = useState<ProcessType>(defaultProcessType || 'starting_indoors');
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const indoorsRange = parseAlmanacDateRange(almanacIndoors);
  const directSowRange = parseAlmanacDateRange(almanacDirectSow);
  const transplantRange = parseAlmanacDateRange(almanacTransplant);

  const hint = processType === 'starting_indoors'
    ? indoorsRange ? `Recommended window: ${formatDateRange(indoorsRange)}` : null
    : directSowRange ? `Recommended window: ${formatDateRange(directSowRange)}` : null;

  const transplantHint = processType === 'starting_indoors' && transplantRange
    ? `Transplant window: ${formatDateRange(transplantRange)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Starting Seeds</h2>
        <p className="text-gray-500 text-sm mb-6 capitalize">
          {seedName} <span className="italic">({cultivar})</span>
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How are you starting these?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProcessType('starting_indoors')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  processType === 'starting_indoors'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-800 text-sm">Starting Indoors</div>
                <div className="text-xs text-gray-500 mt-0.5">In trays or pots</div>
              </button>
              <button
                onClick={() => setProcessType('direct_sow')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  processType === 'direct_sow'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-800 text-sm">Direct Sowing</div>
                <div className="text-xs text-gray-500 mt-0.5">Straight into the bed</div>
              </button>
            </div>
          </div>

          {/* Date hints */}
          {(hint || transplantHint) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 space-y-1">
              {hint && <p className="text-xs text-blue-800"><span className="font-medium">For Calistoga:</span> {hint}</p>}
              {transplantHint && <p className="text-xs text-blue-700">{transplantHint}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={actionDate}
              onChange={e => setActionDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onConfirm(processType, actionDate)}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
