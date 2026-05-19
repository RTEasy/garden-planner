import { getSeedById } from '../../data/seedCatalog';
import { InventoryItemWithSeed } from '../../hooks/useInventory';
import { parseAlmanacDateRange, parseLastPlantingDate } from '../../utils/dateCalculations';

interface Props {
  inventory: InventoryItemWithSeed[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTH_START_DAYS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

function toPct(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const dayNum = Math.ceil((date.getTime() - start.getTime()) / 86400000) + 1;
  return ((dayNum - 1) / 365) * 100;
}

interface Bar {
  label: string;
  color: string;
  startPct: number;
  endPct: number;
}

const LEGEND = [
  { color: 'bg-blue-400', label: 'Start Indoors' },
  { color: 'bg-violet-400', label: 'Transplant' },
  { color: 'bg-green-500', label: 'Sow Outside' },
  { color: 'bg-amber-400', label: 'Harvest' },
  { color: 'bg-pink-400', label: 'Bloom' },
];

function getBars(item: InventoryItemWithSeed): Bar[] {
  const seed = getSeedById(item.seedId);
  if (!seed) return [];

  const bars: Bar[] = [];

  if (seed.almanacIndoors) {
    const r = parseAlmanacDateRange(seed.almanacIndoors);
    if (r) bars.push({ label: 'Start Indoors', color: 'bg-blue-400', startPct: toPct(r.start), endPct: toPct(r.end) });
  }

  if (seed.almanacTransplant) {
    const r = parseAlmanacDateRange(seed.almanacTransplant);
    if (r) bars.push({ label: 'Transplant', color: 'bg-violet-400', startPct: toPct(r.start), endPct: toPct(r.end) });
  }

  if (seed.almanacDirectSow) {
    const r = parseAlmanacDateRange(seed.almanacDirectSow);
    if (r) {
      let endDate = r.end;
      if (seed.almanacLastPlanting) {
        const last = parseLastPlantingDate(seed.almanacLastPlanting);
        if (last) endDate = last;
      }
      bars.push({ label: 'Sow Outside', color: 'bg-green-500', startPct: toPct(r.start), endPct: toPct(endDate) });
    }
  }

  if (seed.almanacHarvest) {
    const r = parseAlmanacDateRange(seed.almanacHarvest);
    if (r) bars.push({ label: 'Harvest', color: 'bg-amber-400', startPct: toPct(r.start), endPct: toPct(r.end) });
  }

  if (seed.almanacBloom) {
    const r = parseAlmanacDateRange(seed.almanacBloom);
    if (r) bars.push({ label: 'Bloom', color: 'bg-pink-400', startPct: toPct(r.start), endPct: toPct(r.end) });
  }

  return bars;
}

// Fixed vertical lane per bar type so bars never overlap
const LANE_TOP: Record<string, number> = {
  'Start Indoors': 2,
  'Transplant':    10,
  'Sow Outside':   18,
  'Harvest':       2,   // temporally separate from Start Indoors
  'Bloom':         10,  // temporally separate from Transplant
};
const LANE_H = 7;

function SeedRow({ item, todayPct }: { item: InventoryItemWithSeed; todayPct: number }) {
  const bars = getBars(item);

  return (
    <div className="flex items-center group">
      <div className="w-36 shrink-0 pr-3 text-right">
        <div className="text-xs font-medium text-gray-700 capitalize truncate">{item.seed.commonName}</div>
        <div className="text-[10px] text-gray-400 truncate">{item.seed.cultivar}</div>
      </div>
      <div className="flex-1 relative h-8 group-hover:bg-gray-50 rounded">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`absolute rounded-sm opacity-75 ${bar.color}`}
            style={{
              top: `${LANE_TOP[bar.label] ?? 2}px`,
              height: `${LANE_H}px`,
              left: `${bar.startPct}%`,
              width: `${Math.max(bar.endPct - bar.startPct, 0.8)}%`,
            }}
            title={bar.label}
          />
        ))}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-400 opacity-50 pointer-events-none"
          style={{ left: `${todayPct}%` }}
        />
      </div>
    </div>
  );
}

function GroupSection({
  title,
  items,
  todayPct,
  dotColor,
}: {
  title: string;
  items: InventoryItemWithSeed[];
  todayPct: number;
  dotColor: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center mb-1">
        <div className="w-36 shrink-0 pr-3 text-right">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${dotColor}`}>{title}</span>
        </div>
        <div className="flex-1 border-t border-gray-100" />
      </div>
      <div className="space-y-0.5">
        {items.map(item => (
          <SeedRow key={item.id} item={item} todayPct={todayPct} />
        ))}
      </div>
    </div>
  );
}

export function ScheduleTimeline({ inventory }: Props) {
  const today = new Date();
  const todayPct = toPct(today);

  const vegetables = inventory.filter(i => i.seed.plantType === 'vegetable');
  const herbs = inventory.filter(i => i.seed.plantType === 'herb');
  const flowers = inventory.filter(i => i.seed.plantType === 'flower');

  if (inventory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        Add seeds to your inventory to see the planting timeline.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto min-w-0">
      {/* Month header */}
      <div className="flex items-end mb-3">
        <div className="w-36 shrink-0" />
        <div className="flex-1 relative h-5">
          {MONTHS.map((month, i) => (
            <span
              key={month}
              className="absolute text-[10px] text-gray-400 font-medium -translate-x-1/2"
              style={{ left: `${((MONTH_START_DAYS[i] - 1) / 365) * 100}%` }}
            >
              {month}
            </span>
          ))}
          {/* Today label */}
          <div
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${todayPct}%` }}
          >
            <span className="text-[9px] text-red-400 font-semibold -translate-x-1/2 whitespace-nowrap">today</span>
          </div>
        </div>
      </div>

      {/* Month grid lines behind all rows */}
      <div className="relative">
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-36 shrink-0" />
          <div className="flex-1 relative">
            {MONTH_START_DAYS.map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-100"
                style={{ left: `${((MONTH_START_DAYS[i] - 1) / 365) * 100}%` }}
              />
            ))}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-300 opacity-40"
              style={{ left: `${todayPct}%` }}
            />
          </div>
        </div>

        <GroupSection title="Vegetables" items={vegetables} todayPct={todayPct} dotColor="text-green-700" />
        <GroupSection title="Herbs" items={herbs} todayPct={todayPct} dotColor="text-purple-700" />
        <GroupSection title="Flowers" items={flowers} todayPct={todayPct} dotColor="text-pink-600" />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 flex-wrap">
        <div className="w-36 shrink-0" />
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-5 h-3 rounded-sm opacity-75 ${color}`} />
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-px h-4 bg-red-400 opacity-60" />
          <span className="text-[11px] text-gray-500">Today</span>
        </div>
      </div>
    </div>
  );
}
