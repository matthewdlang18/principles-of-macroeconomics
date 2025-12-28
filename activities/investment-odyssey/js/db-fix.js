/**
 * Database Fix Script for Investment Odyssey
 * This script helps diagnose and fix issues with the game_participants and game_states tables
 */

// Initialize Supabase client
let supabase = null;

// Function to check table structure
async function checkTableStructure(tableName) {
  console.log(`Checking structure of ${tableName} table...`);

  try {
    // Try to get the first row to see the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error checking ${tableName} table:`, error);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error checking ${tableName} table: ${error.message}</p>`;
      return null;
    }

    if (data && data.length > 0) {
      console.log(`${tableName} table structure:`, data[0]);
      document.getElementById('results').innerHTML += `<p class="text-success">${tableName} table exists and has data.</p>`;
      document.getElementById('results').innerHTML += `<pre class="bg-light p-3">${JSON.stringify(data[0], null, 2)}</pre>`;
      return data[0];
    } else {
      console.log(`${tableName} table exists but has no data.`);
      document.getElementById('results').innerHTML += `<p class="text-warning">${tableName} table exists but has no data.</p>`;
      return {};
    }
  } catch (error) {
    console.error(`Exception checking ${tableName} table:`, error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception checking ${tableName} table: ${error.message}</p>`;
    return null;
  }
}

// Function to create game_participants table if it doesn't exist
async function createGameParticipantsTable() {
  console.log('Creating game_participants table...');
  document.getElementById('results').innerHTML += `<p>Attempting to create game_participants table...</p>`;

  try {
    const { error } = await supabase.rpc('create_game_participants_table');

    if (error) {
      console.error('Error creating game_participants table:', error);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error creating game_participants table: ${error.message}</p>`;

      // Try direct SQL approach
      document.getElementById('results').innerHTML += `<p>Trying direct SQL approach...</p>`;

      const sqlResult = await supabase.rpc('execute_sql', {
        sql_statement: `
          CREATE TABLE IF NOT EXISTS game_participants (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
            student_id TEXT NOT NULL,
            student_name TEXT NOT NULL,
            portfolio_value FLOAT DEFAULT 10000,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(game_id, student_id)
          );
        `
      });

      if (sqlResult.error) {
        console.error('Error with direct SQL approach:', sqlResult.error);
        document.getElementById('results').innerHTML += `<p class="text-danger">Error with direct SQL approach: ${sqlResult.error.message}</p>`;
      } else {
        console.log('Direct SQL approach successful');
        document.getElementById('results').innerHTML += `<p class="text-success">Direct SQL approach successful</p>`;
      }
    } else {
      console.log('Successfully created game_participants table');
      document.getElementById('results').innerHTML += `<p class="text-success">Successfully created game_participants table</p>`;
    }
  } catch (error) {
    console.error('Exception creating game_participants table:', error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception creating game_participants table: ${error.message}</p>`;
  }
}

// Function to fix game_states table
async function fixGameStatesTable() {
  console.log('Fixing game_states table...');
  document.getElementById('results').innerHTML += `<p>Attempting to fix game_states table...</p>`;

  try {
    // Check if user_id is TEXT or UUID
    const { data: columns, error: columnsError } = await supabase.rpc('get_column_type', {
      table_name: 'game_states',
      column_name: 'user_id'
    });

    if (columnsError) {
      console.error('Error checking game_states column type:', columnsError);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error checking game_states column type: ${columnsError.message}</p>`;
    } else if (columns && columns.length > 0) {
      const columnType = columns[0].data_type;
      console.log('game_states.user_id column type:', columnType);
      document.getElementById('results').innerHTML += `<p>game_states.user_id column type: ${columnType}</p>`;

      if (columnType.toLowerCase().includes('uuid')) {
        // Need to alter the column type
        document.getElementById('results').innerHTML += `<p>Attempting to alter user_id column from UUID to TEXT...</p>`;

        const alterResult = await supabase.rpc('execute_sql', {
          sql_statement: `
            ALTER TABLE game_states
            ALTER COLUMN user_id TYPE TEXT;
          `
        });

        if (alterResult.error) {
          console.error('Error altering user_id column:', alterResult.error);
          document.getElementById('results').innerHTML += `<p class="text-danger">Error altering user_id column: ${alterResult.error.message}</p>`;
        } else {
          console.log('Successfully altered user_id column');
          document.getElementById('results').innerHTML += `<p class="text-success">Successfully altered user_id column to TEXT</p>`;
        }
      } else {
        console.log('user_id column is already TEXT, no need to alter');
        document.getElementById('results').innerHTML += `<p class="text-success">user_id column is already TEXT, no need to alter</p>`;
      }
    }
  } catch (error) {
    console.error('Exception fixing game_states table:', error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception fixing game_states table: ${error.message}</p>`;
  }
}

// Function to check active games
async function checkActiveGames() {
  console.log('Checking active games...');
  document.getElementById('results').innerHTML += `<p>Checking active games...</p>`;

  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error checking active games:', error);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error checking active games: ${error.message}</p>`;
    } else if (data && data.length > 0) {
      console.log('Active games found:', data);
      document.getElementById('results').innerHTML += `<p class="text-success">Found ${data.length} active games:</p>`;
      document.getElementById('results').innerHTML += `<pre class="bg-light p-3">${JSON.stringify(data, null, 2)}</pre>`;

      // Check participants for each game
      for (const game of data) {
        await checkGameParticipants(game.id);
      }
    } else {
      console.log('No active games found');
      document.getElementById('results').innerHTML += `<p class="text-warning">No active games found</p>`;
    }
  } catch (error) {
    console.error('Exception checking active games:', error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception checking active games: ${error.message}</p>`;
  }
}

// Function to check game participants
async function checkGameParticipants(gameId) {
  console.log(`Checking participants for game ${gameId}...`);
  document.getElementById('results').innerHTML += `<p>Checking participants for game ${gameId}...</p>`;

  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId);

    if (error) {
      console.error(`Error checking participants for game ${gameId}:`, error);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error checking participants for game ${gameId}: ${error.message}</p>`;
    } else if (data && data.length > 0) {
      console.log(`Found ${data.length} participants for game ${gameId}:`, data);
      document.getElementById('results').innerHTML += `<p class="text-success">Found ${data.length} participants for game ${gameId}</p>`;
    } else {
      console.log(`No participants found for game ${gameId}`);
      document.getElementById('results').innerHTML += `<p class="text-warning">No participants found for game ${gameId}</p>`;
    }
  } catch (error) {
    console.error(`Exception checking participants for game ${gameId}:`, error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception checking participants for game ${gameId}: ${error.message}</p>`;
  }
}

// Function to check game states
async function checkGameStates(gameId) {
  console.log(`Checking states for game ${gameId}...`);
  document.getElementById('results').innerHTML += `<p>Checking states for game ${gameId}...</p>`;

  try {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('game_id', gameId);

    if (error) {
      console.error(`Error checking states for game ${gameId}:`, error);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error checking states for game ${gameId}: ${error.message}</p>`;
    } else if (data && data.length > 0) {
      console.log(`Found ${data.length} states for game ${gameId}:`, data);
      document.getElementById('results').innerHTML += `<p class="text-success">Found ${data.length} states for game ${gameId}</p>`;
    } else {
      console.log(`No states found for game ${gameId}`);
      document.getElementById('results').innerHTML += `<p class="text-warning">No states found for game ${gameId}</p>`;
    }
  } catch (error) {
    console.error(`Exception checking states for game ${gameId}:`, error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception checking states for game ${gameId}: ${error.message}</p>`;
  }
}

// Function to run all checks
async function runAllChecks() {
  document.getElementById('results').innerHTML = '<h3>Running Database Checks...</h3>';

  // Check table structures
  await checkTableStructure('game_sessions');
  await checkTableStructure('game_participants');
  await checkTableStructure('game_states');

  // Check active games
  await checkActiveGames();

  document.getElementById('results').innerHTML += '<h3>Checks Complete</h3>';
}

// Function to run all fixes
async function runAllFixes() {
  document.getElementById('results').innerHTML = '<h3>Running Database Fixes...</h3>';

  // Create game_participants table if it doesn't exist
  await createGameParticipantsTable();

  // Fix game_states table
  await fixGameStatesTable();

  document.getElementById('results').innerHTML += '<h3>Fixes Complete</h3>';

  // Run checks again to verify fixes
  await runAllChecks();
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DB Fix script loaded');

  // Add event listeners to buttons
  document.getElementById('check-btn').addEventListener('click', runAllChecks);
  document.getElementById('fix-btn').addEventListener('click', runAllFixes);
});
