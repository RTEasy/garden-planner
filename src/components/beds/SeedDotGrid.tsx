interface Props {
  count: number;
  plantType?: string;
}

const TYPE_DOT_COLOR: Record<string, string> = {
  vegetable: 'bg-green-500',
  herb:      'bg-purple-400',
  flower:    'bg-pink-400',
};

export function SeedDotGrid({ count, plantType }: Props) {
  const color = TYPE_DOT_COLOR[plantType ?? ''] ?? 'bg-green-500';

  const cols =
    count >= 16 ? 4 :
    count >= 9  ? 3 :
    count >= 4  ? 2 : 1;

  const dotSize =
    count >= 16 ? 'w-2 h-2' :
    count >= 9  ? 'w-2.5 h-2.5' :
    count >= 4  ? 'w-3 h-3' :
    count === 2 ? 'w-3.5 h-3.5' :
                  'w-5 h-5';

  const gap = count >= 9 ? 'gap-0.5' : 'gap-1';

  return (
    <div
      className={`grid ${gap}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${dotSize} ${color} rounded-full opacity-80`}
        />
      ))}
    </div>
  );
}
