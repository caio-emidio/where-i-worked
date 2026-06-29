import { addDays, isAfter, isWeekend, startOfDay } from "date-fns"

export type PaceStatus = "ahead" | "on-pace" | "behind"

/**
 * Determines the pace status by comparing actual office days to the expected value.
 * The expected value is rounded to the nearest integer before comparison so that
 * a floating-point projection (e.g. 10.8) still returns a deterministic status.
 */
export function getPaceStatus(actualDays: number, expectedDays: number): PaceStatus {
  const rounded = Math.round(expectedDays)
  if (actualDays > rounded) return "ahead"
  if (actualDays === rounded) return "on-pace"
  return "behind"
}

export function getPaceStatusLabel(status: PaceStatus): string {
  switch (status) {
    case "ahead":
      return "ahead of pace."
    case "on-pace":
      return "exactly on pace."
    case "behind":
      return "behind pace."
  }
}

/**
 * Counts the number of non-weekend days from the day after `today` up to and
 * including `periodEnd`. Returns 0 when the period has already ended.
 */
export function calculateRemainingWorkdays(periodEnd: Date, today: Date = new Date()): number {
  const normalizedToday = startOfDay(today)
  const normalizedEnd = startOfDay(periodEnd)

  let count = 0
  let current = addDays(normalizedToday, 1)
  while (!isAfter(current, normalizedEnd)) {
    if (!isWeekend(current)) count++
    current = addDays(current, 1)
  }
  return count
}

export type RtoSummary = {
  requiredRemaining: number
  countableDaysLeft: number
  paceStatus: PaceStatus
  paceStatusLabel: string
  paceNeededPercentage: number
}

/**
 * Derives the key RTO metrics displayed in the dashboard cards.
 *
 * @param officeDaysToday  - Office days recorded up to (and including) today.
 * @param goalDays         - Total office days required to hit the 50 % target.
 * @param expectedByToday  - Expected office days at today's point on the pace curve.
 * @param periodEnd        - Last day of the tracked period.
 * @param today            - Reference date (defaults to now).
 */
export function calculateRtoSummary({
  officeDaysToday,
  goalDays,
  expectedByToday,
  periodEnd,
  today = new Date(),
}: {
  officeDaysToday: number
  goalDays: number
  expectedByToday: number
  periodEnd: Date
  today?: Date
}): RtoSummary {
  const requiredRemaining = Math.max(0, goalDays - officeDaysToday)
  const countableDaysLeft = calculateRemainingWorkdays(periodEnd, today)
  const paceStatus = getPaceStatus(officeDaysToday, expectedByToday)
  const paceNeededPercentage =
    countableDaysLeft > 0 ? Math.round((requiredRemaining / countableDaysLeft) * 100) : 0

  return {
    requiredRemaining,
    countableDaysLeft,
    paceStatus,
    paceStatusLabel: getPaceStatusLabel(paceStatus),
    paceNeededPercentage,
  }
}
