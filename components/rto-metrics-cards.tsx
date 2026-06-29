import { CalendarIcon, Target, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { type PaceStatus, type RtoSummary } from "@/lib/rtoMetrics"

type RtoMetricsCardsProps = RtoSummary & {
  /** Total countable days in the period (used for the "of N" footer). */
  totalCountableDays: number
  /** Rounded office days expected by today according to the pace curve. */
  expectedByToday: number
  /** Actual office days recorded up to today. */
  officeDaysToday: number
  /** Goal days required to hit the 50 % target. */
  goalDays: number
}

function paceStatusColor(status: PaceStatus): string {
  switch (status) {
    case "ahead":
      return "text-emerald-500"
    case "on-pace":
      return "text-emerald-500"
    case "behind":
      return "text-red-500"
  }
}

export function RtoMetricsCards({
  requiredRemaining,
  countableDaysLeft,
  totalCountableDays,
  paceStatus,
  paceStatusLabel,
  paceNeededPercentage,
  expectedByToday,
  officeDaysToday,
  goalDays,
}: RtoMetricsCardsProps) {
  const roundedExpected = Math.round(expectedByToday)

  return (
    <div className="space-y-3">
      {/* Top row: two equal-width cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Required remaining */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-medium">Required remaining</span>
            </div>
            <p className="text-4xl font-bold leading-none" aria-label={`${requiredRemaining} office days required`}>
              {requiredRemaining}
            </p>
            <p className="text-xs text-muted-foreground">office days to hit 50%.</p>
          </CardContent>
        </Card>

        {/* Countable days left */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-medium">Countable days left</span>
            </div>
            <p className="text-4xl font-bold leading-none" aria-label={`${countableDaysLeft} countable days remaining`}>
              {countableDaysLeft}
            </p>
            <p className="text-xs text-muted-foreground">of {totalCountableDays} in this period.</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: full-width pace card */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium">Pace</span>
          </div>

          {/* Line 1: current status */}
          <p className="text-sm leading-relaxed">
            <span className="text-muted-foreground">
              Expected by today:{" "}
            </span>
            <span className="font-semibold text-foreground">{roundedExpected} days</span>
            <span className="text-muted-foreground"> — you have </span>
            <span className="font-semibold text-foreground">{officeDaysToday}</span>
            <span className="text-muted-foreground">, </span>
            <span className={`font-semibold ${paceStatusColor(paceStatus)}`} aria-live="polite">
              {paceStatusLabel}
            </span>
          </p>

          {/* Line 2: required pace */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pace needed:{" "}
            <span className="font-semibold text-foreground">
              {requiredRemaining}/{countableDaysLeft}
            </span>
            {" "}
            <span className="font-semibold text-foreground">({paceNeededPercentage}%)</span>
            {" "}of remaining workdays in the office.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
