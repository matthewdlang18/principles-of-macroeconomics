// Script to initialize TA sections in the database

// Wait for Firebase to initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    console.log('Firebase status:', usingFirebase ? 'Initialized' : 'Not initialized');
    console.log('Service object:', typeof Service !== 'undefined' ? 'Available' : 'Not available');

    // Check if we're running in a local environment
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    console.log('Running in:', isLocalhost ? 'Local environment' : 'Production environment');

    // Make sure Firebase is initialized
    if (!usingFirebase) {
        console.error('Firebase is not initialized. Cannot add TA sections.');
        return;
    }

    // Check if Firestore is available
    if (!db) {
        console.error('Firestore database is not available.');
        return;
    }

    try {
        // Test Firestore connection
        console.log('Testing Firestore connection...');
        console.log('Firestore database object:', db);
        console.log('Firebase app:', firebase.app());
        console.log('Firebase project ID:', firebase.app().options.projectId);

        // Try to write a test document
        console.log('Attempting to write test document...');
        try {
            await db.collection('test').doc('test').set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                testField: 'This is a test',
                createdAt: new Date().toISOString()
            });
            console.log('Test document written successfully!');
        } catch (writeError) {
            console.error('Error writing test document:', writeError);
            console.log('Error code:', writeError.code);
            console.log('Error message:', writeError.message);

            // Check for permission denied errors
            if (writeError.code === 'permission-denied') {
                console.error('Permission denied. Check your Firestore security rules.');
            }
        }

        // Try to read the test document
        console.log('Attempting to read test document...');
        try {
            const docRef = db.collection('test').doc('test');
            const docSnapshot = await docRef.get();
            if (docSnapshot.exists) {
                console.log('Test document exists:', docSnapshot.data());
            } else {
                console.log('Test document does not exist');
            }
        } catch (readError) {
            console.error('Error reading test document:', readError);
        }

        console.log('Firestore connection test complete');
    } catch (error) {
        console.error('Firestore connection failed:', error);
        return;
    }

    console.log('Starting TA sections initialization...');

    // Try direct TA creation to test permissions
    console.log('Testing direct TA creation...');
    try {
        const testTAName = 'TestTA';
        // Generate passcode directly (first 3 letters + 'econ2')
        const testTAPasscode = testTAName.toLowerCase().substring(0, 3) + 'econ2';

        console.log(`Creating test TA: ${testTAName} with passcode: ${testTAPasscode}`);
        await db.collection('tas').doc(testTAName).set({
            name: testTAName,
            email: 'test@example.com',
            passcode: testTAPasscode,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Test TA created successfully!');

        // Try to read the test TA
        const testTADoc = await db.collection('tas').doc(testTAName).get();
        if (testTADoc.exists) {
            console.log('Test TA exists:', testTADoc.data());
        } else {
            console.log('Test TA was not created successfully');
        }
    } catch (taError) {
        console.error('Error creating test TA:', taError);
        console.log('Error code:', taError.code);
        console.log('Error message:', taError.message);
    }

    // Spring 2026 TA data
    const tas = [
        { name: 'Xinran Bai',      email: 'xinranbai@example.com' },
        { name: 'James Bolyard',   email: 'jamesbolyard@example.com' },
        { name: 'Yuxin Cai',       email: 'yuxincai@example.com' },
        { name: 'Zachary Hayward', email: 'zacharyhayward@example.com' },
        { name: 'Mengqi Li',       email: 'mengqili@example.com' },
        { name: 'Yuancheng Li',    email: 'yuanchengli@example.com' },
        { name: 'Steve Lin',       email: 'stevelin@example.com' },
        { name: 'Zi Wang',         email: 'ziwang@example.com' }
    ];

    // Spring 2026 section data (kept in sync with spring2026-reset.sql)
    const sections = [
        { day: 'T', time: '5:00pm-5:50pm',   location: 'Phelps 1425',     ta: 'Yuancheng Li' },
        { day: 'T', time: '5:00pm-5:50pm',   location: 'Girvetz 2128',    ta: 'Xinran Bai' },
        { day: 'T', time: '5:00pm-5:50pm',   location: 'Phelps 1508',     ta: 'Steve Lin' },
        { day: 'T', time: '5:00pm-5:50pm',   location: 'North Hall 1109', ta: 'James Bolyard' },
        { day: 'T', time: '6:00pm-6:50pm',   location: 'North Hall 1109', ta: 'James Bolyard' },
        { day: 'W', time: '6:00pm-6:50pm',   location: 'Arts 1349',       ta: 'Xinran Bai' },
        { day: 'W', time: '6:00pm-6:50pm',   location: 'Phelps 1425',     ta: 'Yuancheng Li' },
        { day: 'W', time: '6:00pm-6:50pm',   location: 'South Hall 1430', ta: 'Yuxin Cai' },
        { day: 'W', time: '6:00pm-6:50pm',   location: 'Girvetz 2128',    ta: 'Mengqi Li' },
        { day: 'W', time: '7:00pm-7:50pm',   location: 'North Hall 1109', ta: 'Yuxin Cai' },
        { day: 'R', time: '6:00pm-6:50pm',   location: 'Phelps 1508',     ta: 'Mengqi Li' },
        { day: 'R', time: '6:00pm-6:50pm',   location: 'North Hall 1109', ta: 'Zachary Hayward' },
        { day: 'F', time: '9:00am-9:50am',   location: 'Phelps 1508',     ta: 'Zi Wang' },
        { day: 'F', time: '10:00am-10:50am', location: 'Phelps 1508',     ta: 'Yuxin Cai' },
        { day: 'F', time: '12:00pm-12:50pm', location: 'South Hall 1430', ta: 'Steve Lin' },
        { day: 'F', time: '12:00pm-12:50pm', location: 'Ellison 2626',    ta: 'Mengqi Li' },
        { day: 'F', time: '12:00pm-12:50pm', location: 'Girvetz 2128',    ta: 'Zachary Hayward' },
        { day: 'F', time: '12:00pm-12:50pm', location: 'Phelps 1508',     ta: 'Zi Wang' }
    ];

    // Check if we should use fallback mode
    let useFallbackMode = false;

    // If we've had errors with Firebase, use fallback mode
    try {
        // Check if we can access the tas collection
        const tasTest = await db.collection('tas').limit(1).get();
        console.log('Firestore tas collection test:', tasTest.empty ? 'Empty collection' : 'Collection exists');
    } catch (collectionError) {
        console.error('Error accessing tas collection:', collectionError);
        console.log('Using fallback mode due to collection access error');
        useFallbackMode = true;
    }

    // Add TAs
    console.log('Adding TAs...');
    for (const ta of tas) {
        try {
            if (useFallbackMode) {
                // Fallback: Add directly to localStorage
                console.log(`Adding TA ${ta.name} to localStorage...`);
                const passcode = ta.name.toLowerCase().substring(0, 3) + 'econ2';

                // Store in localStorage
                const existingTAs = JSON.parse(localStorage.getItem('tas') || '[]');
                existingTAs.push({
                    name: ta.name,
                    email: ta.email,
                    passcode: passcode,
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('tas', JSON.stringify(existingTAs));

                console.log(`Added TA to localStorage: ${ta.name} with passcode: ${passcode}`);
            } else {
                // Normal mode: Use Service
                const result = await Service.createTA(ta.name, ta.email);
                if (result.success) {
                    console.log(`Added TA: ${ta.name} with passcode: ${result.data.passcode}`);
                } else {
                    console.error(`Failed to add TA ${ta.name}: ${result.error}`);
                    // Switch to fallback mode if we encounter an error
                    useFallbackMode = true;
                }
            }
        } catch (error) {
            console.error(`Error adding TA ${ta.name}:`, error);
            // Switch to fallback mode if we encounter an error
            useFallbackMode = true;
        }
    }

    // Add sections
    console.log('Adding sections...');
    for (const section of sections) {
        try {
            if (useFallbackMode) {
                // Fallback: Add directly to localStorage
                console.log(`Adding section ${section.day} ${section.time} to localStorage...`);

                // Generate a unique ID for the section
                const sectionId = `${section.day}_${section.time.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;

                // Store in localStorage
                const existingSections = JSON.parse(localStorage.getItem('sections') || '[]');
                existingSections.push({
                    id: sectionId,
                    day: section.day,
                    time: section.time,
                    location: section.location,
                    ta: section.ta,
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('sections', JSON.stringify(existingSections));

                console.log(`Added section to localStorage: ${section.day} ${section.time} with TA ${section.ta}`);
            } else {
                // Normal mode: Use Service
                const result = await Service.createSection(section.day, section.time, section.location, section.ta);
                if (result.success) {
                    console.log(`Added section: ${section.day} ${section.time} with TA ${section.ta}`);
                } else {
                    console.error(`Failed to add section ${section.day} ${section.time}: ${result.error}`);
                }
            }
        } catch (error) {
            console.error(`Error adding section ${section.day} ${section.time}:`, error);
            // Switch to fallback mode if we encounter an error
            useFallbackMode = true;
        }
    }

    // Final status message
    if (useFallbackMode) {
        console.log('TA sections initialization complete using localStorage fallback!');
        console.log('Note: Data is stored locally and will not be available on other devices.');

        // Show a message in the status div
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-warning">Initialization complete using localStorage fallback. Firebase connection failed.</div>';
        }
    } else {
        console.log('TA sections initialization complete using Firebase!');

        // Show a message in the status div
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-success">Initialization complete! Data successfully stored in Firebase.</div>';
        }
    }
});
