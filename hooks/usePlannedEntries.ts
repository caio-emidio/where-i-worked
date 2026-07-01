"use client";
import { useState, useEffect, useCallback } from "react";
import { format, isAfter, startOfDay } from "date-fns";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkEntry, WorkLocation } from "@/types/work-entry";

type AuthUser = { id: string } | null | undefined

export function usePlannedEntries( user: AuthUser ) {
	const [plannedEntries, setPlannedEntries] = useState<WorkEntry[]>( [] );
	const [loadingAction, setLoadingAction] = useState<"save" | "delete" | null>( null );
	const supabase = createClientSupabaseClient();
	const { toast } = useToast();

	const fetchEntries = useCallback( async () => {
		if ( !user ) return;
		const today = format( startOfDay( new Date() ), "yyyy-MM-dd" );

		const { data, error } = await supabase
			.from( "planned_entries" )
			.select( "*" )
			.eq( "user_id", user.id )
			.gt( "date", today )
			.order( "date", { ascending: true } );

		if ( error ) {
			toast( {
				title: "Error: Loading planned records",
				description: "Could not load your planned records.",
				variant: "destructive",
			} );
			return;
		}

		setPlannedEntries( data.map( ( entry ) => ( { ...entry, date: new Date( entry.date ) } ) ) );
	}, [supabase, toast, user] );

	useEffect( () => {
		if ( !user ) return;
		fetchEntries();
	}, [fetchEntries, user] );

	const saveEntry = async ( dates: Date[], location: WorkLocation ) => {
		if ( !user ) return;
		setLoadingAction( "save" );
		const today = startOfDay( new Date() );

		const uniqueFutureDateKeys = Array.from(
			new Set(
				dates
					.map( ( date ) => startOfDay( date ) )
					.filter( ( date ) => isAfter( date, today ) )
					.map( ( date ) => format( date, "yyyy-MM-dd" ) )
			),
		);

		if ( uniqueFutureDateKeys.length === 0 ) {
			toast( {
				title: "Invalid planning date",
				description: "Planning is only allowed for future dates.",
				variant: "warning",
			} );
			setLoadingAction( null );
			return;
		}

		const payload = uniqueFutureDateKeys.map( ( date ) => ( {
			date,
			location,
			user_id: user.id,
		} ) );

		const { error } = await supabase
			.from( "planned_entries" )
			.upsert( payload, { onConflict: "user_id,date" } );

		if ( error ) {
			toast( {
				title: "Error: Saving planned records",
				description: "Could not save your planned records.",
				variant: "destructive",
			} );
		}

		await fetchEntries();
		setLoadingAction( null );
	};

	const deleteEntry = async ( dates: Date[] ) => {
		if ( !user ) return;
		setLoadingAction( "delete" );

		const dateKeys = Array.from(
			new Set( dates.map( ( date ) => format( startOfDay( date ), "yyyy-MM-dd" ) ) ),
		);

		if ( dateKeys.length > 0 ) {
			await supabase.from( "planned_entries" ).delete().eq( "user_id", user.id ).in( "date", dateKeys );
		}

		await fetchEntries();
		setLoadingAction( null );
	};

	return { plannedEntries, saveEntry, deleteEntry, loadingAction, fetchEntries };
}
