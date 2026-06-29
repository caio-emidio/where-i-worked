"use client";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { enIE } from "date-fns/locale";
import {
	CalendarIcon,
	Sun,
	Cloud,
	CloudRain,
	CloudSnow,
	CloudLightning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import React from "react";
import { WorkEntry } from "@/types/work-entry";
import { DayContentProps } from "react-day-picker";
import { WeatherDay, WeatherCondition } from "@/hooks/useWeather";

type CalendarPickerProps = {
	selectedDate: Date;
	setSelectedDate: ( date: Date ) => void;
	rangeMode: boolean;
	setRangeMode: ( val: boolean ) => void;
	rangeEndDate: Date | null;
	setRangeEndDate: ( date: Date | null ) => void;
	workEntries: WorkEntry[];
	forecast?: WeatherDay[];
};

function WeatherIcon( { condition, className }: { condition: WeatherCondition; className?: string } ) {
	const cls = className ?? "h-2.5 w-2.5";
	switch ( condition ) {
		case "sunny": return <Sun className={`${cls} text-yellow-400`} />;
		case "rainy": return <CloudRain className={`${cls} text-blue-400`} />;
		case "snowy": return <CloudSnow className={`${cls} text-sky-300`} />;
		case "stormy": return <CloudLightning className={`${cls} text-indigo-400`} />;
		default: return <Cloud className={`${cls} text-gray-400`} />;
	}
}

function makeWeatherDayContent( forecastMap: Map<string, WeatherDay> ) {
	return function WeatherDayContent( { date }: DayContentProps ) {
		const today = startOfDay( new Date() );
		const until = addDays( today, 6 );
		const d = startOfDay( date );
		const dateStr = format( date, "yyyy-MM-dd" );
		const weather = ( d >= today && d <= until ) ? forecastMap.get( dateStr ) : undefined;

		return (
			<div className="flex flex-col items-center justify-center leading-none gap-0.5">
				<span className="text-sm">{date.getDate()}</span>
				{weather ? (
					<WeatherIcon condition={weather.condition} />
				) : (
					<span className="h-2.5 w-2.5" />
				)}
			</div>
		);
	};
}

const calendarWeatherClassNames = {
	cell: "h-11 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
	day: "h-11 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
};

export function CalendarPicker( {
	selectedDate,
	setSelectedDate,
	rangeMode,
	setRangeMode,
	rangeEndDate,
	setRangeEndDate,
	workEntries,
	forecast = [],
}: CalendarPickerProps ) {
	const officeDates = workEntries.filter( ( e ) => e.location === "office" ).map( ( e ) => e.date );
	const homeDates = workEntries.filter( ( e ) => e.location === "home" ).map( ( e ) => e.date );
	const timeOffDates = workEntries.filter( ( e ) => e.location === "time_off" ).map( ( e ) => e.date );
	const [key, setKey] = React.useState( 0 );

	const forecastMap = React.useMemo( () => {
		const m = new Map<string, WeatherDay>();
		for ( const day of forecast ) m.set( day.date, day );
		return m;
	}, [forecast] );

	const hasWeather = forecastMap.size > 0;
	const WeatherDayContent = React.useMemo(
		() => hasWeather ? makeWeatherDayContent( forecastMap ) : undefined,
		[forecastMap, hasWeather]
	);

	const sharedCalendarProps = {
		locale: enIE,
		modifiers: { office: officeDates, home: homeDates, time_off: timeOffDates },
		modifiersClassNames: {
			office: "bg-purple-500/80 hover:bg-purple-600/60 text-black",
			home: "bg-yellow-500/80 hover:bg-yellow-600/60 text-black",
			time_off: "bg-blue-500/80 hover:bg-blue-600/60 text-black",
			selected: "bg-gray-500/80 hover:bg-gray-600/60 text-black",
		},
		...(hasWeather && {
			classNames: calendarWeatherClassNames,
			components: { DayContent: WeatherDayContent },
		}),
	};

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
							{...sharedCalendarProps}
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
								{...sharedCalendarProps}
							/>
						</PopoverContent>
					</Popover>
				)}
			</div>
		</>
	);
}
