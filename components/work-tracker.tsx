"use client"

import { useState, useEffect } from "react"
import { Building2, Home, CalendarIcon, CalendarPlus2Icon as CalendarIcon2 } from "lucide-react"
import { format, subDays, isSameDay } from "date-fns"
import { enUS } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

type WorkLocation = "office" | "home" | "time_off" | null

interface WorkEntry {
  id?: string
  date: Date
  location: WorkLocation
  user_id?: string
}

export function WorkTracker() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation>(null)
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClientSupabaseClient()

  // Load entries from Supabase on component mount
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return

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
          title: "Error loading records",
          description: "Could not load your work records.",
          variant: "destructive",
        })
      }
    }

    fetchEntries()
  }, [user, supabase, toast])

  // Check if there's an entry for the selected date
  useEffect(() => {
    const existingEntry = workEntries.find((entry) => isSameDay(entry.date, selectedDate))

    if (existingEntry) {
      setSelectedLocation(existingEntry.location)
    } else {
      setSelectedLocation(null)
    }
  }, [selectedDate, workEntries])

  const saveEntry = async () => {
    if (!user) return

    if (!selectedLocation) {
      toast({
        title: "Select a location",
        description: "Please select office, home, or time off before saving.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check if there's an existing entry for this date
      const existingEntry = workEntries.find((entry) => isSameDay(entry.date, selectedDate))

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("work_entries")
          .update({
            location: selectedLocation,
          })
          .eq("id", existingEntry.id)

        if (error) throw error
      } else {
        // Create new entry
        const { error } = await supabase.from("work_entries").insert({
          date: selectedDate.toISOString(),
          location: selectedLocation,
          user_id: user.id,
        })

        if (error) throw error
      }

      // Refresh entries after save
      const { data, error } = await supabase
        .from("work_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

      if (error) throw error

      if (data) {
        setWorkEntries(
          data.map((entry) => ({
            ...entry,
            date: new Date(entry.date),
          })),
        )
      }

      let locationText = ""
      if (selectedLocation === "office") locationText = "at the office"
      else if (selectedLocation === "home") locationText = "from home"
      else if (selectedLocation === "time_off") locationText = "as time off (PTO/Sick/Holiday)"

      toast({
        title: "Record saved",
        description: `You marked ${format(selectedDate, "MM/dd/yyyy")} ${locationText}.`,
      })
    } catch (error) {
      console.error("Error saving work entry:", error)
      toast({
        title: "Error saving record",
        description: "Could not save your work record.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get recent entries (last 7 days)
  const getRecentEntries = () => {
    const recentDays = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i))

    return recentDays.map((day) => {
      const entry = workEntries.find((e) => isSameDay(e.date, day))
      return {
        date: day,
        location: entry?.location || null,
      }
    })
  }

  const recentEntries = getRecentEntries()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Record Location</CardTitle>
          <CardDescription>Select the date and where you worked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: enUS }) : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  locale={enUS}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <Button
              variant="outline"
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2",
                selectedLocation === "office" && "bg-primary text-primary-foreground",
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
                selectedLocation === "home" && "bg-yellow-500 hover:bg-yellow-600 text-black dark:text-white",
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
                selectedLocation === "time_off" && "bg-blue-500 hover:bg-blue-600 text-white",
              )}
              onClick={() => setSelectedLocation("time_off")}
            >
              <CalendarIcon2 className="h-6 w-6" />
              <span className="text-xs text-center">PTO/Sick/Holiday</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveEntry} className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Record"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
          <CardDescription>Your last 7 days of work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEntries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <span className="font-medium">{format(entry.date, "EEEE, MM/dd", { locale: enUS })}</span>
                {entry.location ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1",
                      entry.location === "office"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : entry.location === "home"
                          ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
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
                  <span className="text-muted-foreground text-sm">Not recorded</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
