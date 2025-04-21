export interface WorkEntry {
  id?: string;
  date: Date;
  location: WorkLocation;
  user_id?: string;
}

export type WorkLocation = "office" | "home" | "time_off" | null;
