import { getDay, isWithinInterval, isWeekend, startOfDay } from "date-fns";

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
    const totalWorkDaysExcludingTimeOff = workEntriesOnly.length

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

export interface WeekdayStat {
    day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri"
    count: number
}

// Calculate how many times the user went to the office on each weekday (Mon–Fri)
export function calculateWeekdayStats(workEntries: WorkEntry[], dateRange: { start: Date; end: Date }): WeekdayStat[] {
    const officeEntriesInRange = workEntries.filter((entry) => {
        const d = startOfDay(entry.date)
        return (
            entry.location === Location.OFFICE &&
            !isWeekend(d) &&
            isWithinInterval(d, {
                start: startOfDay(dateRange.start),
                end: startOfDay(dateRange.end),
            })
        )
    })

    // getDay(): 0 = Sun, 1 = Mon, … 5 = Fri, 6 = Sat
    const dayLabels: WeekdayStat["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    for (const entry of officeEntriesInRange) {
        const dow = getDay(entry.date)
        if (dow >= 1 && dow <= 5) {
            counts[dow]++
        }
    }

    return dayLabels.map((label, i) => ({ day: label, count: counts[i + 1] }))
}