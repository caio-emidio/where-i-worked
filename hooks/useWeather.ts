"use client";
import { useState, useEffect } from "react";
import { WeatherDay, WeatherCondition } from "@/app/api/weather/route";

export type { WeatherDay, WeatherCondition };

export function useWeather() {
	const [forecast, setForecast] = useState<WeatherDay[]>( [] );
	const [loading, setLoading] = useState( false );

	const fetchForecast = async ( latitude: number, longitude: number ) => {
		try {
			const res = await fetch( `/api/weather?lat=${latitude}&lon=${longitude}` );
			if ( res.ok ) {
				const data = await res.json();
				setForecast( data.forecast ?? [] );
			}
		} catch ( err ) {
			// Weather is optional — log the error for debugging but don't surface it to the user.
			console.error( "useWeather: failed to fetch forecast", err );
		} finally {
			setLoading( false );
		}
	};

	// Dublin, Ireland — used as default when geolocation is unavailable or denied.
	const DUBLIN_LAT = 53.3498;
	const DUBLIN_LON = -6.2603;

	useEffect( () => {
		setLoading( true );

		if ( typeof navigator === "undefined" || !navigator.geolocation ) {
			fetchForecast( DUBLIN_LAT, DUBLIN_LON );
			return;
		}

		navigator.geolocation.getCurrentPosition(
			( pos ) => fetchForecast( pos.coords.latitude, pos.coords.longitude ),
			() => fetchForecast( DUBLIN_LAT, DUBLIN_LON ),
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	}, [] );

	return { forecast, loading };
}
