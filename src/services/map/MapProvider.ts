import type { StyleSpecification } from 'maplibre-gl';

export interface IMapProvider {
  getStyle(isDarkMode: boolean, styleVariant?: 'voyager' | 'osm'): string | StyleSpecification;
  getAttribution(): string;
}

/**
 * Direct OpenStreetMap Raster Style Specification for MapLibre GL.
 * 100% free, no API key, zero token requirement.
 */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * CARTO Voyager & Dark Matter Style URLs (OpenStreetMap-based vector/raster GL styles).
 * Fully free and public for web clients without authentication tokens.
 */
export const CARTO_VOYAGER_STYLE_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
export const CARTO_DARK_MATTER_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export class OpenStreetMapLibreProvider implements IMapProvider {
  /**
   * Returns a MapLibre GL compatible style.
   * Falls back gracefully to standard OSM raster style if remote JSON is unavailable.
   */
  public getStyle(isDarkMode: boolean, styleVariant: 'voyager' | 'osm' = 'voyager'): string | StyleSpecification {
    if (styleVariant === 'osm') {
      return OSM_RASTER_STYLE;
    }
    return isDarkMode ? CARTO_DARK_MATTER_STYLE_URL : CARTO_VOYAGER_STYLE_URL;
  }

  public getAttribution(): string {
    return 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Rendered via MapLibre GL';
  }
}

export const mapProvider = new OpenStreetMapLibreProvider();
