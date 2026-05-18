/**
 * Section Service for Investment Odyssey
 *
 * Handles TA sections, including creation, retrieval, and management.
 */

import BaseService from './base-service.js';

class SectionService extends BaseService {
  constructor() {
    super();
  }

  // Get all sections
  async getAllSections() {
    try {
      // Get sections ordered by day and time
      const { data: sections, error } = await this.supabase
        .from('sections')
        .select(`
          id,
          day,
          time,
          location,
          ta_id,
          profiles:ta_id (name)
        `)
        .order('day')
        .order('time');

      if (error) {
        return this.error('Error getting sections', error);
      }

      // Format the sections
      const formattedSections = sections.map(section => ({
        id: section.id,
        day: section.day,
        time: section.time,
        location: section.location,
        ta: section.profiles?.name || 'Unknown'
      }));

      return this.success(formattedSections);
    } catch (error) {
      return this.error('Error getting sections', error);
    }
  }

  // Get sections by TA
  async getSectionsByTA(taId) {
    try {
      if (!taId) {
        return this.error('TA ID is required');
      }

      // Get sections for this TA
      const { data: sections, error } = await this.supabase
        .from('sections')
        .select(`
          id,
          day,
          time,
          location,
          ta_id,
          profiles:ta_id (name)
        `)
        .eq('ta_id', taId)
        .order('day')
        .order('time');

      if (error) {
        return this.error('Error getting sections by TA', error);
      }

      // Format the sections
      const formattedSections = sections.map(section => ({
        id: section.id,
        day: section.day,
        time: section.time,
        location: section.location,
        ta: section.profiles?.name || 'Unknown'
      }));

      return this.success(formattedSections);
    } catch (error) {
      return this.error('Error getting sections by TA', error);
    }
  }

  // Get a section by ID
  async getSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      // Get section
      const { data: section, error } = await this.supabase
        .from('sections')
        .select(`
          id,
          day,
          time,
          location,
          ta_id,
          profiles:ta_id (name)
        `)
        .eq('id', sectionId)
        .single();

      if (error) {
        return this.error('Error getting section', error);
      }

      // Format the section
      const formattedSection = {
        id: section.id,
        day: section.day,
        time: section.time,
        location: section.location,
        ta: section.profiles?.name || 'Unknown'
      };

