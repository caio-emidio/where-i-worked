"use client";
import React, { use, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkEntries } from "../../hooks/useWorkEntries";
import { useGeofenceNotification } from "../../hooks/useGeofenceNotification";
import { useWeather } from "../../hooks/useWeather";
import { getRecentEntries, checkStartIsAfterEnd } from "../../utils/dateUtils";
import { CalendarPicker } from "./CalendarPicker";
import { LocationButtons } from "./LocationButtons";
import { ActionButtons } from "./ActionButtons";
import { RecentRecords } from "./recentRecords";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkLocation, WorkEntry } from "@/types/work-entry";
import { format, addDays, startOfDay, isWeekend } from "date-fns";
import { enIE } from "date-fns/locale";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { WeatherCondition } from "@/hooks/useWeather";

function WeatherBadge( { condition }: { condition: WeatherCondition } ) {
	switch ( condition ) {
		case "sunny": return <Sun className="h-3.5 w-3.5 text-yellow-400 inline" />;
		case "rainy": return <CloudRain className="h-3.5 w-3.5 text-blue-400 inline" />;
		case "snowy": return <CloudSnow className="h-3.5 w-3.5 text-sky-300 inline" />;
		case "stormy": return <CloudLightning className="h-3.5 w-3.5 text-indigo-400 inline" />;
		default: return <Cloud className="h-3.5 w-3.5 text-gray-400 inline" />;
	}
}

export function WorkTracker() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState( new Date() );
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation>( "home" );
  const [rangeMode, setRangeMode] = useState( false );
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>( null );

  const { workEntries, saveEntry, deleteEntry, loadingAction } = useWorkEntries( user );
  useGeofenceNotification( selectedDate );
  const { forecast } = useWeather();

  const recentEntries = getRecentEntries( selectedDate, workEntries )

  const handleSave = () => {
    if ( rangeMode && rangeEndDate && !checkStartIsAfterEnd( selectedDate, rangeEndDate ) ) {
      // build date list...
      const dates = []; let curr = new Date( selectedDate );
      while ( curr <= rangeEndDate ) { if ( curr.getDay() !== 0 && curr.getDay() !== 6 ) dates.push( new Date( curr ) ); curr.setDate( curr.getDate() + 1 ); }
      saveEntry( dates, selectedLocation );
    } else if ( !rangeMode ) {
      saveEntry( [selectedDate], selectedLocation );
    }
  };

  const handleDelete = () => {
    if ( rangeMode && rangeEndDate && !checkStartIsAfterEnd( selectedDate, rangeEndDate ) ) {
      const dates = []; let curr = new Date( selectedDate );
      while ( curr <= rangeEndDate ) { dates.push( new Date( curr ) ); curr.setDate( curr.getDate() + 1 ); }
      deleteEntry( dates );
    } else if ( !rangeMode ) {
      deleteEntry( [selectedDate] );
    }
  };

  // Build next-7-days weather suggestion (weekdays only, sorted by goodness)
  const weatherSuggestion = React.useMemo( () => {
    if ( forecast.length === 0 ) return null;
    const today = startOfDay( new Date() );
    const forecastMap = new Map( forecast.map( ( d ) => [d.date, d] ) );
    const days: { date: Date; dateStr: string; condition: WeatherCondition; good: boolean }[] = [];
    for ( let i = 0; i <= 7; i++ ) {
      const d = addDays( today, i );
      if ( isWeekend( d ) ) continue;
      const dateStr = format( d, "yyyy-MM-dd" );
      const w = forecastMap.get( dateStr );
      if ( !w ) continue;
      const good = w.condition === "sunny" || w.condition === "cloudy";
      days.push( { date: d, dateStr, condition: w.condition, good } );
    }
    return days;
  }, [forecast] );

  return (
    <div className="md:container flex flex-col md:flex-row gap-6">
      <div className="md:w-1/2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Record Location</CardTitle>
            <CardDescription>
              Select the date and where you worked
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="range-mode"
                checked={rangeMode}
                onCheckedChange={( checked ) => setRangeMode( !!checked )}
                className="focus-visible:ring-green-500 focus-visible:ring-2 focus-visible:ring-offset-2"
              />
              <label htmlFor="range-mode" className="text-sm cursor-pointer">
                Select a range of dates
              </label>
            </div>
            <CalendarPicker
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              rangeMode={rangeMode} setRangeMode={setRangeMode}
              rangeEndDate={rangeEndDate} setRangeEndDate={setRangeEndDate}
              workEntries={workEntries}
              forecast={forecast}
            />
            <LocationButtons selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />

            {/* Weather-based office day suggestions */}
            {weatherSuggestion && weatherSuggestion.length > 0 && (
              <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground text-sm">🌤️ Office day suggestions (next 7 days)</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {weatherSuggestion.map( ( { date, dateStr, condition, good } ) => (
                    <span key={dateStr} className={`flex items-center gap-1 ${good ? "text-foreground" : "line-through opacity-50"}`}>
                      <WeatherBadge condition={condition} />
                      {format( date, "EEE d", { locale: enIE } )}
                    </span>
                  ) )}
                </div>
                <p className="text-[10px]">Strikethrough = rain/snow/storm forecasted.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <ActionButtons onSave={handleSave} onDelete={handleDelete} loadingAction={loadingAction} />
          </CardFooter>
        </Card>
      </div>
      <RecentRecords recentEntries={recentEntries} />
    </div>
  );
}
