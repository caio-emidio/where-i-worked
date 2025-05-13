import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarPlus2Icon as CalendarIcon2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayButtonProps {
  onClick?: () => void;
  day: string;
  date: string; // Adiciona a data como uma string
  isLoading?: boolean;
}

export const DayButton: React.FC<DayButtonProps> = ({ onClick, isLoading, day, date }) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    setIsSelected(!isSelected);
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
      <span className="text-xs ">{date}</span>
    </Button>
  );
};