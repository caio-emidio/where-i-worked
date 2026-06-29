import { buildPaceProjectionData, calculateDefaultPlannedDaysPerWeek, OFFICE_GOAL_DAYS } from "../lib/paceProjection"
import { Location, WorkEntry } from "../lib/calculateStats"

describe("paceProjection", () => {
  it("calculates the default planning value from the current pace", () => {
    const workEntries: WorkEntry[] = [
      { date: new Date("2026-05-01"), location: Location.OFFICE },
      { date: new Date("2026-05-03"), location: Location.OFFICE },
      { date: new Date("2026-05-05"), location: Location.OFFICE },
      { date: new Date("2026-05-07"), location: Location.OFFICE },
      { date: new Date("2026-05-09"), location: Location.OFFICE },
      { date: new Date("2026-05-11"), location: Location.OFFICE },
      { date: new Date("2026-05-13"), location: Location.OFFICE },
      { date: new Date("2026-05-15"), location: Location.OFFICE },
      { date: new Date("2026-05-17"), location: Location.OFFICE },
      { date: new Date("2026-05-19"), location: Location.OFFICE },
    ]

    expect(calculateDefaultPlannedDaysPerWeek(workEntries, new Date("2026-05-01"), new Date("2026-05-20"))).toBe(3.5)
  })

  it("keeps the actual line static after today and starts the projection from today", () => {
    const workEntries: WorkEntry[] = [
      { date: new Date("2026-05-01"), location: Location.OFFICE },
      { date: new Date("2026-05-05"), location: Location.OFFICE },
      { date: new Date("2026-05-10"), location: Location.HOME },
      { date: new Date("2026-05-11"), location: Location.OFFICE },
    ]

    const projection = buildPaceProjectionData({
      workEntries,
      start: new Date("2026-05-01"),
      end: new Date("2026-05-15"),
      today: new Date("2026-05-11"),
      plannedDaysPerWeek: 3.5,
    })

    const todayPoint = projection.points.find((point) => point.date === "2026-05-11")
    const tomorrowPoint = projection.points.find((point) => point.date === "2026-05-12")
    const yesterdayPoint = projection.points.find((point) => point.date === "2026-05-10")

    expect(todayPoint).toMatchObject({
      actualOfficeDays: 3,
      projectedOfficeDays: 3,
      isToday: true,
    })
    expect(tomorrowPoint).toMatchObject({
      actualOfficeDays: null,
      projectedOfficeDays: 3.5,
    })
    expect(yesterdayPoint).toMatchObject({
      actualOfficeDays: 2,
      projectedOfficeDays: null,
    })
  })

  it("reports whether the simulated plan reaches the goal by the deadline", () => {
    const workEntries: WorkEntry[] = Array.from({ length: 12 }, (_, index) => ({
      date: new Date(2026, 4, index + 1),
      location: Location.OFFICE,
    }))

    const successfulProjection = buildPaceProjectionData({
      workEntries,
      start: new Date("2026-05-01"),
      end: new Date("2026-07-31"),
      today: new Date("2026-06-30"),
      plannedDaysPerWeek: 4,
    })

    const unsuccessfulProjection = buildPaceProjectionData({
      workEntries,
      start: new Date("2026-05-01"),
      end: new Date("2026-07-31"),
      today: new Date("2026-06-30"),
      plannedDaysPerWeek: 1,
    })

    expect(successfulProjection.goalMet).toBe(true)
    expect(successfulProjection.projectedOfficeDaysAtDeadline).toBeGreaterThanOrEqual(OFFICE_GOAL_DAYS)
    expect(unsuccessfulProjection.goalMet).toBe(false)
    expect(unsuccessfulProjection.projectedOfficeDaysAtDeadline).toBeLessThan(OFFICE_GOAL_DAYS)
  })
})
