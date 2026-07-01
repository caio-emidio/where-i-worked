"use client";
import { useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { enIE } from "date-fns/locale";
import { Building2, Calendar as CalendarIcon2, Home } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { usePlannedEntries } from "@/hooks/usePlannedEntries";
import { checkStartIsAfterEnd } from "@/utils/dateUtils";
import { CalendarPicker } from "@/components/workTracker/CalendarPicker";
import { LocationButtons } from "@/components/workTracker/LocationButtons";
import { ActionButtons } from "@/components/workTracker/ActionButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkLocation } from "@/types/work-entry";
import { cn } from "@/lib/utils";

export function PlanningTracker() {
	const { user } = useAuth();
	const [selectedDate, setSelectedDate] = useState( addDays( startOfDay( new Date() ), 1 ) );
	const [selectedLocation, setSelectedLocation] = useState<WorkLocation>( "office" );
	const [rangeMode, setRangeMode] = useState( false );
	const [rangeEndDate, setRangeEndDate] = useState<Date | null>( null );
	const { plannedEntries, saveEntry, deleteEntry, loadingAction } = usePlannedEntries( user );

	const buildDateRange = ( start: Date, end: Date ) => {
		const dates: Date[] = [];
		let current = new Date( start );
		while ( current <= end ) {
			dates.push( new Date( current ) );
			current.setDate( current.getDate() + 1 );
		}
		return dates;
	};

	const handleSave = () => {
		if ( rangeMode && rangeEndDate && !checkStartIsAfterEnd( selectedDate, rangeEndDate ) ) {
			saveEntry( buildDateRange( selectedDate, rangeEndDate ), selectedLocation );
		} else if ( !rangeMode ) {
			saveEntry( [selectedDate], selectedLocation );
		}
	};

	const handleDelete = () => {
		if ( rangeMode && rangeEndDate && !checkStartIsAfterEnd( selectedDate, rangeEndDate ) ) {
			deleteEntry( buildDateRange( selectedDate, rangeEndDate ) );
		} else if ( !rangeMode ) {
			deleteEntry( [selectedDate] );
		}
	};

	const minSelectableDate = addDays( startOfDay( new Date() ), 1 );
	const upcomingEntries = useMemo(
		() => plannedEntries.filter( ( entry ) => startOfDay( entry.date ) >= minSelectableDate ),
		[plannedEntries, minSelectableDate],
	);

	return (
		<div className="md:container flex flex-col md:flex-row gap-6">
			<div className="md:w-1/2 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Plan Location</CardTitle>
						<CardDescription>
							Plan where you will work on future dates (weekends included)
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="flex items-center gap-2 mb-2">
							<Checkbox
								id="planning-range-mode"
								checked={rangeMode}
								onCheckedChange={( checked ) => setRangeMode( !!checked )}
								className="focus-visible:ring-green-500 focus-visible:ring-2 focus-visible:ring-offset-2"
							/>
							<label htmlFor="planning-range-mode" className="text-sm cursor-pointer">
								Select a range of dates
							</label>
						</div>
						<CalendarPicker
							selectedDate={selectedDate}
							setSelectedDate={setSelectedDate}
							rangeMode={rangeMode}
							setRangeMode={setRangeMode}
							rangeEndDate={rangeEndDate}
							setRangeEndDate={setRangeEndDate}
							workEntries={plannedEntries}
							disabled={{ before: minSelectableDate }}
						/>
						<LocationButtons selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
						<ActionButtons onSave={handleSave} onDelete={handleDelete} loadingAction={loadingAction} />
					</CardContent>
				</Card>
			</div>
			<Card className="md:w-2/3">
				<CardHeader>
					<CardTitle>Upcoming Planned Days</CardTitle>
					<CardDescription>Your future planned work entries</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{upcomingEntries.length === 0 && (
							<p className="text-sm text-muted-foreground">No planned entries yet.</p>
						)}
						{upcomingEntries.map( ( entry, index ) => (
							<div key={`${entry.date.toISOString()}-${index}`} className="flex items-center justify-between p-3 border rounded-md">
								<span className="font-medium">
									{format( new Date( entry.date ), "EEEE, MM/dd", { locale: enIE } )}
								</span>
								<Badge
									variant="outline"
									className={cn(
										"flex items-center gap-1",
										entry.location === "office"
											? "bg-primary/10 text-primary border-primary/20"
											: entry.location === "home"
												? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
												: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
									)}
								>
									{entry.location === "office" ? (
										<>
											<Building2 className="h-3 w-3" />
											<span>Office</span>
										</>
									) : entry.location === "home" ? (
										<>
											<Home className="h-3 w-3" />
											<span>Home</span>
										</>
									) : (
										<>
											<CalendarIcon2 className="h-3 w-3" />
											<span>Time Off</span>
										</>
									)}
								</Badge>
							</div>
						) )}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
