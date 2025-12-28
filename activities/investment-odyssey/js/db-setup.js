/**
 * Database Setup Script for Investment Odyssey
 * This script helps set up the database schema for the Investment Odyssey game
 */

// Initialize Supabase client
let supabase = null;

// Function to run SQL from file
async function runSqlFromFile() {
  console.log('Running SQL from db-setup.sql...');
  document.getElementById('results').innerHTML += `<p>Running SQL from db-setup.sql...</p>`;

  try {
    // Fetch the SQL file
    const response = await fetch('db-setup.sql');
    if (!response.ok) {
      throw new Error(`Failed to fetch SQL file: ${response.status} ${response.statusText}`);
    }

    const sqlContent = await response.text();
    console.log('SQL file content loaded, length:', sqlContent.length);
    document.getElementById('results').innerHTML += `<p>SQL file content loaded, length: ${sqlContent.length} characters</p>`;

    // Split the SQL into statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    console.log(`Found ${statements.length} SQL statements to execute`);
    document.getElementById('results').innerHTML += `<p>Found ${statements.length} SQL statements to execute</p>`;

    // Check if execute_sql function exists
    const executeSqlExists = await checkExecuteSqlFunction();

    if (!executeSqlExists) {
      document.getElementById('results').innerHTML += `
        <div class="alert alert-warning">
          <p><strong>Warning:</strong> The execute_sql function doesn't exist in your Supabase database.</p>
          <p>You need to create this function in the Supabase SQL editor before running the database setup.</p>
          <p>Copy the following SQL and run it in the Supabase SQL editor:</p>
          <pre>
CREATE OR REPLACE FUNCTION execute_sql(sql_statement text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
          </pre>
          <p>After creating the function, come back and try again.</p>
        </div>
      `;
      return;
    }

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      try {
        document.getElementById('results').innerHTML += `<p>Executing statement ${i+1}/${statements.length}...</p>`;

        // Use the execute_sql RPC function
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_statement: statement
        });

        if (error) {
          console.error(`Error executing statement ${i+1}:`, error);
          document.getElementById('results').innerHTML += `<p class="text-danger">Error executing statement ${i+1}: ${error.message}</p>`;

          // Continue with the next statement
          continue;
        }

        console.log(`Statement ${i+1} executed successfully`);
        document.getElementById('results').innerHTML += `<p class="text-success">Statement ${i+1} executed successfully</p>`;
      } catch (stmtError) {
        console.error(`Exception executing statement ${i+1}:`, stmtError);
        document.getElementById('results').innerHTML += `<p class="text-danger">Exception executing statement ${i+1}: ${stmtError.message}</p>`;

        // Continue with the next statement
        continue;
      }
    }

    document.getElementById('results').innerHTML += `<p class="text-success">Database setup completed!</p>`;
  } catch (error) {
    console.error('Error running SQL from file:', error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Error running SQL from file: ${error.message}</p>`;
  }
}

// Function to check table structure
async function checkTableStructure(tableName) {
  console.log(`Checking structure of ${tableName} table...`);
  document.getElementById('results').innerHTML += `<p>Checking structure of ${tableName} table...</p>`;

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

    // Get column information
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
      table_name: tableName
    });

    if (columnsError) {
      console.error(`Error getting columns for ${tableName}:`, columnsError);
      document.getElementById('results').innerHTML += `<p class="text-warning">Error getting columns for ${tableName}: ${columnsError.message}</p>`;

      // Just show what we know about the table
      document.getElementById('results').innerHTML += `<p>Table ${tableName} exists. Sample data: ${JSON.stringify(data)}</p>`;
      return data;
    }

    console.log(`Table ${tableName} structure:`, columns);
    document.getElementById('results').innerHTML += `<p>Table ${tableName} exists with the following columns:</p>`;

    // Display column information
    let columnsList = '<ul>';
    columns.forEach(column => {
      columnsList += `<li>${column.column_name} (${column.data_type})</li>`;
    });
    columnsList += '</ul>';

    document.getElementById('results').innerHTML += columnsList;

    return { data, columns };
  } catch (error) {
    console.error(`Exception checking ${tableName} table:`, error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception checking ${tableName} table: ${error.message}</p>`;
    return null;
  }
}

