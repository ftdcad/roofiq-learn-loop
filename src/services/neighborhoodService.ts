import { supabase } from '@/integrations/supabase/client';

export interface NeighborhoodData {
  averageRoofArea: number;
  medianRoofArea: number;
  totalSamples: number;
}

export class NeighborhoodService {
  /**
   * Get neighborhood analysis for an address
   */
  static async getNeighborhoodData(address: string, coordinates: { lat: number; lng: number }): Promise<NeighborhoodData | null> {
    try {
      // First check if we have cached neighborhood data
      const { data: cached } = await supabase
        .from('neighborhood_analysis')
        .select('*')
        .eq('address', address)
        .eq('radius_miles', 0.5)
        .maybeSingle();

      if (cached && this.isCacheValid(cached.analysis_date)) {
        return {
          averageRoofArea: cached.average_roof_area,
          medianRoofArea: cached.median_roof_area,
          totalSamples: cached.total_samples
        };
      }

      // Calculate neighborhood stats from nearby roof analyses
      const neighborhoodStats = await this.calculateNeighborhoodStats(coordinates);
      
      if (neighborhoodStats && neighborhoodStats.totalSamples >= 3) {
        // Cache the results
        await this.cacheNeighborhoodData(address, coordinates, neighborhoodStats);
        return neighborhoodStats;
      }

      return null;
    } catch (error) {
      console.error('Error getting neighborhood data:', error);
      return null;
    }
  }

  /**
   * Calculate neighborhood statistics from nearby roof analyses
   */
  private static async calculateNeighborhoodStats(coordinates: { lat: number; lng: number }): Promise<NeighborhoodData | null> {
    try {
      // Get roof analyses within 0.5 miles (simplified query - in production would use PostGIS)
      const { data: nearbyRoofs } = await supabase
        .from('roof_analyses')
        .select('ai_prediction')
        .not('ai_prediction', 'is', null);

      if (!nearbyRoofs || nearbyRoofs.length < 3) {
        return null;
      }

      // Extract roof areas and calculate stats
      const roofAreas = nearbyRoofs
        .map(roof => {
          const prediction = roof.ai_prediction as any;
          return prediction?.totalArea;
        })
        .filter((area): area is number => area && area > 500 && area < 15000) // Sanity checks
        .sort((a, b) => a - b);

      if (roofAreas.length < 3) {
        return null;
      }

      const average = roofAreas.reduce((sum, area) => sum + area, 0) / roofAreas.length;
      const median = roofAreas[Math.floor(roofAreas.length / 2)];

      return {
        averageRoofArea: Math.round(average),
        medianRoofArea: Math.round(median),
        totalSamples: roofAreas.length
      };
    } catch (error) {
      console.error('Error calculating neighborhood stats:', error);
      return null;
    }
  }

  /**
   * Cache neighborhood data for future use
   */
  private static async cacheNeighborhoodData(
    address: string, 
    coordinates: { lat: number; lng: number }, 
    data: NeighborhoodData
  ): Promise<void> {
    try {
      await supabase
        .from('neighborhood_analysis')
        .upsert({
          address,
          coordinates: coordinates,
          radius_miles: 0.5,
          average_roof_area: data.averageRoofArea,
          median_roof_area: data.medianRoofArea,
          total_samples: data.totalSamples,
          analysis_date: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error caching neighborhood data:', error);
    }
  }

  /**
   * Check if cached data is still valid (24 hours)
   */
  private static isCacheValid(analysisDate: string): boolean {
    const cacheAge = Date.now() - new Date(analysisDate).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return cacheAge < maxAge;
  }

  /**
   * Flag prediction if it's unusual for the neighborhood
   */
  static isUnusualForNeighborhood(prediction: number, neighborhoodData: NeighborhoodData): boolean {
    const deviation = Math.abs(prediction - neighborhoodData.averageRoofArea) / neighborhoodData.averageRoofArea;
    return deviation > 0.3; // 30% deviation threshold
  }
}