      return this.success(formattedSection);
    } catch (error) {
      return this.error('Error getting section', error);
    }
  }

  // Create a section
  async createSection(taId, day, time, location) {
    try {
      if (!taId || !day || !time) {
        return this.error('TA ID, day, time, and location are required');
      }

      // Get TA name for reference
      const { data: ta, error: taError } = await this.supabase
        .from('profiles')
        .select('name')
        .eq('custom_id', taId)
        .single();

      if (taError) {
        return this.error('TA not found', taError);
      }

      // Create section
      const { data: section, error: sectionError } = await this.supabase
        .from('sections')
        .insert({
          day,
          time,
          location: location || 'TBD',
          ta_id: taId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sectionError) {
        return this.error('Error creating section', sectionError);
      }

      // Format the section
      const formattedSection = {
        id: section.id,
        day: section.day,
        time: section.time,
        location: section.location,
        ta: ta.name
      };

      return this.success(formattedSection);
    } catch (error) {
      return this.error('Error creating section', error);
    }
  }

  // Update a section
  async updateSection(sectionId, updates) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      // Add updated_at timestamp
      updates.updated_at = new Date().toISOString();

      // Update section
      const { data: section, error } = await this.supabase
        .from('sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) {
        return this.error('Error updating section', error);
      }

      // Get TA name for the updated section
      const { data: ta } = await this.supabase
        .from('profiles')
        .select('name')
        .eq('id', section.ta_id)
        .single();

      // Format the section
      const formattedSection = {
        id: section.id,
        day: section.day,
        time: section.time,
        location: section.location,
        ta: ta?.name || 'Unknown'
      };

      return this.success(formattedSection);
    } catch (error) {
      return this.error('Error updating section', error);
    }
  }

  // Delete a section
  async deleteSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      // Start a transaction
      const { error: updateError } = await this.supabase.rpc('delete_section', { section_id: sectionId });

      if (updateError) {
        // If the RPC doesn't exist, do it manually
        // First, update all users in this section
        const { error: usersError } = await this.supabase
          .from('profiles')
          .update({ section_id: null })
          .eq('section_id', sectionId);

        if (usersError) {
          console.warn('Error updating users:', usersError);
        }

        // Then delete the section
        const { error: deleteError } = await this.supabase
          .from('sections')
          .delete()
          .eq('id', sectionId);

        if (deleteError) {
          return this.error('Error deleting section', deleteError);
        }
      }

      return this.success();
    } catch (error) {
      return this.error('Error deleting section', error);
    }
  }

  // Get students in a section
  async getStudentsInSection(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      // Get students in this section
      const { data: students, error } = await this.supabase
        .from('profiles')
        .select('id, name, role')
        .eq('section_id', sectionId)
        .eq('role', 'student')
        .order('name');

      if (error) {
        return this.error('Error getting students in section', error);
      }

      return this.success(students);
    } catch (error) {
      return this.error('Error getting students in section', error);
    }
  }

  // Initialize default sections
  async initializeDefaultSections() {
    try {
      // Check if we already have sections
      const sectionsResult = await this.getAllSections();

      if (sectionsResult.success && sectionsResult.data.length > 0) {
        console.log('Sections already exist, skipping initialization');
        return this.success(sectionsResult.data);
      }

      // Get TAs
      const { data: tas, error: tasError } = await this.supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'ta');

      if (tasError || !tas || tas.length === 0) {
        return this.error('No TAs found, cannot initialize sections');
      }

      // Create a map of TA names to IDs
      const taMap = {};
      tas.forEach(ta => {
        taMap[ta.name] = ta.id;
      });

      // Spring 2026 TA sections (kept in sync with spring2026-reset.sql).
      const defaultSections = [
        { ta: 'Yuancheng Li',    day: 'Tuesday',   time: '5:00pm-5:50pm',   location: 'Phelps 1425' },
        { ta: 'Xinran Bai',      day: 'Tuesday',   time: '5:00pm-5:50pm',   location: 'Girvetz 2128' },
        { ta: 'Steve Lin',       day: 'Tuesday',   time: '5:00pm-5:50pm',   location: 'Phelps 1508' },
        { ta: 'James Bolyard',   day: 'Tuesday',   time: '5:00pm-5:50pm',   location: 'North Hall 1109' },
        { ta: 'James Bolyard',   day: 'Tuesday',   time: '6:00pm-6:50pm',   location: 'North Hall 1109' },
        { ta: 'Xinran Bai',      day: 'Wednesday', time: '6:00pm-6:50pm',   location: 'Arts 1349' },
        { ta: 'Yuancheng Li',    day: 'Wednesday', time: '6:00pm-6:50pm',   location: 'Phelps 1425' },
        { ta: 'Yuxin Cai',       day: 'Wednesday', time: '6:00pm-6:50pm',   location: 'South Hall 1430' },
        { ta: 'Mengqi Li',       day: 'Wednesday', time: '6:00pm-6:50pm',   location: 'Girvetz 2128' },
        { ta: 'Yuxin Cai',       day: 'Wednesday', time: '7:00pm-7:50pm',   location: 'North Hall 1109' },
        { ta: 'Mengqi Li',       day: 'Thursday',  time: '6:00pm-6:50pm',   location: 'Phelps 1508' },
        { ta: 'Zachary Hayward', day: 'Thursday',  time: '6:00pm-6:50pm',   location: 'North Hall 1109' },
        { ta: 'Zi Wang',         day: 'Friday',    time: '9:00am-9:50am',   location: 'Phelps 1508' },
        { ta: 'Yuxin Cai',       day: 'Friday',    time: '10:00am-10:50am', location: 'Phelps 1508' },
        { ta: 'Steve Lin',       day: 'Friday',    time: '12:00pm-12:50pm', location: 'South Hall 1430' },
        { ta: 'Mengqi Li',       day: 'Friday',    time: '12:00pm-12:50pm', location: 'Ellison 2626' },
        { ta: 'Zachary Hayward', day: 'Friday',    time: '12:00pm-12:50pm', location: 'Girvetz 2128' },
        { ta: 'Zi Wang',         day: 'Friday',    time: '12:00pm-12:50pm', location: 'Phelps 1508' }
      ];

      const createdSections = [];

      // Create each section
      for (const section of defaultSections) {
        // Skip if TA doesn't exist
        if (!taMap[section.ta]) {
          console.warn(`TA ${section.ta} not found, skipping section`);
          continue;
        }

        const result = await this.createSection(
          taMap[section.ta],
          section.day,
          section.time,
          section.location
        );

        if (result.success) {
          createdSections.push(result.data);
        }
      }

      return this.success(createdSections);
    } catch (error) {
      return this.error('Error initializing default sections', error);
    }
  }
}

// Create and export singleton instance
const sectionService = new SectionService();
export default sectionService;
