# GMAT Mini-Mock Prep - Enhanced

## Overview

This is a web-based GMAT practice application that allows users to create and manage practice sessions with question tracking, timing, and performance analysis. The application is built as a single-page application (SPA) using vanilla HTML, CSS, and JavaScript with local storage for data persistence.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Architecture Pattern**: Single-page application with tab-based navigation
- **UI Framework**: Custom CSS with Font Awesome icons
- **State Management**: Global JavaScript variables with localStorage persistence

### Client-Side Components
- **Session Management**: Creates, tracks, and stores practice sessions
- **Question Navigation**: Handles sequential question presentation
- **Timer System**: Tracks session duration and individual question timing
- **Performance Analytics**: Calculates statistics and provides review capabilities

## Key Components

### 1. Session Management System
- **Purpose**: Manages practice sessions from creation to completion
- **Features**: 
  - Session creation with custom names
  - Question link parsing and validation
  - Progress tracking throughout sessions
  - Session history with detailed statistics

### 2. Question Handling
- **Supported Formats**: GMAT Club forum links and direct question URLs
- **Navigation**: Sequential question presentation with next/previous controls
- **Status Tracking**: Correct, incorrect, and flagged question categorization

### 3. Data Persistence Layer
- **Storage Solution**: Browser localStorage
- **Storage Keys**: 
  - `gmat_prep_sessions`: Main session data
  - `gmat_prep_settings`: User preferences and settings
- **Data Structure**: JSON-serialized session objects with question arrays

### 4. User Interface Components
- **Tab Navigation**: Three main sections (Practice, History, Review)
- **Session Creation**: Form inputs for session name and question links
- **Practice Interface**: Question display with action buttons
- **Analytics Dashboard**: Session statistics and performance metrics

## Data Flow

### Session Creation Flow
1. User enters session name and question links
2. Application validates and parses question URLs
3. Session object created with initial metadata
4. Questions array populated from parsed links
5. Session stored in localStorage

### Practice Session Flow
1. Session starts with first question
2. Timer begins tracking session duration
3. User navigates through questions sequentially
4. Each question interaction updates session state
5. Session completion triggers final statistics calculation

### Data Storage Flow
1. Session data automatically saved to localStorage
2. Auto-save functionality for input fields (500ms debounce)
3. Session state persisted across browser sessions
4. History and statistics calculated from stored session data

## External Dependencies

### Third-Party Libraries
- **Font Awesome 6.0.0**: Icon library for UI elements
- **CDN Delivery**: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`

### Browser APIs
- **localStorage**: Primary data persistence mechanism
- **DOM API**: UI manipulation and event handling
- **Date API**: Timestamp tracking and duration calculations

## Deployment Strategy

### Current Setup
- **Deployment Type**: Static web application
- **File Structure**: Single-directory deployment with separate CSS/JS files
- **Browser Compatibility**: Modern browsers with ES6+ support required

### Hosting Requirements
- **Server Type**: Static file server (Apache, Nginx, or any web server)
- **Dependencies**: None (all assets are self-contained or CDN-delivered)
- **Storage**: Client-side only (no server-side database required)

### Future Considerations
- Application currently uses only localStorage
- Could be enhanced with server-side storage (PostgreSQL) for cross-device synchronization
- PWA capabilities could be added for offline usage

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Technical Implementation Notes

### Code Organization
- **app.js**: Main application logic, session management, and UI controls
- **index.html**: Application structure and layout
- **styles.css**: Styling and responsive design
- **Global Variables**: Used for state management (sessions, currentSession, timers)

### Key Features
- **Auto-save**: Input fields automatically save with 500ms debounce
- **Session Persistence**: All data survives browser refresh/close
- **Responsive Design**: Works across different screen sizes
- **Performance Tracking**: Detailed analytics for each practice session
- **Question Status Management**: Tracks correct/incorrect/flagged questions

### Error Handling
- localStorage operations include error handling
- URL validation for question links
- Graceful degradation for missing data