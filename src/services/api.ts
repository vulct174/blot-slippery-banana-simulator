import { BananaIncident } from '../lib/supabase';
import { fetchRedditIncidents } from './redditApi';
import { saveIncidentsToSupabase, fetchIncidentsFromSupabase } from './supabaseService';
import { narrativeService } from './narrativeService';

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

// Generate and post narrative summary with improved error handling
export const generateNarrativeSummary = async (): Promise<void> => {
  try {
    console.log('🎭 Starting narrative generation...');
    
    const result = await narrativeService.generateAndPostNarrative();
    
    if (result.success) {
      if (result.narrative?.comment_id) {
        console.log(`🎉 Narrative generated and posted to Reddit successfully! Comment ID: ${result.narrative.comment_id}`);
      } else {
        console.log('🎉 Narrative generated and saved locally (Reddit posting was skipped due to rate limits or errors)');
      }
    } else {
      console.log(`⚠️ Narrative generation skipped: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error in generateNarrativeSummary:', error);
    // Don't throw the error - just log it to prevent breaking the interval
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

// Start the periodic Reddit fetching and narrative generation with improved timing
export const startSimulationBot = () => {
  console.log('🤖 Starting Reddit comment fetcher and narrative generator bot...');
  
  // Initial fetch
  fetchAndSaveCommentsFromReddit().catch(error => {
    console.error('❌ Initial Reddit fetch failed:', error);
  });
  
  // Set up periodic fetching every 5 minutes (reduced from 10 to get more data)
  const fetchIntervalId = setInterval(() => {
    console.log('⏰ Running scheduled Reddit fetch...');
    fetchAndSaveCommentsFromReddit().catch(error => {
      console.error('❌ Periodic Reddit fetch failed:', error);
    });
  }, 300000); // 5 minutes = 300,000 milliseconds
  
  // Set up periodic narrative generation every 15 minutes (increased to reduce rate limiting)
  const narrativeIntervalId = setInterval(() => {
    console.log('⏰ Running scheduled narrative generation...');
    generateNarrativeSummary().catch(error => {
      console.error('❌ Periodic narrative generation failed:', error);
    });
  }, 900000); // 15 minutes = 900,000 milliseconds
  
  // Generate initial narrative after 5 minutes to let more data accumulate
  setTimeout(() => {
    console.log('⏰ Running initial narrative generation...');
    generateNarrativeSummary().catch(error => {
      console.error('❌ Initial narrative generation failed:', error);
    });
  }, 300000); // 5 minutes = 300,000 milliseconds
  
  console.log('⏰ Reddit fetcher scheduled to run every 5 minutes');
  console.log('🎭 Narrative generator scheduled to run every 15 minutes');
  console.log('🚀 Initial narrative generation will run in 5 minutes');
  
  // Return cleanup function
  return () => {
    clearInterval(fetchIntervalId);
    clearInterval(narrativeIntervalId);
    console.log('🛑 Reddit fetcher and narrative generator bots stopped');
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