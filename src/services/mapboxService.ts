import { supabase } from '@/integrations/supabase/client';

export interface SatelliteImageOptions {
  zoom?: number;
  size?: string;
  retina?: boolean;
  bearing?: number;
}

export class MapboxService {
  private static readonly MAPBOX_STYLES = {
    satellite: 'mapbox/satellite-v9',
    streets: 'mapbox/streets-v12',
    hybrid: 'mapbox/satellite-streets-v12'
  };

  /**
   * Capture high-resolution satellite image for an address
   */
  static async captureSatelliteImage(
    address: string,
    coordinates: { lat: number; lng: number },
    options: SatelliteImageOptions = {}
  ): Promise<string | null> {
    try {
      const {
        zoom = 20,
        size = '1024x1024',
        retina = true,
        bearing = 0
      } = options;

      // Call edge function to securely fetch satellite image
      const { data, error } = await supabase.functions.invoke('capture-satellite', {
        body: {
          address,
          coordinates,
          zoom,
          size,
          retina,
          bearing,
          style: this.MAPBOX_STYLES.satellite
        }
      });

      if (error) {
        console.error('Error capturing satellite image:', error);
        return null;
      }

      return data.imageUrl;
    } catch (error) {
      console.error('Error in satellite image capture:', error);
      return null;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address }
      });

      if (error) {
        console.error('Error geocoding address:', error);
        return null;
      }

      return data.coordinates;
    } catch (error) {
      console.error('Error in geocoding:', error);
      return null;
    }
  }

  /**
   * Capture multiple angles of the same property
   */
  static async captureMultipleAngles(
    address: string,
    coordinates: { lat: number; lng: number }
  ): Promise<string[]> {
    const bearings = [0, 90, 180, 270]; // North, East, South, West
    const images: string[] = [];

    for (const bearing of bearings) {
      const imageUrl = await this.captureSatelliteImage(address, coordinates, {
        bearing,
        zoom: 20
      });
      
      if (imageUrl) {
        images.push(imageUrl);
      }
    }

    return images;
  }

  /**
   * Get optimal zoom level based on property size
   */
  static getOptimalZoom(estimatedPropertySize: number): number {
    // Larger properties need lower zoom to fit in frame
    if (estimatedPropertySize > 5000) return 18;
    if (estimatedPropertySize > 2000) return 19;
    return 20; // Maximum detail for smaller properties
  }

  /**
   * Validate image quality for roof analysis
   */
  static async validateImageQuality(imageUrl: string): Promise<{
    isValid: boolean;
    issues: string[];
    quality: 'excellent' | 'good' | 'poor';
  }> {
    // This would typically use computer vision to analyze image quality
    // For now, return a basic validation
    
    const issues: string[] = [];
    let quality: 'excellent' | 'good' | 'poor' = 'good';

    // Basic checks (would be enhanced with actual image analysis)
    if (!imageUrl || imageUrl.length === 0) {
      issues.push('No image URL provided');
      quality = 'poor';
    }

    // TODO: Add actual image quality analysis
    // - Check for cloud coverage
    // - Analyze shadow patterns
    // - Detect tree occlusion
    // - Verify image resolution

    return {
      isValid: issues.length === 0,
      issues,
      quality
    };
  }
}