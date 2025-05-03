import { calculateStats, Location, WorkEntry } from "../lib/calculateStats";

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
        expect(stats.totalWorkDaysExcludingTimeOff).toBe(19); // excludes 3 time_off
        expect(stats.officePercentage).toBeCloseTo((13 / 19) * 100, 1);
        expect(stats.homePercentage).toBeCloseTo((8 / 19) * 100, 1);
        expect(stats.weekEndEntriesCount).toBe(2); // two Saturdays
    });
});

