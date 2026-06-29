import {
  calculateRemainingWorkdays,
  calculateRtoSummary,
  getPaceStatus,
  getPaceStatusLabel,
} from "../lib/rtoMetrics"

describe("getPaceStatus", () => {
  it("returns 'ahead' when actual days exceed the rounded expected value", () => {
    expect(getPaceStatus(12, 11)).toBe("ahead")
    expect(getPaceStatus(12, 11.4)).toBe("ahead")
  })

  it("returns 'on-pace' when actual days equal the rounded expected value", () => {
    expect(getPaceStatus(11, 11)).toBe("on-pace")
    expect(getPaceStatus(11, 11.4)).toBe("on-pace") // rounds to 11
    expect(getPaceStatus(11, 10.6)).toBe("on-pace") // rounds to 11
  })

  it("returns 'behind' when actual days are below the rounded expected value", () => {
    expect(getPaceStatus(10, 11)).toBe("behind")
    expect(getPaceStatus(10, 10.6)).toBe("behind") // rounds to 11
  })

  it("returns 'on-pace' at zero when both values are zero", () => {
    expect(getPaceStatus(0, 0)).toBe("on-pace")
  })
})

describe("getPaceStatusLabel", () => {
  it("returns the correct label for each status", () => {
    expect(getPaceStatusLabel("ahead")).toBe("ahead of pace.")
    expect(getPaceStatusLabel("on-pace")).toBe("exactly on pace.")
    expect(getPaceStatusLabel("behind")).toBe("behind pace.")
  })
})

describe("calculateRemainingWorkdays", () => {
  it("counts weekdays from the day after today to the end of period", () => {
    // Mon 2026-05-04 → Fri 2026-05-08: 5 weekdays remain after Mon 2026-05-04
    const result = calculateRemainingWorkdays(
      new Date("2026-05-08"),
      new Date("2026-05-04"),
    )
    expect(result).toBe(4) // Tue–Fri
  })

  it("returns 0 when today is at or after the period end", () => {
    expect(
      calculateRemainingWorkdays(new Date("2026-05-01"), new Date("2026-05-01")),
    ).toBe(0)
    expect(
      calculateRemainingWorkdays(new Date("2026-05-01"), new Date("2026-05-05")),
    ).toBe(0)
  })

  it("skips weekends when counting remaining days", () => {
    // Friday 2026-05-01 → Monday 2026-05-04: only Mon counts (Sat+Sun skipped)
    expect(
      calculateRemainingWorkdays(new Date("2026-05-04"), new Date("2026-05-01")),
    ).toBe(1)
  })
})

describe("calculateRtoSummary", () => {
  it("computes requiredRemaining as goalDays minus officeDaysToday", () => {
    const summary = calculateRtoSummary({
      officeDaysToday: 11,
      goalDays: 25,
      expectedByToday: 11,
      periodEnd: new Date("2026-06-30"),
      today: new Date("2026-06-01"),
    })
    expect(summary.requiredRemaining).toBe(14)
  })

  it("clamps requiredRemaining to 0 when goal is already met", () => {
    const summary = calculateRtoSummary({
      officeDaysToday: 30,
      goalDays: 25,
      expectedByToday: 20,
      periodEnd: new Date("2026-06-30"),
      today: new Date("2026-06-01"),
    })
    expect(summary.requiredRemaining).toBe(0)
  })

  it("sets pace status and label based on comparison with expectedByToday", () => {
    const onPace = calculateRtoSummary({
      officeDaysToday: 11,
      goalDays: 25,
      expectedByToday: 11,
      periodEnd: new Date("2026-07-31"),
      today: new Date("2026-06-15"),
    })
    expect(onPace.paceStatus).toBe("on-pace")
    expect(onPace.paceStatusLabel).toBe("exactly on pace.")

    const behind = calculateRtoSummary({
      officeDaysToday: 8,
      goalDays: 25,
      expectedByToday: 11,
      periodEnd: new Date("2026-07-31"),
      today: new Date("2026-06-15"),
    })
    expect(behind.paceStatus).toBe("behind")
    expect(behind.paceStatusLabel).toBe("behind pace.")

    const ahead = calculateRtoSummary({
      officeDaysToday: 15,
      goalDays: 25,
      expectedByToday: 11,
      periodEnd: new Date("2026-07-31"),
      today: new Date("2026-06-15"),
    })
    expect(ahead.paceStatus).toBe("ahead")
    expect(ahead.paceStatusLabel).toBe("ahead of pace.")
  })

  it("calculates paceNeededPercentage as requiredRemaining / countableDaysLeft", () => {
    // today = Mon 2026-06-01, periodEnd = Fri 2026-06-26 (18 remaining weekdays after today)
    const summary = calculateRtoSummary({
      officeDaysToday: 11,
      goalDays: 25,
      expectedByToday: 11,
      periodEnd: new Date("2026-06-26"),
      today: new Date("2026-06-01"),
    })
    const expected = Math.round((14 / summary.countableDaysLeft) * 100)
    expect(summary.paceNeededPercentage).toBe(expected)
  })

  it("returns 0 for paceNeededPercentage when no workdays remain", () => {
    const summary = calculateRtoSummary({
      officeDaysToday: 10,
      goalDays: 25,
      expectedByToday: 10,
      periodEnd: new Date("2026-05-01"),
      today: new Date("2026-05-01"),
    })
    expect(summary.paceNeededPercentage).toBe(0)
    expect(summary.countableDaysLeft).toBe(0)
  })
})
