"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addWeeks,
  addMonths,
  addDays,
  isWeekend,
  startOfDay,
  getISOWeek,
} from "date-fns"
import { enIE } from "date-fns/locale"
import { Building2, Home, CalendarIcon, CalendarPlus2Icon as CalendarIcon2, ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Separator } from "@/components/ui/separator"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { calculateStats, calculateWeekdayStats, Location, WorkEntry } from "@/lib/calculateStats"
import {
  buildPaceProjectionData,
  calculateDefaultPlannedDaysPerWeek,
  MAX_PLANNED_OFFICE_DAYS_PER_WEEK,
} from "@/lib/paceProjection"
import { calculateRtoSummary } from "@/lib/rtoMetrics"
import { RtoMetricsCards } from "@/components/rto-metrics-cards"

export type DateRange = {
  start: Date
  end: Date
}

type PeriodType = "week" | "month" | "quarter" | "custom"

export function WorkStats() {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [periodType, setPeriodType] = useState<PeriodType>("quarter")
  const [periodOffset, setPeriodOffset] = useState(0)
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [customStartDate, setCustomStartDate] = useState<Date | null>()
  const [customEndDate, setCustomEndDate] = useState<Date | null>()
  const [isLoading, setIsLoading] = useState(false)
  const [plannedOfficeDaysPerWeek, setPlannedOfficeDaysPerWeek] = useState(0)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()
  const { theme } = useTheme()

  // Load entries from Supabase on component mount
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return

      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from("work_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          setWorkEntries(
            data.map((entry) => ({
              ...entry,
              date: new Date(entry.date),
            })),
          )
        }
      } catch (error) {
        console.error("Error fetching work entries:", error)
        toast({
          title: "Error: Loading records",
          description: "Could not load your work records.",
          variant: "destructive",
          duration: 3000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [user, supabase, toast, customStartDate, customEndDate])

  function getCustomQuarterRange(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed: Jan = 0, Feb = 1, ...

    let start, end;

    if (month >= 1 && month <= 3) {
      // Feb - Apr
      start = new Date(year, 1, 1); // Feb 1
      end = new Date(year, 3, 30);  // Apr 30
    } else if (month >= 4 && month <= 6) {
      // May - Jul
      start = new Date(year, 4, 1); // May 1
      end = new Date(year, 6, 31);  // Jul 31
    } else if (month >= 7 && month <= 9) {
      // Aug - Oct
      start = new Date(year, 7, 1); // Aug 1
      end = new Date(year, 9, 31);  // Oct 31
    } else {
      // Nov - Jan (special: Jan is next year)
      if (month === 0) {
        start = new Date(year - 1, 10, 1); // Nov 1 last year
        end = new Date(year, 0, 31);       // Jan 31 this year
      } else {
        start = new Date(year, 10, 1);     // Nov 1 this year
        end = new Date(year + 1, 0, 31);   // Jan 31 next year
      }
    }

    return { start, end };
  }


  // Set custom range when both dates are selected
  useEffect(() => {
    if (customStartDate && customEndDate) {
      // Ensure the start date is before the end date
      if (customStartDate > customEndDate) {
        toast({
          title: "Invalid date range",
          description: "Start date must be before end date.",
          variant: "destructive",
          duration: 3000,
        })
        return;
      }
      setCustomRange({
        start: customStartDate,
        end: customEndDate,
      })
    }
  }, [customStartDate, customEndDate])

  // Get current date range based on selected period
  const getCurrentDateRange = (): DateRange => {
    const today = new Date()

    switch (periodType) {
      case "week":
        const baseWeekDate = addWeeks(today, periodOffset)
        return {
          start: startOfWeek(baseWeekDate, { locale: enIE }),
          end: endOfWeek(baseWeekDate, { locale: enIE }),
        }
      case "month":
        const baseMonthDate = addMonths(today, periodOffset)
        return {
          start: startOfMonth(baseMonthDate),
          end: endOfMonth(baseMonthDate),
        }
      case "quarter":
        const baseQuarterDate = addMonths(today, periodOffset * 3)
        const { start, end } = getCustomQuarterRange(baseQuarterDate);
        return {
          start: start,
          end: end,
        }
      case "custom":
        return (
          customRange || {
            start: today,
            end: today,
          }
        )
      default:
        return {
          start: startOfWeek(today, { locale: enIE }),
          end: endOfWeek(today, { locale: enIE }),
        }
    }
  }

  // Get a human-readable label for the current period
  const getPeriodLabel = (): string => {
    const range = getCurrentDateRange()
    switch (periodType) {
      case "week":
        return `Week ${getISOWeek(range.start)}, ${format(range.start, "yyyy")}`
      case "month":
        return format(range.start, "MMMM yyyy")
      case "quarter":
        return `${format(range.start, "MMM")} – ${format(range.end, "MMM yyyy")}`
      default:
        return ""
    }
  }

  // Validate date range, for every weekdays in the range, we must have a workentry
  // If not, we should show a warning
  useEffect(() => {
    if (!dateRange?.start || !dateRange?.end || !workEntries || workEntries.length === 0) return;

    if (periodType === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }


    const entriesInRange = workEntries.filter((entry) =>
      isWithinInterval(entry.date, {
        start: dateRange.start,
        end: addDays(dateRange.end, 1),// add 1 day to include the end date
      }),
    )

    const weekdays: Date[] = [];
    const currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        weekdays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const missingEntries = weekdays.filter(
      (date) => !entriesInRange.some((entry) => entry.date.toDateString() === date.toDateString())
    );

    if (missingEntries.length > 0) {
      toast({
        title: "Warning: Missing Work Entries",
        description: `You have ${missingEntries.length} missing work entries in the selected period ${dateRange.start.toDateString()} - ${dateRange.end.toDateString()}. Stats maybe incorrect.`,
        variant: "warning",
        duration: 3000,
      });
    }
  }, [periodType, periodOffset, workEntries]);

  // Get the current date range based on the selected period
  const dateRange = getCurrentDateRange()
  // console.log("dateRange", dateRange)

  const stats = calculateStats(workEntries, dateRange)
  const weekdayStats = calculateWeekdayStats(workEntries, dateRange)

  // Calculate goal as 50% of available working weekdays in the selected period
  // (total weekdays minus time_off weekday entries, matching how calculateStats works)
  const periodWeekdays = (() => {
    let count = 0
    const current = new Date(dateRange.start.getTime())
    while (current <= dateRange.end) {
      if (!isWeekend(current)) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  })()
  const timeOffWeekdays = workEntries.filter((entry) => {
    const d = startOfDay(entry.date)
    return (
      entry.location === Location.TIME_OFF &&
      !isWeekend(d) &&
      d >= startOfDay(dateRange.start) &&
      d <= startOfDay(dateRange.end)
    )
  }).length
  const goalDays = Math.round((periodWeekdays - timeOffWeekdays) * 0.5)

  const defaultPlannedOfficeDaysPerWeek = calculateDefaultPlannedDaysPerWeek(workEntries, dateRange.start)

  useEffect(() => {
    setPlannedOfficeDaysPerWeek(defaultPlannedOfficeDaysPerWeek)
  }, [defaultPlannedOfficeDaysPerWeek])

  const paceProjection = buildPaceProjectionData({
    workEntries,
    start: dateRange.start,
    end: dateRange.end,
    plannedDaysPerWeek: plannedOfficeDaysPerWeek,
    goalDays,
  })
  const paceProjectionMaxValue = Math.max(
    goalDays,
    Math.ceil(paceProjection.projectedOfficeDaysAtDeadline),
    paceProjection.officeDaysToday,
  ) + 2

  // Derive expected-by-today from the pace projection curve
  const expectedByToday =
    paceProjection.points.find((point) => point.isToday)?.expectedOfficeDays ?? 0

  const rtoSummary = calculateRtoSummary({
    officeDaysToday: paceProjection.officeDaysToday,
    goalDays,
    expectedByToday,
    periodEnd: dateRange.end,
  })

  const totalCountableDays = periodWeekdays - timeOffWeekdays

  // Prepare data for pie chart - excluding time_off
  const chartData = [
    { name: "Office", value: stats.officeCount, percent: stats.officePercentage, color: "hsl(var(--primary))" },
    { name: "Home", value: stats.homeCount, percent: stats.homePercentage, color: theme === "dark" ? "#eab308" : "#eab308" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>See where you worked during a specific period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Period</label>
              <Select value={periodType} onValueChange={(val) => { setPeriodType(val as PeriodType); setPeriodOffset(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodType !== "custom" && (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPeriodOffset((prev) => prev - 1)}
                  aria-label="Previous period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-center flex-1">{getPeriodLabel()}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPeriodOffset((prev) => prev + 1)}
                  disabled={periodOffset === 0}
                  aria-label="Next period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {periodType === "custom" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium block">Start date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customStartDate ? format(customStartDate, "MM/dd/yyyy") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customStartDate || new Date()}
                          onSelect={setCustomStartDate}
                          initialFocus
                          locale={enIE}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium block">End date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customEndDate ? format(customEndDate, "MM/dd/yyyy") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customEndDate || new Date()}
                          onSelect={setCustomEndDate}
                          initialFocus
                          locale={enIE}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            </div>
          ) : (
            <div>
              {!(periodType === "custom" && (!customStartDate || !customEndDate)) && (
                <div className="text-center mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {format(customStartDate ? customStartDate : dateRange.start, "MM/dd/yyyy", { locale: enIE })} -{" "}
                    {format(customEndDate ? customEndDate : dateRange.end, "MM/dd/yyyy", { locale: enIE })}
                  </h3>
                </div>
              )
              }

              <Card className="mb-6 text-left">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pace vs Goal</CardTitle>
                  <CardDescription>
                    Track your progress from {format(dateRange.start, "MMM d", { locale: enIE })} to{" "}
                    {format(dateRange.end, "MMM d", { locale: enIE })} against the {goalDays}-day (50%) office goal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={paceProjection.points} margin={{ top: 8, right: 12, left: -16, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" minTickGap={24} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} domain={[0, paceProjectionMaxValue]} />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine
                          x={paceProjection.points.find((point) => point.isToday)?.label}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          label={{ value: "Today", position: "insideTopRight", fill: "#64748b", fontSize: 12 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="actualOfficeDays"
                          name="Actual office days"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="expectedOfficeDays"
                          name="Expected pace"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="projectedOfficeDays"
                          name="What-if projection"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          strokeDasharray="3 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium">
                        Planning: How many times do you plan to go to the office per week from now on?
                      </label>
                      <span className="text-sm font-semibold">
                        {plannedOfficeDaysPerWeek.toFixed(1)}/{MAX_PLANNED_OFFICE_DAYS_PER_WEEK}
                      </span>
                    </div>
                    <Slider
                      value={[plannedOfficeDaysPerWeek]}
                      min={0}
                      max={MAX_PLANNED_OFFICE_DAYS_PER_WEEK}
                      step={0.1}
                      onValueChange={([value]) => setPlannedOfficeDaysPerWeek(value)}
                      aria-label="Planned office days per week"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>{MAX_PLANNED_OFFICE_DAYS_PER_WEEK}</span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      paceProjection.goalMet
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }
                  >
                    {paceProjection.goalMet ? "🎉 Goal will be achieved!" : "⚠️ Adjustment needed to reach goal"}
                  </Badge>
                </CardContent>
              </Card>

              {/* RTO Metrics summary cards */}
              <RtoMetricsCards
                {...rtoSummary}
                totalCountableDays={totalCountableDays}
                expectedByToday={expectedByToday}
                officeDaysToday={paceProjection.officeDaysToday}
                goalDays={goalDays}
              />

              {stats.totalWorkDaysExcludingTimeOff > 0 ? (
                <>
                  <div className="flex justify-center items-center mb-6">
                    {stats.totalWorkDaysExcludingTimeOff > 0 &&
                      !(periodType === "custom" && (!customStartDate || !customEndDate)) ? (
                      <div className="w-56 h-56 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={70}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ percent }) => `${percent}%`}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Card className="overflow-hidden">
                          {periodType === "custom" && (!customStartDate || !customEndDate) ? (
                            <p className="text-muted-foreground">Please select both start and end dates to view data.</p>
                          ) : (
                            <>
                              <p className="text-muted-foreground">No work days recorded in this period.</p>
                              <p className="text-sm mt-2">Only time off days were recorded.</p>
                            </>
                          )}
                        </Card>
                      </div>
                    )}

                  </div>
                  <Separator className="mb-4" />
                  {!(periodType === "custom" && (!customStartDate || !customEndDate)) && (
                    <div>
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="overflow-hidden" onClick={() => { }}>
                          <div className="h-2 bg-primary" />
                          <CardContent className="p-4 pt-6 text-center">
                            <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">{stats.officePercentage}%</div>
                            <div className="text-sm text-muted-foreground">Office</div>
                            <div className="text-xs text-muted-foreground mt-1">{stats.officeCount} days</div>
                            {stats.weekEndEntriesCount > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                <strong>Note: Weekend office days are also included in the total.</strong>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="overflow-hidden">
                          <div className="h-2 bg-yellow-500" />
                          <CardContent className="p-4 pt-6 text-center">
                            <Home className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                            <div className="text-2xl font-bold">{stats.homePercentage}%</div>
                            <div className="text-sm text-muted-foreground">Home</div>
                            <div className="text-xs text-muted-foreground mt-1">{stats.homeCount} days</div>
                          </CardContent>
                        </Card>

                        <Card className="overflow-hidden">
                          <div className="h-2 bg-blue-500" />
                          <CardContent className="p-4 pt-6 text-center">
                            <CalendarIcon2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                            <div className="text-2xl font-bold">{stats.timeOffCount}</div>
                            <div className="text-sm text-muted-foreground">Time Off</div>
                            <div className="text-xs text-muted-foreground mt-1">Not in stats</div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="mt-4 text-center text-sm text-muted-foreground">
                        <p>* Time off days (PTO/Sick/Holiday) are not included in work percentage calculations</p>
                      </div>

                      <Separator className="mt-6 mb-4" />

                      <Card className="text-left">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Weekday Preference</CardTitle>
                          <CardDescription>
                            How often you went to the office on each weekday in this period
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={weekdayStats} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis allowDecimals={false} />
                                <Tooltip formatter={(value: number) => [value, "Office days"]} />
                                <Bar dataKey="count" name="Office days" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No records found for this period.</p>
                  <p className="text-sm mt-2">Record where you worked in the "Track" tab.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