// Function to check if execute_sql function exists
async function checkExecuteSqlFunction() {
  console.log('Checking if execute_sql function exists...');
  document.getElementById('results').innerHTML += `<p>Checking if execute_sql function exists...</p>`;

  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_statement: 'SELECT 1 as test'
    });

    if (error) {
      console.error('Error checking execute_sql function:', error);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error checking execute_sql function: ${error.message}</p>`;

      // Create the function if it doesn't exist
      document.getElementById('results').innerHTML += `<p>The execute_sql function doesn't exist. Please create it in the Supabase SQL editor with the following code:</p>`;

      const createFunctionSql = `
CREATE OR REPLACE FUNCTION execute_sql(sql_statement text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
      `;

      document.getElementById('results').innerHTML += `<pre>${createFunctionSql}</pre>`;

      return false;
    }

    console.log('execute_sql function exists:', data);
    document.getElementById('results').innerHTML += `<p class="text-success">execute_sql function exists and is working properly</p>`;
    return true;
  } catch (error) {
    console.error('Exception checking execute_sql function:', error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception checking execute_sql function: ${error.message}</p>`;
    return false;
  }
}

// Function to check if get_table_columns function exists
async function checkGetTableColumnsFunction() {
  console.log('Checking if get_table_columns function exists...');
  document.getElementById('results').innerHTML += `<p>Checking if get_table_columns function exists...</p>`;

  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: 'profiles'
    });

    if (error) {
      console.error('Error checking get_table_columns function:', error);
      document.getElementById('results').innerHTML += `<p class="text-danger">Error checking get_table_columns function: ${error.message}</p>`;

      // Create the function if it doesn't exist
      document.getElementById('results').innerHTML += `<p>The get_table_columns function doesn't exist. Please create it in the Supabase SQL editor with the following code:</p>`;

      const createFunctionSql = `
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(cols))
  INTO result
  FROM (
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  ) cols;

  RETURN result;
END;
$$;
      `;

      document.getElementById('results').innerHTML += `<pre>${createFunctionSql}</pre>`;

      return false;
    }

    console.log('get_table_columns function exists:', data);
    document.getElementById('results').innerHTML += `<p class="text-success">get_table_columns function exists and is working properly</p>`;
    return true;
  } catch (error) {
    console.error('Exception checking get_table_columns function:', error);
    document.getElementById('results').innerHTML += `<p class="text-danger">Exception checking get_table_columns function: ${error.message}</p>`;
    return false;
  }
}

// Function to run all checks
async function runAllChecks() {
  document.getElementById('results').innerHTML = '<h3>Running Database Checks...</h3>';

  // Check if helper functions exist
  const executeSqlExists = await checkExecuteSqlFunction();
  const getTableColumnsExists = await checkGetTableColumnsFunction();

  if (!executeSqlExists || !getTableColumnsExists) {
    document.getElementById('results').innerHTML += `<p class="text-warning">Please create the missing helper functions before proceeding.</p>`;
    return;
  }

  // Check table structures
  await checkTableStructure('game_sessions');
  await checkTableStructure('game_states');
  await checkTableStructure('player_states');
  await checkTableStructure('game_participants');

  document.getElementById('results').innerHTML += '<h3>Checks Complete</h3>';
}

// Function to run database setup
async function runDatabaseSetup() {
  document.getElementById('results').innerHTML = '<h3>Running Database Setup...</h3>';

  // Check if helper functions exist
  const executeSqlExists = await checkExecuteSqlFunction();

  if (!executeSqlExists) {
    document.getElementById('results').innerHTML += `<p class="text-warning">Please create the execute_sql helper function before proceeding.</p>`;
    return;
  }

  // Run SQL from file
  await runSqlFromFile();

  // Run checks again to verify setup
  await runAllChecks();
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DB Setup script loaded');

  // Initialize Supabase
  if (window.supabase) {
    supabase = window.supabase;
    console.log('Supabase client initialized from window.supabase');
  } else if (window.supabaseUrl && window.supabaseKey) {
    supabase = supabase.createClient(window.supabaseUrl, window.supabaseKey);
    console.log('Supabase client initialized from window variables');
  } else {
    console.error('Supabase client not available');
    document.getElementById('results').innerHTML = '<p class="text-danger">Supabase client not available. Please make sure Supabase is properly initialized.</p>';
    return;
  }

  // Add event listeners to buttons
  document.getElementById('check-btn').addEventListener('click', runAllChecks);
  document.getElementById('setup-btn').addEventListener('click', runDatabaseSetup);
});
