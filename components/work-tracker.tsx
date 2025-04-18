"use client";

import { useState, useEffect, use } from "react";
import {
  Building2,
  Home,
  CalendarIcon,
  CalendarPlus2Icon as CalendarIcon2,
} from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { enIE, se } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { getDistance } from 'geolib';

type WorkLocation = "office" | "home" | "time_off" | null;
const officeCoordinates = [{ latitude: 53.347807, longitude: -6.275438 }, { latitude: 53.349233, longitude: -6.245408 }]; // Example coordinates for your office
const geofenceRadius = 100; // Geofence radius in meters


interface WorkEntry {
  id?: string;
  date: Date;
  location: WorkLocation;
  user_id?: string;
}

export function WorkTracker() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation>(null);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState<WorkEntry[]>([]);

  const [officeDates, setOfficeDates] = useState<Date[]>([]); // Store office dates
  const [homeDates, setHomeDates] = useState<Date[]>([]); // Store home dates
  const [timeOffDates, setTimeOffDates] = useState<Date[]>([]); // Store time off dates

  const [calendarRenderKey, setCalendarRenderKey] = useState(0);


  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClientSupabaseClient();


  // Load entries from Supabase on component mount
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("work_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setWorkEntries(
            data.map((entry) => ({
              ...entry,
              date: new Date(entry.date),
            }))
          );
        }

      } catch (error) {
        console.error("Error fetching work entries:", error);
        toast({
          title: "Error loading records",
          description: "Could not load your work records.",
          variant: "destructive",
        });
      }
    };

    fetchEntries();
  }, []);

  useEffect(() => {
    if (!user) return;
    const existingEntry = workEntries.find((entry) =>
      isSameDay(entry.date, selectedDate)
    );
    if (existingEntry) {
      console.log("Entry already exists for this date:", selectedDate);
      return;
    }

    if(selectedDate.toDateString() !== new Date().toDateString()){
      console.log("Selected date is not today:", selectedDate);
      return;
    }


    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const distances = officeCoordinates.map((officeCoords) =>
            getDistance({ latitude, longitude }, officeCoords)
          );
          const minDistance = Math.min(...distances);
          console.log("Current min distance from office:", minDistance, "meters");

          // Check if it's been more than 10 seconds and if the location has actually changed

          if (minDistance <= geofenceRadius) {
            // Only update if the location changed (from home to office)
            console.log("User is at the office");
            toast({
              title: "You are at the office",
              description: "Consider setting your location to 'Office'.",
            });
            // setSelectedLocation("office");
          } else {
            // Only update if the location changed (from office to home)
            console.log("User is outside the office");
            toast({
              title: "You are outside the office",
              description: "Consider setting your location to 'Home'.",
            });
            // setSelectedLocation("home");
          }
        },
        (error) => {
          console.log("Geolocation error:", error);
          // toast({
          //   title: "Error",
          //   description: "Could not retrieve your location.",
          //   variant: "destructive",
          // });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 0,
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, [selectedDate]);



  // Check if there's an entry for the selected date
  useEffect(() => {
    const existingEntry = workEntries.find((entry) =>
      isSameDay(entry.date, selectedDate)
    );

    if (existingEntry) {
      setSelectedLocation(existingEntry.location);
    } else {
      setSelectedLocation(null);
    }
  }, [selectedDate, workEntries]);

  const deleteEntry = async () => {
    if (!user) return;
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const existingEntry = workEntries.find((entry) =>
        isSameDay(entry.date, selectedDate)
      );
      if (existingEntry) {
        const { error: deleteError } = await supabase
          .from("work_entries")
          .delete()
          .eq("id", existingEntry.id);
        if (deleteError) throw deleteError;
        // Refresh entries after delete
        const { data, error: fetchError } = await supabase
          .from("work_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });
        if (fetchError) throw fetchError;
        if (data) {
          setWorkEntries(
            data.map((entry) => ({
              ...entry,
              date: new Date(entry.date),
            }))
          );
        }
        setCalendarRenderKey((prev) => prev + 1);
        toast({
          title: "Record deleted",
          description: `You deleted the record for ${format(
            selectedDate,
            "MM/dd/yyyy"
          )}.`,
        });
      } else {
        toast({
          title: "No record found",
          description: `No record found for ${format(
            selectedDate,
            "MM/dd/yyyy"
          )}.`,
        });
      }
    } catch (error) {
      console.error("Error deleting work entry:", error);
      toast({
        title: "Error deleting record",
        description: "Could not delete your work record.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!user) return;

    if (!selectedLocation) {
      toast({
        title: "Select a location",
        description: "Please select office, home, or time off before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if there's an existing entry for this date
      const existingEntry = workEntries.find((entry) =>
        isSameDay(entry.date, selectedDate)
      );

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("work_entries")
          .update({
            location: selectedLocation,
          })
          .eq("id", existingEntry.id);

        if (error) throw error;
      } else {
        // Create new entry

        // Extract local date parts
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();

        const fixedUTCDate = new Date(Date.UTC(year, month, day, 0, 0, 0));

        // console.log(fixedUTCDate.toISOString());

        const { error } = await supabase.from("work_entries").insert({
          date: fixedUTCDate.toISOString(),
          location: selectedLocation,
          user_id: user.id,
        });

        if (error) throw error;
      }

      // Refresh entries after save
      const { data, error } = await supabase
        .from("work_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      if (data) {
        setWorkEntries(
          data.map((entry) => ({
            ...entry,
            date: new Date(entry.date),
          }))
        );
      }

      setCalendarRenderKey((prev) => prev + 1);

      let locationText = "";
      if (selectedLocation === "office") locationText = "at the office";
      else if (selectedLocation === "home") locationText = "from home";
      else if (selectedLocation === "time_off")
        locationText = "as time off (PTO/Sick/Holiday)";

      toast({
        title: "Record saved",
        description: `You marked ${format(
          selectedDate,
          "MM/dd/yyyy"
        )} ${locationText}.`,
      });
    } catch (error) {
      console.error("Error saving work entry:", error);
      toast({
        title: "Error saving record",
        description: "Could not save your work record.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get recent entries (1st of the month till today)
  const getRecentEntries = () => {
    const recentDays = Array.from({ length: new Date().getDate() }, (_, i) =>
      subDays(new Date(), i)
    );

    // Filter out weekends (Saturday = 6, Sunday = 0)
    const workdays = recentDays.filter((day) => {
      const dayOfWeek = day.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
    });

    return workdays.map((day) => {
      const entry = workEntries.find((e) => isSameDay(e.date, day));
      return {
        date: day,
        location: entry?.location || null,
      };
    });
  };


  useEffect(() => {
    setRecentEntries(getRecentEntries());
  }, [workEntries]);

  useEffect(() => {
    setOfficeDates(
      workEntries
        .filter((entry) => entry.location === "office")
        .map((entry) => entry.date)
    );
    setHomeDates(
      workEntries
        .filter((entry) => entry.location === "home")
        .map((entry) => entry.date)
    );
    setTimeOffDates(
      workEntries
        .filter((entry) => entry.location === "time_off")
        .map((entry) => entry.date)
    );

    // console.log("Updating dates");
    // console.log("Office Dates:", officeDates);
    // console.log("Home Dates:", homeDates);
    // console.log("Time Off Dates:", timeOffDates);

  }, [workEntries]);


  return (
    <div className="flex space-y-6 flex-col md:flex-row md:space-y-0 gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Record Location</CardTitle>
          <CardDescription>
            Select the date and where you worked
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: enIE })
                  ) : (
                    <span>Select a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  key={calendarRenderKey} // Re-render calendar when work entries change
                  mode="single"
                  onSelect={(date) => date && setSelectedDate(date)}
                  selected={selectedDate}
                  locale={enIE}
                  modifiers={{
                    office: officeDates,
                    home: homeDates,
                    time_off: timeOffDates,
                  }}
                  modifiersClassNames={{
                    office: "bg-purple-500 hover:bg-purple-600 text-black dark:text-white",
                    home: "bg-yellow-500 hover:bg-yellow-600 text-black dark:text-white",
                    time_off: "bg-blue-500 hover:bg-blue-600 text-black dark:text-white",
                    selected: "bg-gray-500 hover:bg-gray-600 text-black dark:text-white",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <Button
              variant="outline"
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2",
                selectedLocation === "office" &&
                "bg-primary text-primary-foreground"
              )}
              onClick={() => setSelectedLocation("office")}
            >
              <Building2 className="h-6 w-6" />
              <span>Office</span>
            </Button>

            <Button
              variant="outline"
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2",
                selectedLocation === "home" &&
                "bg-yellow-500 hover:bg-yellow-600 text-black dark:text-white"
              )}
              onClick={() => setSelectedLocation("home")}
            >
              <Home className="h-6 w-6" />
              <span>Home</span>
            </Button>

            <Button
              variant="outline"
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2",
                selectedLocation === "time_off" &&
                "bg-blue-500 hover:bg-blue-600 text-white"
              )}
              onClick={() => setSelectedLocation("time_off")}
            >
              <CalendarIcon2 className="h-6 w-6" />
              <span className="text-xs text-center">PTO/Sick/Holiday</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={saveEntry} className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Record"}
          </Button>
          <Button variant="destructive" onClick={deleteEntry} className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Delete Record"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="min-w-[60%]">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
          <CardDescription>Your last {recentEntries.length} days of work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEntries.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <span className="font-medium">
                  {format(entry.date, "EEEE, MM/dd", { locale: enIE })}
                </span>
                {entry.location ? (
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
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Not recorded
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
