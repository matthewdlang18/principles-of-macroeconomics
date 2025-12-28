/**
 * Supabase Client Initialization
 * This file initializes the Supabase client with the credentials from env.js
 */

// Initialize Supabase client
(function() {
    try {
        // Configuration options
        const useMockClient = false; // Set to true to force using the mock client
        const fallbackToMock = false; // Set to false to disable fallback to mock if real connection fails
        const showConnectionError = true; // Set to true to show an error message when connection fails

        // Add a flag to window to indicate if we're using the mock client
        window.usingMockSupabase = false;

        if (useMockClient) {
            console.warn('Using mock Supabase client for development/testing');
            window.usingMockSupabase = true;
            initializeMockClient();
            return;
        }

        // Check if supabaseUrl and supabaseKey are defined
        if (typeof supabaseUrl === 'undefined' || typeof supabaseKey === 'undefined') {
            console.warn('Supabase credentials not found in env.js, using hardcoded values');

            // Try to get credentials from GitHub environment variables
            if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
                window.supabaseUrl = SUPABASE_URL;
                window.supabaseKey = SUPABASE_ANON_KEY;
                console.log('Using Supabase credentials from GitHub environment variables');
            } else {
                // Fallback to hardcoded values - using the correct URL and key from windsurf-project
                window.supabaseUrl = 'https://bvvkevmqnnlecghyraao.supabase.co';
                window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmtldm1xbm5sZWNnaHlyYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDAzNDEsImV4cCI6MjA2MDQ3NjM0MX0.UY_H91jIbbZWq6A-l7XbdyF6s3rSoBVcJfawhZ2CyVg';
                console.log('Using hardcoded Supabase credentials from windsurf-project');
            }
        } else {
            window.supabaseUrl = supabaseUrl;
            window.supabaseKey = supabaseKey;
        }

        console.log('Initializing Supabase client with URL:', window.supabaseUrl);

        // Try to initialize Supabase client
        try {
            window.supabase = supabase.createClient(window.supabaseUrl, window.supabaseKey);
            console.log('Supabase client initialized successfully');

            // Test the connection
            console.log('Testing Supabase connection to:', window.supabaseUrl);
            window.supabase.from('profiles').select('count', { count: 'exact', head: true })
                .then(response => {
                    if (response.error) {
                        console.error('Error testing Supabase connection:', response.error);

                        if (showConnectionError) {
                            showSupabaseConnectionError(response.error);
                        }

                        if (fallbackToMock) {
                            console.warn('Falling back to mock Supabase client');
                            window.usingMockSupabase = true;
                            initializeMockClient();
                        }
                    } else {
                        console.log('Supabase connection test successful');
                        window.usingMockSupabase = false;
                    }
                })
                .catch(error => {
                    console.error('Error testing Supabase connection:', error);

                    if (showConnectionError) {
                        showSupabaseConnectionError(error);
                    }

                    if (fallbackToMock) {
                        console.warn('Falling back to mock Supabase client');
                        window.usingMockSupabase = true;
                        initializeMockClient();
                    }
                });
        } catch (clientError) {
            console.error('Error creating Supabase client:', clientError);

            if (showConnectionError) {
                showSupabaseConnectionError(clientError);
            }

            if (fallbackToMock) {
                console.warn('Falling back to mock Supabase client');
                window.usingMockSupabase = true;
                initializeMockClient();
            }
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);

        if (showConnectionError) {
            showSupabaseConnectionError(error);
        }

        if (fallbackToMock) {
            console.warn('Falling back to mock Supabase client');
            window.usingMockSupabase = true;
            initializeMockClient();
        }
    }

    // Function to show a visible error message when Supabase connection fails
    function showSupabaseConnectionError(error) {
        // Create error container if it doesn't exist
        let errorContainer = document.getElementById('supabase-connection-error');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'supabase-connection-error';
            errorContainer.style.position = 'fixed';
            errorContainer.style.top = '0';
            errorContainer.style.left = '0';
            errorContainer.style.right = '0';
            errorContainer.style.backgroundColor = '#f44336';
            errorContainer.style.color = 'white';
            errorContainer.style.padding = '10px';
            errorContainer.style.textAlign = 'center';
            errorContainer.style.zIndex = '9999';
            document.body.appendChild(errorContainer);
        }

        // Set error message
        errorContainer.innerHTML = `
            <strong>Error connecting to Supabase:</strong>
            ${error.message || 'Unable to connect to the database'}
            <button id="dismiss-error" style="margin-left: 10px; padding: 2px 8px; background: white; color: #f44336; border: none; border-radius: 4px; cursor: pointer;">Dismiss</button>
        `;

        // Add event listener to dismiss button
        document.getElementById('dismiss-error').addEventListener('click', function() {
            errorContainer.style.display = 'none';
        });
    }

    // Function to initialize a mock Supabase client
    function initializeMockClient() {
        console.warn('Initializing mock Supabase client');

        // Set flag to indicate we're using the mock client
        window.usingMockSupabase = true;

        // Create a more robust mock Supabase client
        window.supabase = {
            // Mock from method for table operations
            from: function(table) {
                console.log(`Mock Supabase: Accessing table '${table}'`);

                // Get data from localStorage based on table name
                const getTableData = function() {
                    const storageKey = `supabase_mock_${table}`;
                    return JSON.parse(localStorage.getItem(storageKey) || '[]');
                };

                // Save data to localStorage
                const saveTableData = function(data) {
                    const storageKey = `supabase_mock_${table}`;
                    localStorage.setItem(storageKey, JSON.stringify(data));
                };

                // Initialize table if it doesn't exist
                if (!localStorage.getItem(`supabase_mock_${table}`)) {
                    // Create sample data for specific tables
                    if (table === 'sections') {
                        const sampleSections = [
                            { id: '1', day: 'Monday', time: '10:00-11:30', location: 'Room 101', ta_id: '1', profiles: { name: 'Akshay' } },
                            { id: '2', day: 'Tuesday', time: '13:00-14:30', location: 'Room 102', ta_id: '2', profiles: { name: 'Simran' } },
                            { id: '3', day: 'Wednesday', time: '15:00-16:30', location: 'Room 103', ta_id: '3', profiles: { name: 'Camilla' } },
                            { id: '4', day: 'Thursday', time: '10:00-11:30', location: 'Room 104', ta_id: '4', profiles: { name: 'Hui Yann' } },
                            { id: '5', day: 'Friday', time: '13:00-14:30', location: 'Room 105', ta_id: '5', profiles: { name: 'Lars' } }
                        ];
                        saveTableData(sampleSections);
                    } else if (table === 'leaderboard') {
                        const sampleLeaderboard = [
                            { id: '1', user_id: 'student1', user_name: 'John Doe', final_value: 15000, game_mode: 'single', created_at: new Date().toISOString() },
                            { id: '2', user_id: 'student2', user_name: 'Jane Smith', final_value: 18000, game_mode: 'single', created_at: new Date().toISOString() },
                            { id: '3', user_id: 'student3', user_name: 'Bob Johnson', final_value: 12000, game_mode: 'class', created_at: new Date().toISOString() }
                        ];
                        saveTableData(sampleLeaderboard);
                    } else if (table === 'profiles') {
                        // Add sample profiles including the test user 'langm'
                        const sampleProfiles = [
                            {
                                id: 'langm_123456',
                                custom_id: 'langm_123456',
                                name: 'langm',
                                passcode: '123456',
                                role: 'student',
                                created_at: new Date().toISOString(),
                                last_login: new Date().toISOString()
                            },
                            {
                                id: 'student1',
                                custom_id: 'student1',
                                name: 'John Doe',
                                passcode: 'password1',
                                role: 'student',
                                created_at: new Date().toISOString(),
                                last_login: new Date().toISOString()
                            },
                            {
                                id: 'student2',
                                custom_id: 'student2',
                                name: 'Jane Smith',
                                passcode: 'password2',
                                role: 'student',
                                created_at: new Date().toISOString(),
                                last_login: new Date().toISOString()
                            },
                            {
                                id: 'ta1',
                                custom_id: 'ta1',
                                name: 'Akshay',
                                passcode: 'aksecon2',
                                role: 'ta',
                                created_at: new Date().toISOString(),
                                last_login: new Date().toISOString()
                            },
                            {
                                id: 'ta2',
                                custom_id: 'ta2',
                                name: 'Simran',
                                passcode: 'simecon2',
                                role: 'ta',
                                created_at: new Date().toISOString(),
                                last_login: new Date().toISOString()
                            }
                        ];
                        saveTableData(sampleProfiles);
                    } else {
                        saveTableData([]);
                    }
                }

                return {
                    // Mock select method
                    select: function(columns) {
                        console.log(`Mock Supabase: Selecting columns '${columns}' from '${table}'`);
                        let selectedData = getTableData();
                        let filters = [];
                        let orderByColumn = null;
                        let orderAscending = true;
                        let limitCount = null;
                        let rangeFrom = null;
                        let rangeTo = null;

                        return {
                            // Mock eq method for filtering
                            eq: function(column, value) {
                                console.log(`Mock Supabase: Adding filter ${column} = ${value}`);
                                filters.push({ column, value, operator: 'eq' });
                                return this;
                            },

                            // Mock order method for sorting
                            order: function(column, { ascending } = { ascending: true }) {
                                console.log(`Mock Supabase: Ordering by ${column} ${ascending ? 'ASC' : 'DESC'}`);
                                orderByColumn = column;
                                orderAscending = ascending !== false;
                                return this;
                            },

                            // Mock limit method
                            limit: function(count) {
                                console.log(`Mock Supabase: Limiting to ${count} results`);
                                limitCount = count;
                                return this;
                            },

                            // Mock range method
                            range: function(from, to) {
                                console.log(`Mock Supabase: Setting range from ${from} to ${to}`);
                                rangeFrom = from;
                                rangeTo = to;
                                return this;
                            },

                            // Mock single method
                            single: function() {
                                console.log(`Mock Supabase: Getting single result`);

                                // Apply filters
                                let filteredData = selectedData;
                                filters.forEach(filter => {
                                    if (filter.operator === 'eq') {
                                        filteredData = filteredData.filter(item => item[filter.column] === filter.value);
                                    }
                                });

                                // Log the result for debugging
                                console.log(`Mock Supabase: Found ${filteredData.length} results for single query`);
                                if (filteredData.length > 0) {
                                    console.log(`Mock Supabase: First result:`, filteredData[0]);
                                }

                                return {
                                    data: filteredData.length > 0 ? filteredData[0] : null,
                                    error: null
                                };
                            },

                            // Execute the query and return results
                            then: function(callback) {
                                // Apply filters
                                let filteredData = selectedData;
                                filters.forEach(filter => {
                                    if (filter.operator === 'eq') {
                                        filteredData = filteredData.filter(item => item[filter.column] === filter.value);
                                    }
                                });

                                // Log the filters and results for debugging
                                console.log(`Mock Supabase: Applied ${filters.length} filters`);
                                console.log(`Mock Supabase: Found ${filteredData.length} results after filtering`);

                                // Apply sorting
                                if (orderByColumn) {
                                    filteredData.sort((a, b) => {
                                        if (a[orderByColumn] < b[orderByColumn]) return orderAscending ? -1 : 1;
                                        if (a[orderByColumn] > b[orderByColumn]) return orderAscending ? 1 : -1;
                                        return 0;
                                    });
                                }

                                // Apply limit
                                if (limitCount !== null) {
                                    filteredData = filteredData.slice(0, limitCount);
                                }

                                // Apply range
                                if (rangeFrom !== null && rangeTo !== null) {
                                    filteredData = filteredData.slice(rangeFrom, rangeTo + 1);
                                }

                                const result = {
                                    data: filteredData,
                                    error: null,
                                    count: selectedData.length
                                };

                                // Log the final result
                                console.log(`Mock Supabase: Final result has ${result.data.length} items`);

                                callback(result);
                                return this;
                            }
                        };
                    },

                    // Mock insert method
                    insert: function(data) {
                        console.log(`Mock Supabase: Inserting data into '${table}'`, data);
                        const tableData = getTableData();

                        // Generate an ID if not provided
                        if (!data.id) {
                            data.id = Date.now().toString();
                        }

                        // Add created_at if not provided
                        if (!data.created_at) {
                            data.created_at = new Date().toISOString();
                        }

                        tableData.push(data);
                        saveTableData(tableData);

                        return {
                            select: function() {
                                return {
                                    single: function() {
                                        return { data: data, error: null };
                                    }
                                };
                            }
                        };
                    },

                    // Mock update method
                    update: function(data) {
                        console.log(`Mock Supabase: Updating data in '${table}'`, data);
                        let tableData = getTableData();
                        let idToUpdate = null;

                        return {
                            eq: function(column, value) {
                                console.log(`Mock Supabase: Updating where ${column} = ${value}`);

                                // Find the item to update
                                const index = tableData.findIndex(item => item[column] === value);
                                if (index !== -1) {
                                    // Update the item
                                    tableData[index] = { ...tableData[index], ...data };
                                    saveTableData(tableData);
                                    return { data: tableData[index], error: null };
                                }

                                return { data: null, error: null };
                            }
                        };
                    },

                    // Mock delete method
                    delete: function() {
                        console.log(`Mock Supabase: Deleting from '${table}'`);
                        let tableData = getTableData();

                        return {
                            eq: function(column, value) {
                                console.log(`Mock Supabase: Deleting where ${column} = ${value}`);

                                // Filter out the items to delete
                                const newData = tableData.filter(item => item[column] !== value);
                                saveTableData(newData);

                                return { data: null, error: null };
                            }
                        };
                    }
                };
            },

            // Mock auth methods
            auth: {
                signUp: function() {
                    return Promise.resolve({ user: null, session: null, error: null });
                },
                signIn: function() {
                    return Promise.resolve({ user: null, session: null, error: null });
                },
                signOut: function() {
                    return Promise.resolve({ error: null });
                },
                onAuthStateChange: function(callback) {
                    callback('SIGNED_OUT', null);
                    return { data: { subscription: { unsubscribe: function() {} } } };
                }
            },

            // Utility methods for testing
            _utils: {
                // Clear all mock data
                clearAllData: function() {
                    console.log('Mock Supabase: Clearing all mock data');
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('supabase_mock_')) {
                            localStorage.removeItem(key);
                        }
                    });
                    console.log('Mock Supabase: All mock data cleared');
                },

                // Reset to initial sample data
                resetToSampleData: function() {
                    console.log('Mock Supabase: Resetting to sample data');
                    this.clearAllData();

                    // Re-initialize tables with sample data
                    ['sections', 'leaderboard', 'profiles'].forEach(table => {
                        const storageKey = `supabase_mock_${table}`;
                        if (!localStorage.getItem(storageKey)) {
                            if (table === 'sections') {
                                const sampleSections = [
                                    { id: '1', day: 'Monday', time: '10:00-11:30', location: 'Room 101', ta_id: '1', profiles: { name: 'Akshay' } },
                                    { id: '2', day: 'Tuesday', time: '13:00-14:30', location: 'Room 102', ta_id: '2', profiles: { name: 'Simran' } },
                                    { id: '3', day: 'Wednesday', time: '15:00-16:30', location: 'Room 103', ta_id: '3', profiles: { name: 'Camilla' } },
                                    { id: '4', day: 'Thursday', time: '10:00-11:30', location: 'Room 104', ta_id: '4', profiles: { name: 'Hui Yann' } },
                                    { id: '5', day: 'Friday', time: '13:00-14:30', location: 'Room 105', ta_id: '5', profiles: { name: 'Lars' } }
                                ];
                                localStorage.setItem(storageKey, JSON.stringify(sampleSections));
                            } else if (table === 'leaderboard') {
                                const sampleLeaderboard = [
                                    { id: '1', user_id: 'student1', user_name: 'John Doe', final_value: 15000, game_mode: 'single', created_at: new Date().toISOString() },
                                    { id: '2', user_id: 'student2', user_name: 'Jane Smith', final_value: 18000, game_mode: 'single', created_at: new Date().toISOString() },
                                    { id: '3', user_id: 'student3', user_name: 'Bob Johnson', final_value: 12000, game_mode: 'class', created_at: new Date().toISOString() }
                                ];
                                localStorage.setItem(storageKey, JSON.stringify(sampleLeaderboard));
                            } else if (table === 'profiles') {
                                const sampleProfiles = [
                                    {
                                        id: 'langm_123456',
                                        custom_id: 'langm_123456',
                                        name: 'langm',
                                        passcode: '123456',
                                        role: 'student',
                                        created_at: new Date().toISOString(),
                                        last_login: new Date().toISOString()
                                    },
                                    {
                                        id: 'student1',
                                        custom_id: 'student1',
                                        name: 'John Doe',
                                        passcode: 'password1',
                                        role: 'student',
                                        created_at: new Date().toISOString(),
                                        last_login: new Date().toISOString()
                                    },
                                    {
                                        id: 'student2',
                                        custom_id: 'student2',
                                        name: 'Jane Smith',
                                        passcode: 'password2',
                                        role: 'student',
                                        created_at: new Date().toISOString(),
                                        last_login: new Date().toISOString()
                                    },
                                    {
                                        id: 'ta1',
                                        custom_id: 'ta1',
                                        name: 'Akshay',
                                        passcode: 'aksecon2',
                                        role: 'ta',
                                        created_at: new Date().toISOString(),
                                        last_login: new Date().toISOString()
                                    },
                                    {
                                        id: 'ta2',
                                        custom_id: 'ta2',
                                        name: 'Simran',
                                        passcode: 'simecon2',
                                        role: 'ta',
                                        created_at: new Date().toISOString(),
                                        last_login: new Date().toISOString()
                                    }
                                ];
                                localStorage.setItem(storageKey, JSON.stringify(sampleProfiles));
                            }
                        }
                    });

                    console.log('Mock Supabase: Reset to sample data complete');
                }
            }
        };

        // Reset to sample data to ensure we have the test data
        window.supabase._utils.resetToSampleData();

        // Show a visible indicator that we're using the mock client
        showMockClientIndicator();

        console.warn('Mock Supabase client initialized');
    }

    // Function to show a visible indicator that we're using the mock client
    function showMockClientIndicator() {
        // Create indicator if it doesn't exist
        let indicator = document.getElementById('mock-client-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'mock-client-indicator';
            indicator.style.position = 'fixed';
            indicator.style.bottom = '10px';
            indicator.style.right = '10px';
            indicator.style.backgroundColor = '#ff9800';
            indicator.style.color = 'white';
            indicator.style.padding = '8px 12px';
            indicator.style.borderRadius = '4px';
            indicator.style.fontWeight = 'bold';
            indicator.style.zIndex = '9999';
            indicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            indicator.innerHTML = 'Using Mock Database (Offline Mode)';
            document.body.appendChild(indicator);
        } else {
            indicator.style.display = 'block';
        }
    }
})();
