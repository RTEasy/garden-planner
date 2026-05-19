export interface CompanionRule {
  type: 'good' | 'bad';
  reason: string;
}

const rules: Record<string, CompanionRule> = {};

function add(seedA: string, seedB: string, type: 'good' | 'bad', reason: string) {
  const key = [seedA, seedB].sort().join('|');
  rules[key] = { type, reason };
}

// --- Bad companions ---
// Fennel is allelopathic — inhibits almost everything
add('fennel-mammoth', 'tomato-alices-dream',         'bad', 'Fennel stunts tomato growth');
add('fennel-mammoth', 'pepper-jimmy-nardello',        'bad', 'Fennel inhibits pepper growth');
add('fennel-mammoth', 'cucumber-persian-pickling',    'bad', 'Fennel inhibits cucumber growth');
add('fennel-mammoth', 'cucumber-lemon',               'bad', 'Fennel inhibits cucumber growth');
add('fennel-mammoth', 'beets-golden',                 'bad', 'Fennel inhibits beet growth');
add('fennel-mammoth', 'beets-detroit-dark-red',       'bad', 'Fennel inhibits beet growth');
add('fennel-mammoth', 'celery-delne',                 'bad', 'Fennel inhibits celery growth');
add('fennel-mammoth', 'parsley-giant-of-italy',       'bad', 'Fennel and parsley compete aggressively');
add('fennel-mammoth', 'mustard-greens-japanese-giant-red', 'bad', 'Fennel inhibits brassica growth');
// Dill inhibits tomatoes when mature
add('dill-bouquet',   'tomato-alices-dream',          'bad', 'Mature dill attracts tomato hornworms');
// Onions inhibit parsley
add('onion-zebrune-shallot',    'parsley-giant-of-italy', 'bad', 'Onions inhibit parsley growth');
add('onion-ishikura-bunching',  'parsley-giant-of-italy', 'bad', 'Onions inhibit parsley growth');

// --- Good companions ---
// Nasturtiums — trap crop, repels aphids and cucumber beetles
add('nasturtium-fiesta-blend', 'cucumber-persian-pickling', 'good', 'Nasturtiums repel cucumber beetles and aphids');
add('nasturtium-fiesta-blend', 'cucumber-lemon',            'good', 'Nasturtiums repel cucumber beetles and aphids');
add('nasturtium-fiesta-blend', 'tomato-alices-dream',       'good', 'Nasturtiums act as a trap crop for aphids');
add('nasturtium-fiesta-blend', 'pepper-jimmy-nardello',     'good', 'Nasturtiums repel aphids from peppers');
// Marigolds — deter nematodes, whiteflies, aphids
add('marigold-chica-flame', 'tomato-alices-dream',          'good', 'Marigolds deter nematodes and whiteflies');
add('marigold-chica-flame', 'pepper-jimmy-nardello',        'good', 'Marigolds repel aphids and spider mites');
add('marigold-chica-flame', 'cucumber-persian-pickling',    'good', 'Marigolds deter cucumber beetles');
add('marigold-chica-flame', 'cucumber-lemon',               'good', 'Marigolds deter cucumber beetles');
// Alyssum — attracts hoverflies and parasitic wasps
add('alyssum-tiny-tim',       'tomato-alices-dream',        'good', 'Alyssum attracts hoverflies that prey on aphids');
add('alyssum-oriental-nights','tomato-alices-dream',        'good', 'Alyssum attracts hoverflies that prey on aphids');
add('alyssum-tiny-tim',       'cucumber-persian-pickling',  'good', 'Alyssum attracts beneficial predatory insects');
add('alyssum-oriental-nights','cucumber-persian-pickling',  'good', 'Alyssum attracts beneficial predatory insects');
add('alyssum-tiny-tim',       'cucumber-lemon',             'good', 'Alyssum attracts beneficial predatory insects');
add('alyssum-oriental-nights','cucumber-lemon',             'good', 'Alyssum attracts beneficial predatory insects');
// Chives — repel aphids and beetles
add('chives-common', 'tomato-alices-dream',                 'good', 'Chives repel aphids and spider mites from tomatoes');
add('chives-common', 'pepper-jimmy-nardello',               'good', 'Chives deter aphids from peppers');
add('chives-common', 'cucumber-persian-pickling',           'good', 'Chives repel aphids and cucumber beetles');
add('chives-common', 'cucumber-lemon',                      'good', 'Chives repel aphids and cucumber beetles');
// Parsley — attracts beneficial insects for tomatoes
add('parsley-giant-of-italy', 'tomato-alices-dream',        'good', 'Parsley attracts predatory insects that protect tomatoes');
// Dill — beneficial for cucumbers when young
add('dill-bouquet', 'cucumber-persian-pickling',            'good', 'Dill attracts beneficial insects for cucumbers');
add('dill-bouquet', 'cucumber-lemon',                       'good', 'Dill attracts beneficial insects for cucumbers');
// Thyme — general pest deterrent
add('thyme-common', 'tomato-alices-dream',                  'good', 'Thyme repels tomato hornworms and aphids');
add('thyme-common', 'pepper-jimmy-nardello',                'good', 'Thyme deters pepper pests');
add('thyme-common', 'cucumber-persian-pickling',            'good', 'Thyme deters cucumber beetles');
add('thyme-common', 'cucumber-lemon',                       'good', 'Thyme deters cucumber beetles');
add('thyme-common', 'mustard-greens-japanese-giant-red',    'good', 'Thyme deters cabbage worms');
// Celery — good with tomatoes
add('celery-delne', 'tomato-alices-dream',                  'good', 'Celery and tomatoes are mutually beneficial');
add('celery-delne', 'pepper-jimmy-nardello',                'good', 'Celery deters aphids around peppers');
// Onions and beets — classic SFG companion pair
add('onion-zebrune-shallot',   'beets-golden',              'good', 'Onions and beets are excellent companions');
add('onion-zebrune-shallot',   'beets-detroit-dark-red',    'good', 'Onions and beets are excellent companions');
add('onion-ishikura-bunching', 'beets-golden',              'good', 'Onions and beets are excellent companions');
add('onion-ishikura-bunching', 'beets-detroit-dark-red',    'good', 'Onions and beets are excellent companions');

export function getCompanionRule(seedIdA: string, seedIdB: string): CompanionRule | null {
  const key = [seedIdA, seedIdB].sort().join('|');
  return rules[key] ?? null;
}

// Get adjacent positions in a 4×4 bed (A1–D4)
const ROWS = ['A', 'B', 'C', 'D'];

export function getAdjacentPositions(position: string): string[] {
  const rowIdx = ROWS.indexOf(position[0]);
  const col = parseInt(position[1]);
  const neighbors: string[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = rowIdx + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 4 && nc >= 1 && nc <= 4) {
        neighbors.push(`${ROWS[nr]}${nc}`);
      }
    }
  }
  return neighbors;
}
