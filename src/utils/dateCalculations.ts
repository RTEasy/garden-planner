import { addWeeks, subWeeks, format, isAfter, isBefore, startOfDay } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Parse timing strings like "4 to 6 weeks before last frost" or "after last frost"
 * Returns a date range relative to the frost date
 */
export function parseTimingString(
  timing: string,
  lastFrostDate: Date,
  _firstFrostDate: Date
): DateRange | null {
  const timingLower = timing.toLowerCase().trim();

  // "not recommended" or empty
  if (!timingLower || timingLower === 'not recommended' || timingLower === 'n/a') {
    return null;
  }

  // "fall or early spring" - special case
  if (timingLower.includes('fall')) {
    // Plant in fall (around first frost) or early spring (before last frost)
    return {
      start: subWeeks(lastFrostDate, 6),
      end: subWeeks(lastFrostDate, 2),
    };
  }

  // Parse "X to Y weeks before/after last frost" patterns
  const rangeMatch = timingLower.match(/(\d+)\s*to\s*(\d+)\s*weeks?\s*(before|after)\s*last\s*frost/);
  if (rangeMatch) {
    const weeksStart = parseInt(rangeMatch[1]);
    const weeksEnd = parseInt(rangeMatch[2]);
    const direction = rangeMatch[3];

    if (direction === 'before') {
      // "4 to 6 weeks before" means start at 6 weeks before, end at 4 weeks before
      return {
        start: subWeeks(lastFrostDate, weeksEnd),
        end: subWeeks(lastFrostDate, weeksStart),
      };
    } else {
      // "1 to 2 weeks after" means start at 1 week after, end at 2 weeks after
      return {
        start: addWeeks(lastFrostDate, weeksStart),
        end: addWeeks(lastFrostDate, weeksEnd),
      };
    }
  }

  // Parse "X weeks before/after last frost"
  const singleMatch = timingLower.match(/(\d+)\s*weeks?\s*(before|after)\s*last\s*frost/);
  if (singleMatch) {
    const weeks = parseInt(singleMatch[1]);
    const direction = singleMatch[2];

    if (direction === 'before') {
      return {
        start: subWeeks(lastFrostDate, weeks + 1),
        end: subWeeks(lastFrostDate, weeks - 1),
      };
    } else {
      return {
        start: addWeeks(lastFrostDate, weeks - 1),
        end: addWeeks(lastFrostDate, weeks + 1),
      };
    }
  }

  // "after last frost" (no specific weeks)
  if (timingLower.includes('after last frost')) {
    return {
      start: lastFrostDate,
      end: addWeeks(lastFrostDate, 2),
    };
  }

  // "before last frost" (no specific weeks)
  if (timingLower.includes('before last frost')) {
    return {
      start: subWeeks(lastFrostDate, 4),
      end: subWeeks(lastFrostDate, 1),
    };
  }

  return null;
}

/**
 * Check if a date range is currently active (we're within or approaching it)
 */
export function isDateRangeActive(range: DateRange, daysAhead: number = 14): boolean {
  const today = startOfDay(new Date());
  const lookahead = addWeeks(today, Math.ceil(daysAhead / 7));

  // Active if: end date hasn't passed AND start date is within lookahead
  return !isBefore(range.end, today) && !isAfter(range.start, lookahead);
}

/**
 * Check if a date range is upcoming (hasn't started yet but within lookahead)
 */
export function isDateRangeUpcoming(range: DateRange, daysAhead: number = 30): boolean {
  const today = startOfDay(new Date());
  const lookahead = addWeeks(today, Math.ceil(daysAhead / 7));

  return isAfter(range.start, today) && !isAfter(range.start, lookahead);
}

/**
 * Check if a date range has passed
 */
export function isDateRangePast(range: DateRange): boolean {
  const today = startOfDay(new Date());
  return isBefore(range.end, today);
}

/**
 * Format a date range for display
 */
export function formatDateRange(range: DateRange): string {
  return `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d')}`;
}

/**
 * Get status of a planting window
 */
export function getPlantingStatus(range: DateRange): 'past' | 'active' | 'upcoming' | 'future' {
  const today = startOfDay(new Date());

  if (isBefore(range.end, today)) {
    return 'past';
  }

  if (!isAfter(range.start, today)) {
    return 'active';
  }

  if (!isAfter(range.start, addWeeks(today, 4))) {
    return 'upcoming';
  }

  return 'future';
}
