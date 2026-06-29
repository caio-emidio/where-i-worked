import { NextRequest, NextResponse } from "next/server";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "snowy" | "stormy";

export type WeatherDay = {
	date: string; // "YYYY-MM-DD"
	condition: WeatherCondition;
	description: string;
	temp: number;
};

function getCondition( main: string ): WeatherCondition {
	const lower = main.toLowerCase();
	if ( lower === "clear" ) return "sunny";
	if ( lower === "rain" || lower === "drizzle" ) return "rainy";
	if ( lower === "snow" ) return "snowy";
	if ( lower === "thunderstorm" ) return "stormy";
	return "cloudy";
}

export async function GET( request: NextRequest ) {
	const { searchParams } = new URL( request.url );
	const lat = searchParams.get( "lat" );
	const lon = searchParams.get( "lon" );

	if ( !lat || !lon ) {
		return NextResponse.json( { error: "lat and lon are required" }, { status: 400 } );
	}

	const apiKey = process.env.OPENWEATHER_API_KEY;
	if ( !apiKey ) {
		return NextResponse.json( { error: "Weather API not configured" }, { status: 503 } );
	}

	const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=40`;

	let res: Response;
	try {
		res = await fetch( url, { next: { revalidate: 3600 } } );
	} catch {
		return NextResponse.json( { error: "Failed to reach weather service" }, { status: 502 } );
	}

	if ( !res.ok ) {
		return NextResponse.json( { error: "Weather service returned an error" }, { status: 502 } );
	}

	const data = await res.json();

	// Group 3-hour intervals by calendar day; prefer the midday (12:00:00) entry.
	const dailyMap = new Map<string, WeatherDay>();

	for ( const item of data.list as Array<{
		dt_txt: string;
		weather: Array<{ main: string; description: string }>;
		main: { temp: number };
	}> ) {
		const [date, time] = item.dt_txt.split( " " );
		if ( !dailyMap.has( date ) || time === "12:00:00" ) {
			dailyMap.set( date, {
				date,
				condition: getCondition( item.weather[0].main ),
				description: item.weather[0].description,
				temp: Math.round( item.main.temp ),
			} );
		}
	}

	return NextResponse.json( { forecast: Array.from( dailyMap.values() ) } );
}
