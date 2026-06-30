import { calculateStats, calculateWeekdayStats, Location, WorkEntry } from "../lib/calculateStats";

describe("calculateStats - Monthly Range with Weekend Office Days", () => {
    const mockEntries: WorkEntry[] = [
        // Week 1
        { date: new Date("2025-05-01"), location: Location.OFFICE },
        { date: new Date("2025-05-02"), location: Location.HOME },

        // Week 2
        { date: new Date("2025-05-05"), location: Location.TIME_OFF },
        { date: new Date("2025-05-06"), location: Location.OFFICE },
        { date: new Date("2025-05-07"), location: Location.HOME },
        { date: new Date("2025-05-08"), location: Location.OFFICE },
        { date: new Date("2025-05-09"), location: Location.OFFICE },
        { date: new Date("2025-05-10"), location: Location.OFFICE }, // Saturday

        // Week 3
        { date: new Date("2025-05-12"), location: Location.HOME },
        { date: new Date("2025-05-13"), location: Location.OFFICE },
        { date: new Date("2025-05-14"), location: Location.HOME },
        { date: new Date("2025-05-15"), location: Location.OFFICE },
        { date: new Date("2025-05-16"), location: Location.HOME },

        // Week 4
        { date: new Date("2025-05-19"), location: Location.OFFICE },
        { date: new Date("2025-05-20"), location: Location.OFFICE },
        { date: new Date("2025-05-21"), location: Location.HOME },
        { date: new Date("2025-05-22"), location: Location.OFFICE },
        { date: new Date("2025-05-23"), location: Location.HOME },
        { date: new Date("2025-05-24"), location: Location.OFFICE }, // Saturday

        // Week 5
        { date: new Date("2025-05-26"), location: Location.TIME_OFF },
        { date: new Date("2025-05-27"), location: Location.TIME_OFF },
        { date: new Date("2025-05-28"), location: Location.HOME },
        { date: new Date("2025-05-29"), location: Location.OFFICE },
        { date: new Date("2025-05-30"), location: Location.OFFICE },

    ];

    const dateRange = {
        start: new Date("2025-05-01"),
        end: new Date("2025-05-31"),
    };

    it("should correctly calculate stats for April with weekend office days", () => {
        const stats = calculateStats(mockEntries, dateRange);

        expect(stats.officeCount).toBe(13); // 11 weekdays + 2 Saturdays
        expect(stats.homeCount).toBe(8);
        expect(stats.timeOffCount).toBe(3);
        expect(stats.totalWorkDaysExcludingTimeOff).toBe(21); // 13 office + 8 home (weekdays + weekend work days, excludes 3 time_off)
        expect(stats.officePercentage).toBeCloseTo((13 / 21) * 100, 1);
        expect(stats.homePercentage).toBeCloseTo((8 / 21) * 100, 1);
        expect(stats.weekEndEntriesCount).toBe(2); // two Saturdays
    });
});

describe("calculateWeekdayStats", () => {
    const dateRange = {
        start: new Date("2025-05-01"),
        end: new Date("2025-05-31"),
    };

    it("basic case: counts office days per weekday correctly", () => {
        // 2025-05-01 = Thu, 2025-05-05 = Mon, 2025-05-06 = Tue, 2025-05-07 = Wed
        const entries: WorkEntry[] = [
            { date: new Date("2025-05-01"), location: Location.OFFICE }, // Thu
            { date: new Date("2025-05-05"), location: Location.OFFICE }, // Mon
            { date: new Date("2025-05-06"), location: Location.OFFICE }, // Tue
            { date: new Date("2025-05-06"), location: Location.OFFICE }, // Tue (second visit same day is unlikely but counted)
            { date: new Date("2025-05-07"), location: Location.OFFICE }, // Wed
        ];

        const result = calculateWeekdayStats(entries, dateRange);

        expect(result).toHaveLength(5);
        expect(result[0]).toEqual({ day: "Mon", count: 1 }); // May 5
        expect(result[1]).toEqual({ day: "Tue", count: 2 }); // May 6 (×2)
        expect(result[2]).toEqual({ day: "Wed", count: 1 }); // May 7
        expect(result[3]).toEqual({ day: "Thu", count: 1 }); // May 1
        expect(result[4]).toEqual({ day: "Fri", count: 0 });
    });

    it("empty range: returns all zeros", () => {
        const result = calculateWeekdayStats([], dateRange);

        expect(result).toEqual([
            { day: "Mon", count: 0 },
            { day: "Tue", count: 0 },
            { day: "Wed", count: 0 },
            { day: "Thu", count: 0 },
            { day: "Fri", count: 0 },
        ]);
    });

    it("only home/time_off entries: all counts are 0", () => {
        const entries: WorkEntry[] = [
            { date: new Date("2025-05-01"), location: Location.HOME },      // Thu
            { date: new Date("2025-05-02"), location: Location.TIME_OFF },   // Fri
            { date: new Date("2025-05-05"), location: Location.HOME },       // Mon
        ];

        const result = calculateWeekdayStats(entries, dateRange);

        expect(result.every((r) => r.count === 0)).toBe(true);
    });

    it("multi-week span: counts accumulate across weeks", () => {
        // Two Mondays, two Wednesdays, one Friday
        const entries: WorkEntry[] = [
            { date: new Date("2025-05-05"), location: Location.OFFICE }, // Mon week 1
            { date: new Date("2025-05-07"), location: Location.OFFICE }, // Wed week 1
            { date: new Date("2025-05-09"), location: Location.OFFICE }, // Fri week 1
            { date: new Date("2025-05-12"), location: Location.OFFICE }, // Mon week 2
            { date: new Date("2025-05-14"), location: Location.OFFICE }, // Wed week 2
        ];

        const result = calculateWeekdayStats(entries, dateRange);

        expect(result[0]).toEqual({ day: "Mon", count: 2 });
        expect(result[1]).toEqual({ day: "Tue", count: 0 });
        expect(result[2]).toEqual({ day: "Wed", count: 2 });
        expect(result[3]).toEqual({ day: "Thu", count: 0 });
        expect(result[4]).toEqual({ day: "Fri", count: 1 });
    });

    it("weekend office entries are excluded", () => {
        const entries: WorkEntry[] = [
            { date: new Date("2025-05-10"), location: Location.OFFICE }, // Saturday
            { date: new Date("2025-05-11"), location: Location.OFFICE }, // Sunday
            { date: new Date("2025-05-12"), location: Location.OFFICE }, // Monday
        ];

        const result = calculateWeekdayStats(entries, dateRange);

        expect(result[0]).toEqual({ day: "Mon", count: 1 }); // only Monday counted
        expect(result.slice(1).every((r) => r.count === 0)).toBe(true);
    });
});
