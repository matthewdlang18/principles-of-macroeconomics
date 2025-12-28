# Activity 5: AI Exam Generator

## Overview

Activity 5 is an interactive AI-powered exam preparation activity for the macroeconomics course. Students engage in three-part learning experience: solo AI practice, group reflection, and collaborative study guide creation.

## Features

### For Students
- **Solo AI Practice**: Interactive chat with AI to practice exam questions
- **Group Reflection**: Structured reflection on AI learning experience
- **Study Guide Creation**: Collaborative creation of exam preparation materials
- **Progress Tracking**: Visual progress indicators for each activity phase
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### For TAs
- **Dashboard Analytics**: Real-time student progress monitoring
- **Section Management**: Filter by TA sections
- **Data Export**: Download student activity data
- **Conversation Tracking**: Monitor AI conversation quality and quantity

## Setup Instructions

### 1. Database Setup

Run the setup script to create necessary Supabase tables:

```bash
# Set your Supabase credentials first
export SUPABASE_URL='your-supabase-url'
export SUPABASE_ANON_KEY='your-supabase-anon-key'

# Run the setup script
./setup_activity5_tables.sh
```

### 2. Verify Setup

Check that all tables were created correctly:

```bash
./verify_activity5_tables.sh
```

### 3. Manual Database Setup (Alternative)

If the script doesn't work, you can manually run the SQL in your Supabase dashboard:

```sql
-- Copy and paste the contents of setup_activity5_tables.sql
-- into your Supabase SQL Editor
```

## Database Schema

### Tables Created

1. **activity5_conversations**
   - Stores AI conversation history for each student
   - JSON format for flexible conversation data

2. **activity5_group_reflections**
   - Stores group reflection responses
   - Fields: ai_insights, challenges, improvements

3. **activity5_study_guides**
   - Stores student-created study guide questions
   - JSON format for question/answer pairs

4. **activity5_access_log**
   - Logs student access for analytics
   - Tracks login, chat, reflection, and study guide activities

## File Structure

```
activities/activity5/
├── index.html              # Main activity page
├── ta-dashboard.html        # TA analytics dashboard
├── styles.css             # Activity-specific styles
├── js/
│   ├── auth.js            # Authentication service
│   └── activity.js        # Main activity logic
└── ai_exam_generator.html  # Original prototype (reference)
```

## Usage

### Student Access
1. Navigate to `activities/activity5/`
2. Log in with student ID, passcode, and section
3. Complete the three activity phases:
   - Solo AI Practice (5+ conversation exchanges)
   - Group Reflection (complete all fields)
   - Study Guide Creation (add questions and answers)

### TA Access
1. Navigate to `activities/activity5/ta-dashboard.html`
2. View student progress across all sections
3. Filter by specific TA sections
4. Export data for analysis

## Activity Flow

### Phase 1: Solo AI Practice (15-20 minutes)
- Students start individual AI conversations
- Practice exam questions on course topics
- Minimum 5 conversation exchanges required
- Progress automatically tracked

### Phase 2: Group Reflection (10-15 minutes)
- Students work in groups to reflect on AI experience
- Complete structured reflection form:
  - AI insights gained
  - Challenges encountered
  - Improvements for exam prep
- Submit group responses

### Phase 3: Study Guide Creation (15-20 minutes)
- Groups create new exam questions
- Add multiple choice or short answer questions
- Provide correct answers and explanations
- Contribute to class study guide

## Technical Details

### Authentication
- Uses existing Supabase student authentication system
- Integrates with TA sections for proper access control
- Session persistence with localStorage

### Data Storage
- All student data stored in Supabase
- Automatic progress saving
- Real-time data updates

### AI Integration
- Currently uses simulated AI responses
- Designed for easy integration with actual AI APIs
- Conversation history preserved

## Integration Notes

### Existing System Compatibility
- Follows standard activity patterns used throughout the course
- Compatible with existing authentication system
- Uses established Supabase integration patterns

### Security Considerations
- Student data isolated by section
- No cross-student data access
- Optional Row Level Security (RLS) support

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check Supabase credentials in environment variables
   - Verify tables exist with verification script

2. **Authentication Issues**
   - Ensure student exists in students table
   - Verify section assignment in ta_sections table

3. **Progress Not Saving**
   - Check browser console for JavaScript errors
   - Verify Supabase connection

### Debug Tools

- Browser developer console for JavaScript errors
- Network tab to check API calls
- Supabase dashboard for database queries

## Customization

### Modifying AI Responses
Edit the `generateAIResponse()` function in `js/activity.js` to:
- Integrate with actual AI APIs
- Customize response logic
- Add course-specific content

### Adding Features
- Extend database schema as needed
- Add new activity phases in main HTML
- Update JavaScript logic accordingly

### Styling Changes
Modify `styles.css` to:
- Change color scheme (currently purple theme)
- Adjust responsive breakpoints
- Update animations and transitions

## Support

For technical issues or questions:
1. Check the browser console for errors
2. Verify database setup with verification script
3. Review the existing activity patterns in other activities
4. Check Supabase dashboard for data issues

## Future Enhancements

Potential improvements:
- Real AI API integration
- Advanced analytics dashboard
- Peer review system for study guides
- Gamification elements
- Export to study platforms
