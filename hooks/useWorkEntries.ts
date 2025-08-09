"use client";
import { useState, useEffect } from "react";
import { isSameDay } from "date-fns";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkEntry, WorkLocation } from "@/types/work-entry";

export function useWorkEntries( user ) {
	const [workEntries, setWorkEntries] = useState<WorkEntry[]>( [] );
	const [loadingAction, setLoadingAction] = useState<"save" | "delete" | null>( null );
	const supabase = createClientSupabaseClient();
	const { toast } = useToast();

	useEffect( () => {
		if ( !user ) return;
		fetchEntries();
	}, [user] );

	const fetchEntries = async () => {
		const { data, error } = await supabase
			.from( "work_entries" )
			.select( "*" )
			.eq( "user_id", user.id )
			.order( "date", { ascending: false } );

		if ( error ) {
			toast( {
				title: "Error: Loading records",
				description: "Could not load your work records.",
				variant: "destructive",
			} );
			return;
		}

		setWorkEntries( data.map( ( entry ) => ( { ...entry, date: new Date( entry.date ) } ) ) );
	};

	const saveEntry = async ( dates: Date[], location: WorkLocation ) => {
		if ( !user ) return;
		setLoadingAction( "save" );

		for ( const date of dates ) {
			const found = workEntries.find( ( e ) => isSameDay( e.date, date ) );
			if ( found ) {
				await supabase.from( "work_entries" ).update( { location } ).eq( "id", found.id );
			} else {
				const fixedUTC = new Date( Date.UTC( date.getFullYear(), date.getMonth(), date.getDate() ) );
				await supabase.from( "work_entries" ).insert( {
					date: fixedUTC.toISOString(),
					location,
					user_id: user.id,
				} );
			}
		}

		await fetchEntries();
		setLoadingAction( null );
	};

	const deleteEntry = async ( dates: Date[] ) => {
		if ( !user ) return;
		setLoadingAction( "delete" );

		for ( const date of dates ) {
			const found = workEntries.find( ( e ) => isSameDay( e.date, date ) );
			if ( found ) {
				await supabase.from( "work_entries" ).delete().eq( "id", found.id );
			}
		}

		await fetchEntries();
		setLoadingAction( null );
	};

	return { workEntries, saveEntry, deleteEntry, loadingAction };
}
