import { addDays, differenceInCalendarDays, format, isAfter, isBefore, isWithinInterval, startOfDay } from "date-fns"

import { Location, WorkEntry } from "./calculateStats"

export const OFFICE_GOAL_DAYS = 25
export const DAYS_PER_WEEK = 7
export const MAX_PLANNED_OFFICE_DAYS_PER_WEEK = 5

export type PaceProjectionPoint = {
  date: string
  label: string
  actualOfficeDays: number | null
  expectedOfficeDays: number
  projectedOfficeDays: number | null
  isToday: boolean
}

type PaceProjectionParams = {
  workEntries: WorkEntry[]
  start: Date
  end: Date
  today?: Date
  plannedDaysPerWeek: number
  goalDays?: number
}

export function calculateDefaultPlannedDaysPerWeek(workEntries: WorkEntry[], start: Date, today = new Date()) {
  const normalizedStart = startOfDay(start)
  const normalizedToday = startOfDay(today)

  if (isBefore(normalizedToday, normalizedStart)) {
    return 0
  }

  const officeDaysSoFar = workEntries.filter(
    (entry) =>
      entry.location === Location.OFFICE &&
      isWithinInterval(startOfDay(entry.date), {
        start: normalizedStart,
        end: normalizedToday,
      }),
  ).length

  const elapsedCalendarDays = differenceInCalendarDays(normalizedToday, normalizedStart) + 1

  if (elapsedCalendarDays <= 0) {
    return 0
  }

  return Math.min(
    MAX_PLANNED_OFFICE_DAYS_PER_WEEK,
    Number(((officeDaysSoFar / elapsedCalendarDays) * DAYS_PER_WEEK).toFixed(1)),
  )
}

export function buildPaceProjectionData({
  workEntries,
  start,
  end,
  today = new Date(),
  plannedDaysPerWeek,
  goalDays = OFFICE_GOAL_DAYS,
}: PaceProjectionParams) {
  const normalizedStart = startOfDay(start)
  const normalizedEnd = startOfDay(end)
  const normalizedToday = startOfDay(today)
  const effectiveToday = isBefore(normalizedToday, normalizedStart)
    ? normalizedStart
    : isAfter(normalizedToday, normalizedEnd)
      ? normalizedEnd
      : normalizedToday

  const officeEntryDates = new Set(
    workEntries
      .filter(
        (entry) =>
          entry.location === Location.OFFICE &&
          isWithinInterval(startOfDay(entry.date), {
            start: normalizedStart,
            end: normalizedEnd,
          }),
      )
      .map((entry) => format(startOfDay(entry.date), "yyyy-MM-dd")),
  )

  const totalCalendarDays = Math.max(differenceInCalendarDays(normalizedEnd, normalizedStart), 1)
  const dailyProjectionRate = plannedDaysPerWeek / DAYS_PER_WEEK

  let cumulativeOfficeDays = 0
  let officeDaysToday = 0

  const points: PaceProjectionPoint[] = []
  let currentDate = normalizedStart

  while (!isAfter(currentDate, normalizedEnd)) {
    const dateKey = format(currentDate, "yyyy-MM-dd")

    if (officeEntryDates.has(dateKey)) {
      cumulativeOfficeDays += 1
    }

    if (!isAfter(currentDate, effectiveToday)) {
      officeDaysToday = cumulativeOfficeDays
    }

    const daysFromStart = differenceInCalendarDays(currentDate, normalizedStart)
    const daysFromToday = differenceInCalendarDays(currentDate, effectiveToday)
    const isFuture = isAfter(currentDate, effectiveToday)
    const isCurrentDay = currentDate.getTime() === effectiveToday.getTime()

    points.push({
      date: dateKey,
      label: format(currentDate, "MMM d"),
      actualOfficeDays: isFuture ? null : cumulativeOfficeDays,
      expectedOfficeDays: Number(((daysFromStart / totalCalendarDays) * goalDays).toFixed(1)),
      projectedOfficeDays:
        isBefore(currentDate, effectiveToday)
          ? null
          : Number((officeDaysToday + daysFromToday * dailyProjectionRate).toFixed(1)),
      isToday: isCurrentDay,
    })

    currentDate = addDays(currentDate, 1)
  }

  const remainingCalendarDays = differenceInCalendarDays(normalizedEnd, effectiveToday)
  const projectedOfficeDaysAtDeadline = Number((officeDaysToday + remainingCalendarDays * dailyProjectionRate).toFixed(1))

  return {
    points,
    officeDaysToday,
    projectedOfficeDaysAtDeadline,
    goalMet: projectedOfficeDaysAtDeadline >= goalDays,
  }
}
