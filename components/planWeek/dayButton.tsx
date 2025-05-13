import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus2Icon as CalendarIcon2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface DayButtonProps {
  onClick?: () => void;
  day: string;
  date: Date; // Adiciona a data como uma string
  isLoading?: boolean;
}

export const DayButton: React.FC<DayButtonProps> = ({ onClick, isLoading, day, date }) => {
  const [isSelected, setIsSelected] = useState(false);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const fetchSelectedDays = async () => {
      if(!date) return;
      const formattedDate = format(date, "yyyy-MM-dd");

      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: existingDays, error } = await supabase
        .from("plan_selected_days")
        .select("*")
        .eq("user_id", userId)
        .eq("selected_date", formattedDate);

      if (error) {
        console.error("Error fetching selected days:", error.message);
        return;
      }

      if (existingDays && existingDays.length > 0) {
        setIsSelected(true);
      }

    };

    fetchSelectedDays();
  }, [date, supabase]);

  const handleClick = async () => {
    setIsSelected(!isSelected);

    if (!isSelected) {
      try {
        const currentYear = new Date().getFullYear();
        const formattedInputDate = `${date}/${currentYear}`;
        const parsedDate = new Date(formattedInputDate.split('/').reverse().join('-'));

        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format");
        }

        const formattedDate = format(parsedDate, "yyyy-MM-dd");

        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { data: existingDays, error: fetchError } = await supabase
          .from("plan_selected_days")
          .select("*")
          .eq("user_id", userId)
          .eq("selected_date", formattedDate);

        if (fetchError) {
          console.error("Error checking existing days:", fetchError.message);
          return;
        }

        if (existingDays && existingDays.length > 0) {
          console.log("Day already selected by the user.");
          return;
        }

        const { data, error } = await supabase.from("plan_selected_days").insert([
          {
            user_id: userId,
            selected_date: formattedDate,
          },
        ]);

        if (error) {
          console.error("Error saving selected day:", error.message);
        } else {
          console.log("Selected day saved:", data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    } else {
      try {
        const currentYear = new Date().getFullYear();
        const formattedInputDate = `${date}/${currentYear}`;
        const parsedDate = new Date(formattedInputDate.split('/').reverse().join('-'));

        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format");
        }

        const formattedDate = format(parsedDate, "yyyy-MM-dd");

        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { error } = await supabase
          .from("plan_selected_days")
          .delete()
          .eq("user_id", userId)
          .eq("selected_date", formattedDate);

        if (error) {
          console.error("Error removing selected day:", error.message);
        } else {
          console.log("Selected day removed from the database.");
        }
      } catch (err) {
        console.error("Unexpected error while removing selected day:", err);
      }
    }

    if (onClick) onClick();
  };

  return (
    <Button
      variant="outline"
      className={cn(
        "h-24 w-24 flex flex-col items-center justify-center gap-2",
        isSelected && "bg-purple-500 text-white"
      )}
      disabled={isLoading}
      onClick={handleClick}
    >
      <CalendarIcon2 className="h-6 w-6" />
      <span className="text-xs text-center whitespace-normal break-words">{day}</span>
      <span className="text-xs text-muted-foreground">{format(date, "dd/MM")}</span>
    </Button>
  );
};