/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_TILE_URL?: string;
  readonly VITE_OVERPASS_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_IOT_WS_URL?: string;
  readonly VITE_IOT_API_URL?: string;
  readonly VITE_IOT_FACILITY_ID?: string;
}
