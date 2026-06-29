"use client";
import React, { use, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkEntries } from "../../hooks/useWorkEntries";
import { useGeofenceNotification } from "../../hooks/useGeofenceNotification";
import { getRecentEntries, checkStartIsAfterEnd } from "../../utils/dateUtils";
import { CalendarPicker } from "./CalendarPicker";
import { LocationButtons } from "./LocationButtons";
import { ActionButtons } from "./ActionButtons";
import { RecentRecords } from "./recentRecords";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkLocation, WorkEntry } from "@/types/work-entry";


export function WorkTracker() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState( new Date() );
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation>( "home" );
  const [rangeMode, setRangeMode] = useState( false );
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>( null );

  const { workEntries, saveEntry, deleteEntry, loadingAction } = useWorkEntries( user );
  useGeofenceNotification( selectedDate );

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
            />
            <LocationButtons selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
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
