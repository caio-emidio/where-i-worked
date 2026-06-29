"use client";
import { useEffect } from "react";
import { getDistance } from "geolib";
import { useToast } from "@/hooks/use-toast";

const officeCoordinates = [
  { latitude: 53.347807, longitude: -6.275438 },
  { latitude: 53.349233, longitude: -6.245408 },
];
const geofenceRadius = 100;

export function useGeofenceNotification(selectedDate:Date) {
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate.toDateString() !== new Date().toDateString()) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const minDist = Math.min(
          ...officeCoordinates.map((office) => getDistance({ latitude, longitude }, office))
        );

        toast({
          title: `Location: You are ${minDist <= geofenceRadius ? "at the office" : "outside the office"}`,
          description: minDist <= geofenceRadius
            ? "Consider setting your location to 'Office'."
            : "Consider setting your location to 'Home'.",
          variant: "info",
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [selectedDate, toast]);
}
