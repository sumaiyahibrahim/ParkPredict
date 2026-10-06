/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SATELLITE_TILE_URL?: string;
  readonly VITE_SATELLITE_ATTRIBUTION?: string;
  readonly VITE_IOT_WS_URL?: string;
  readonly VITE_IOT_FACILITY_ID?: string;
}
