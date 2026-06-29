"use client";
import { format } from "date-fns";
import { enIE } from "date-fns/locale";
import {
	CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import React from "react";
import { WorkEntry } from "@/types/work-entry";

type CalendarPickerProps = {
	selectedDate: Date;
	setSelectedDate: ( date: Date ) => void;
	rangeMode: boolean;
	setRangeMode: ( val: boolean ) => void;
	rangeEndDate: Date | null;
	setRangeEndDate: ( date: Date | null ) => void;
	workEntries: WorkEntry[];
};

export function CalendarPicker( {
	selectedDate,
	setSelectedDate,
	rangeMode,
	setRangeMode,
	rangeEndDate,
	setRangeEndDate,
	workEntries,
}: CalendarPickerProps ) {
	const officeDates = workEntries.filter( ( e ) => e.location === "office" ).map( ( e ) => e.date );
	const homeDates = workEntries.filter( ( e ) => e.location === "home" ).map( ( e ) => e.date );
	const timeOffDates = workEntries.filter( ( e ) => e.location === "time_off" ).map( ( e ) => e.date );
	const [key, setKey] = React.useState( 0 );

	return (
		<>
			{/* Start Date Popover */}
			<div className="flex gap-2 w-full">
				{/* Start Date Popover */}
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" className="flex-1 justify-start text-left font-normal">
							<CalendarIcon className="mr-2 h-4 w-4" />
							{format( selectedDate, "PP", { locale: enIE } )}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0">
						<Calendar
							key={key}
							mode="single"
							selected={selectedDate}
							onSelect={( d ) => { setSelectedDate( d ?? new Date() ); setKey( ( k ) => k + 1 ); }}
							locale={enIE}
							modifiers={{ office: officeDates, home: homeDates, time_off: timeOffDates }}
							modifiersClassNames={{
								office: "bg-purple-500/80 hover:bg-purple-600/60 text-black",
								home: "bg-yellow-500/80 hover:bg-yellow-600/60 text-black",
								time_off: "bg-blue-500/80 hover:bg-blue-600/60 text-black",
								selected: "bg-gray-500/80 hover:bg-gray-600/60 text-black",
							}}
						/>
					</PopoverContent>
				</Popover>

				{/* End Date if rangeMode */}
				{rangeMode && (
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" className="flex-1 justify-start text-left font-normal">
								<CalendarIcon className="mr-2 h-4 w-4" />
								{rangeEndDate ? format( rangeEndDate, "PP", { locale: enIE } ) : "End date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0">
							<Calendar
								key={key + "-end"}
								mode="single"
								selected={rangeEndDate || new Date()}
								onSelect={( d ) => { setRangeEndDate( d ?? new Date() ); setKey( ( k ) => k + 1 ); }}
								locale={enIE}
								modifiers={{ office: officeDates, home: homeDates, time_off: timeOffDates }}
								modifiersClassNames={{
									office: "bg-purple-500/80 hover:bg-purple-600/60 text-black",
									home: "bg-yellow-500/80 hover:bg-yellow-600/60 text-black",
									time_off: "bg-blue-500/80 hover:bg-blue-600/60 text-black",
									selected: "bg-gray-500/80 hover:bg-gray-600/60 text-black",
								}}
							/>
						</PopoverContent>
					</Popover>
				)}
			</div>
		</>
	);
}
