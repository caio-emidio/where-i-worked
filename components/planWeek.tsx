import { addDays, format } from "date-fns";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DayButton } from "./planWeek/dayButton";

interface DayButtonProps {
    onClick?: () => void;
    day: string;
    date: string; // Adiciona a data como uma string
    isLoading?: boolean;
}

// Calculate next 5 days starting from tomorrow
const getWeekDays = () => {
    const today = new Date();
    const tomorrow = addDays(today, 1); // Start from tomorrow
    return Array.from({ length: 5 }, (_, i) => addDays(tomorrow, i)); // Next 5 days starting from tomorrow
};

const weekDays = getWeekDays();

export const PlanWeek = () => {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Plan your week</CardTitle>
                <CardDescription>
                    Select the date that you want to be in the office
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center gap-2">
                    {weekDays.map((date) => (
                        <DayButton
                            key={date.toISOString()}
                            day={format(date, "EEEE")} // Day name (e.g., Monday)
                            date={format(date, "dd/MM")} // Date in DD/MM/YYYY format
                            onClick={() => null} // Set the selected date
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};