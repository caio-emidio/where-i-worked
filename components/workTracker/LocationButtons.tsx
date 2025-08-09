"use client";
import { Building2, Home, CalendarPlus2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { WorkLocation } from "@/types/work-entry";

export const LocationButtons = ( {
	selectedLocation, setSelectedLocation
}: {
	selectedLocation: WorkLocation;
	setSelectedLocation: React.Dispatch<React.SetStateAction<WorkLocation>>;
} ) => (
	<div className="grid grid-cols-3 gap-4 mt-6">
		<Button variant="outline" className={cn( "h-24", selectedLocation === "office" && "bg-purple-600" )} onClick={() => setSelectedLocation( "office" )}>
			<Building2 className="h-6 w-6" /><span>Office</span>
		</Button>
		<Button variant="outline" className={cn( "h-24", selectedLocation === "home" && "bg-yellow-500" )} onClick={() => setSelectedLocation( "home" )}>
			<Home className="h-6 w-6" /><span>Home</span>
		</Button>
		<Button variant="outline" className={cn( "h-24", selectedLocation === "time_off" && "bg-blue-500" )} onClick={() => setSelectedLocation( "time_off" )}>
			<CalendarPlus2Icon className="h-6 w-6" /><span className="text-xs text-center">Time Off</span>
		</Button>
	</div>
);
