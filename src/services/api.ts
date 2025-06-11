import { BananaIncident } from '../lib/supabase';
import { fetchRedditIncidents } from './redditApi';
import { saveIncidentsToSupabase, fetchIncidentsFromSupabase } from './supabaseService';

// Fetch and save comments from Reddit to Supabase
export const fetchAndSaveCommentsFromReddit = async (): Promise<number> => {
  try {
    console.log('🔄 Starting Reddit fetch and save process...');
    
    // Fetch latest comments from Reddit
    const redditIncidents = await fetchRedditIncidents();
    
    if (redditIncidents.length === 0) {
      console.log('📭 No new incidents found on Reddit');
      return 0;
    }
    
    // Save to Supabase
    const newIncidentsCount = await saveIncidentsToSupabase(redditIncidents);
    
    console.log(`✅ Successfully processed ${redditIncidents.length} Reddit comments, ${newIncidentsCount} were new`);
    return newIncidentsCount;
  } catch (error) {
    console.error('❌ Error in fetchAndSaveCommentsFromReddit:', error);
    throw error;
  }
};

// Fetch incidents for display (from Supabase)
export const fetchIncidents = async (page: number = 1, limit: number = 20): Promise<{
  incidents: BananaIncident[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}> => {
  try {
    return await fetchIncidentsFromSupabase(page, limit);
  } catch (error) {
    console.error('❌ Error fetching incidents for display:', error);
    
    // Fallback to Reddit API if Supabase fails
    try {
      console.log('🔄 Falling back to Reddit API...');
      const redditIncidents = await fetchRedditIncidents();
      
      const start = (page - 1) * limit;
      const end = start + limit;
      
      return {
        incidents: redditIncidents.slice(start, end),
        page,
        limit,
        total: redditIncidents.length,
        hasMore: end < redditIncidents.length
      };
    } catch (fallbackError) {
      console.error('❌ Fallback to Reddit API also failed:', fallbackError);
      throw new Error('🍌 Banana slip! Couldn\'t load chaos from any source. Try again.');
    }
  }
};

// Start the periodic Reddit fetching
export const startSimulationBot = () => {
  console.log('🤖 Starting Reddit comment fetcher bot...');
  
  // Initial fetch
  fetchAndSaveCommentsFromReddit().catch(error => {
    console.error('❌ Initial Reddit fetch failed:', error);
  });
  
  // Set up periodic fetching every 10 minutes
  const intervalId = setInterval(() => {
    fetchAndSaveCommentsFromReddit().catch(error => {
      console.error('❌ Periodic Reddit fetch failed:', error);
    });
  }, 600000); // 10 minutes = 600,000 milliseconds
  
  console.log('⏰ Reddit fetcher scheduled to run every 10 minutes');
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('🛑 Reddit fetcher bot stopped');
  };
};

// Legacy function for user submissions (if needed)
export const createIncident = async (user: string, action: string): Promise<{
  success: boolean;
  incident: BananaIncident;
}> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Validation
  if (!user || user.length < 3 || user.length > 20 || !/^[a-zA-Z0-9_]+$/.test(user)) {
    throw new Error('Invalid username');
  }
  
  if (!action || action.length > 100) {
    throw new Error('Invalid action');
  }
  
  const newIncident: BananaIncident = {
    id: `user_${Date.now()}`,
    author: `u/${user}`,
    action: action,
    created_at: new Date().toISOString(),
    source: 'user'
  };
  
  try {
    await saveIncidentsToSupabase([newIncident]);
    
    return {
      success: true,
      incident: newIncident
    };
  } catch (error) {
    console.error('❌ Failed to save user incident:', error);
    throw new Error('Failed to save your banana incident. Try again!');
  }
};