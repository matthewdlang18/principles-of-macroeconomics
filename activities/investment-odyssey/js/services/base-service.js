/**
 * Base Service for Investment Odyssey
 *
 * This is the base class for all services. It provides common functionality
 * such as error handling, offline detection, and Supabase access.
 */

import supabase from './supabase-config.js';

class BaseService {
  constructor() {
    // Make Supabase available to all services
    this.supabase = supabase;

    // Set up offline detection
    this.offline = !navigator.onLine;
    window.addEventListener('online', () => {
      this.offline = false;
      this.onOnline();
    });
    window.addEventListener('offline', () => {
      this.offline = true;
      this.onOffline();
    });

    // Initialize service
    this.initialize();
  }

  // Initialize service - to be overridden by subclasses
  initialize() {
    // Subclasses should override this method
  }

  // Called when the device goes online
  onOnline() {
    console.log('Device is online');
    // Subclasses can override this method
  }

  // Called when the device goes offline
  onOffline() {
    console.log('Device is offline');
    // Subclasses can override this method
  }

  // Get current timestamp
  getTimestamp() {
    return new Date();
  }

  // Standard success response
  success(data = null) {
    return {
      success: true,
      data: data
    };
  }

  // Standard error response
  error(message, originalError = null) {
    console.error(`Service error: ${message}`, originalError);
    return {
      success: false,
      error: message,
      originalError: originalError
    };
  }

  // Save data to local storage
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage: ${key}`, error);
      return false;
    }
  }

  // Load data from local storage
  loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading from localStorage: ${key}`, error);
      return null;
    }
  }

  // Remove data from local storage
  removeFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
      return false;
    }
  }
}

export default BaseService;
