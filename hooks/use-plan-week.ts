import { createClientSupabaseClient } from "@/lib/supabase/client";
import { format } from "date-fns";
const supabase = createClientSupabaseClient();

export const getPlanWeek = async (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { data: existingDays, error } = await supabase
        .from("plan_selected_days")
        .select("*")
        .eq("user_id", userId)
        .eq("selected_date", formattedDate);
    
        if (error) {
        console.error("Error fetching selected days:", error.message);
        return null;
        }
    
        return existingDays;
    } catch (err) {
        console.error("Unexpected error while fetching selected days:", err);
        return null;
    }
}
