"use client";
import { useState, useEffect } from "react";
import { WeatherDay, WeatherCondition } from "@/app/api/weather/route";

export type { WeatherDay, WeatherCondition };

export function useWeather() {
	const [forecast, setForecast] = useState<WeatherDay[]>( [] );
	const [loading, setLoading] = useState( false );

	useEffect( () => {
		if ( typeof navigator === "undefined" || !navigator.geolocation ) return;

		setLoading( true );
		navigator.geolocation.getCurrentPosition(
			async ( pos ) => {
				try {
					const { latitude, longitude } = pos.coords;
					const res = await fetch( `/api/weather?lat=${latitude}&lon=${longitude}` );
					if ( res.ok ) {
						const data = await res.json();
						setForecast( data.forecast ?? [] );
					}
				} catch {
					// weather is optional — fail silently
				} finally {
					setLoading( false );
				}
			},
			() => setLoading( false ),
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	}, [] );

	return { forecast, loading };
}
