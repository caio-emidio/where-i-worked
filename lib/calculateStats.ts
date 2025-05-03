import { isWithinInterval, isWeekend, startOfDay } from "date-fns";

export enum Location {
    OFFICE = "office",
    HOME = "home",
    TIME_OFF = "time_off",
}

export interface WorkEntry {
    id?: string
    date: Date
    location: Location
    user_id?: string
}

// Calculate statistics - excluding time_off entries
export function calculateStats(workEntries: WorkEntry[], dateRange: { start: Date; end: Date }) {
    const entriesInRange = workEntries.filter((entry) =>
        isWithinInterval(startOfDay(entry.date), {
            start: startOfDay(dateRange.start),
            end: startOfDay(dateRange.end),
        }),
    )

    // Filter out time_off entries for statistics
    const workEntriesOnly = entriesInRange.filter((entry) => entry.location !== Location.TIME_OFF)

    const weekEndEntriesCount = workEntriesOnly.filter((entry) => isWeekend(entry.date)).length

    const officeCount = workEntriesOnly.filter((entry) => entry.location === Location.OFFICE).length
    const homeCount = workEntriesOnly.filter((entry) => entry.location === Location.HOME).length
    const totalWorkDaysExcludingTimeOff = entriesInRange.filter((entry) =>
        // Filter out weekends and time_off entries
        !isWeekend(entry.date) &&
        entry.location !== Location.TIME_OFF
    ).length

    // Count time_off days separately (not included in percentages)
    const timeOffCount = entriesInRange.filter((entry) => entry.location === Location.TIME_OFF).length

    const officePercentage = totalWorkDaysExcludingTimeOff > 0 ? Number(((officeCount / totalWorkDaysExcludingTimeOff) * 100).toFixed(1)) : 0
    const homePercentage = totalWorkDaysExcludingTimeOff > 0 ? Number(((homeCount / totalWorkDaysExcludingTimeOff) * 100).toFixed(1)) : 0

    return {
        officeCount,
        homeCount,
        timeOffCount,
        totalWorkDaysExcludingTimeOff,
        officePercentage,
        homePercentage,
        weekEndEntriesCount
    }
}