/**
 * Automatic Lecture Materials Detection System
 * Detects when lecture PDFs exist and automatically generates links
 */

// Configuration: Define the structure of lecture materials
const lectureConfig = {
    weeks: [
        {
            week: 1,
            monday: {
                slides: 'lecture_slides/Lecture1_updated.pdf',
                notes: 'lecture_notes/Lecture1notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture2_updated.pdf',
                notes: 'lecture_notes/Lecture2notes_updated.pdf'
            }
        },
        {
            week: 2,
            monday: {
                slides: 'lecture_slides/Lecture3_updated.pdf',
                notes: 'lecture_notes/Lecture3notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture4_updated.pdf',
                notes: 'lecture_notes/Lecture4notes_updated.pdf'
            }
        },
        {
            week: 3,
            monday: {
                slides: 'lecture_slides/Lecture5_updated.pdf',
                notes: 'lecture_notes/Lecture5notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture6_updated.pdf',
                notes: 'lecture_notes/Lecture6notes_updated.pdf'
            }
        },
        {
            week: 4,
            monday: {
                slides: 'lecture_slides/Lecture7_updated.pdf',
                notes: 'lecture_notes/Lecture7notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture8_updated.pdf',
                notes: 'lecture_notes/Lecture8notes_updated.pdf'
            }
        },
        {
            week: 5,
            monday: null, // Midterm - no materials
            wednesday: {
                slides: 'lecture_slides/Lecture9_updated.pdf',
                notes: 'lecture_notes/Lecture9notes_updated.pdf'
            }
        },
        {
            week: 6,
            monday: {
                slides: 'lecture_slides/Lecture10_updated.pdf',
                notes: 'lecture_notes/Lecture10notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture11_updated.pdf',
                notes: 'lecture_notes/Lecture11notes_updated.pdf'
            }
        },
        {
            week: 7,
            monday: {
                slides: 'lecture_slides/Lecture12_updated.pdf',
                notes: 'lecture_notes/Lecture12notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture13_updated.pdf',
                notes: 'lecture_notes/Lecture13notes_updated.pdf'
            }
        },
        {
            week: 8,
            monday: {
                slides: 'lecture_slides/Lecture14_updated.pdf',
                notes: 'lecture_notes/Lecture14notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture15_updated.pdf',
                notes: 'lecture_notes/Lecture15notes_updated.pdf'
            }
        },
        {
            week: 9,
            monday: null, // Presidents' Day - no class
            wednesday: {
                slides: 'lecture_slides/Lecture16_updated.pdf',
                notes: 'lecture_notes/Lecture16notes_updated.pdf'
            }
        },
        {
            week: 10,
            monday: {
                slides: 'lecture_slides/Lecture17_updated.pdf',
                notes: 'lecture_notes/Lecture17notes_updated.pdf'
            },
            wednesday: {
                slides: 'lecture_slides/Lecture18_updated.pdf',
                notes: 'lecture_notes/Lecture18notes_updated.pdf'
            }
        }
    ]
};

/**
 * Check if a file exists by attempting to fetch it
 */
async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Generate HTML for a single lecture day's materials
 */
async function generateLectureMaterials(day, materials) {
    if (!materials) {
        return '<span class="text-gray-400 italic">No class this day</span>';
    }

    const slidesExist = await fileExists(materials.slides);
    const notesExist = await fileExists(materials.notes);

    const parts = [];

    if (slidesExist) {
        parts.push(`<a href="${materials.slides}" class="text-blue-600 hover:underline">Lecture Slides</a>`);
    } else {
        parts.push('<span class="text-gray-400 italic">Slides not yet available</span>');
    }

    if (notesExist) {
        parts.push(`<a href="${materials.notes}" class="text-blue-600 hover:underline">Lecture Notes</a>`);
    } else {
        parts.push('<span class="text-gray-400 italic">Notes not yet available</span>');
    }

    return parts.join(' • ');
}

/**
 * Update all lecture materials in the table
 */
async function updateAllLectureMaterials() {
    for (const weekConfig of lectureConfig.weeks) {
        const week = weekConfig.week;
        
        // Update Monday materials
        const mondayElement = document.getElementById(`week${week}-monday-materials`);
        if (mondayElement) {
            const mondayHTML = await generateLectureMaterials('Monday', weekConfig.monday);
            mondayElement.innerHTML = mondayHTML;
        }

        // Update Wednesday materials
        const wednesdayElement = document.getElementById(`week${week}-wednesday-materials`);
        if (wednesdayElement) {
            const wednesdayHTML = await generateLectureMaterials('Wednesday', weekConfig.wednesday);
            wednesdayElement.innerHTML = wednesdayHTML;
        }
    }
}

// Run the update when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAllLectureMaterials);
} else {
    updateAllLectureMaterials();
}
