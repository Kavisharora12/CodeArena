# CodeArena -- Home Page & UI Design

## 1. Overview

The CodeArena Home Page is the main entry point of the application. It
provides users with a clean interface to browse coding problems and
access the problem-solving workspace.

The UI follows a dark coding-platform design and is built using reusable
React components.

## 2. Home Page

### 2.1 Top Navigation Bar

The navigation bar provides the main user controls and includes:

-   CodeArena logo
-   Navigation controls
-   Sign In option
-   User avatar/profile area after login
-   Logout option for authenticated users

### 2.2 Page Heading

The Home Page displays the heading:

> "QUALITY OVER QUANTITY"

This reflects the project's focus on providing useful and structured
coding problems.

### 2.3 Problems Table

The main content is a coding-problem table containing:

  Column       Purpose
  ------------ ---------------------------------------
  Status       Indicates the problem status
  Title        Displays the problem number and title
  Difficulty   Shows Easy, Medium, or Hard
  Category     Shows the problem category
  Solution     Indicates solution availability

Selecting a problem title opens its individual problem workspace.

## 3. UI Design

CodeArena uses a dark-themed coding interface designed for clarity and
comfortable coding.

### 3.1 Color Scheme

The interface uses:

-   Dark backgrounds for the main workspace
-   White/light text for readability
-   Green for successful actions and Easy difficulty
-   Yellow for Medium difficulty
-   Red for Hard difficulty
-   Gray shades for secondary controls

### 3.2 Typography

Clear typography and different font sizes and weights are used to create
hierarchy between headings, problem titles, labels, buttons, and
supporting information.

### 3.3 Buttons and Icons

The project uses React Icons for navigation arrows, timer controls,
settings, full-screen controls, logout, and other interface actions.

Buttons use consistent spacing, rounded corners, and hover effects.

## 4. Problem Workspace

The problem workspace follows a two-panel layout:

-   **Left panel:** Problem description
-   **Right panel:** Coding playground

The panels are resizable, allowing users to adjust the workspace
according to their needs.

### Problem Description

The left panel contains:

-   Problem statement
-   Examples
-   Constraints
-   Like/dislike controls
-   Star/favorite functionality

### Coding Playground

The right panel contains:

-   JavaScript editor
-   Test cases
-   Input
-   Expected output
-   Console
-   Run button
-   Submit button
-   Settings and full-screen controls

CodeMirror is used to provide the online coding editor.

## 5. Authentication UI

CodeArena includes a dedicated authentication interface with:

-   Login
-   Registration
-   Forgot Password

Toast notifications provide feedback for successful operations and
errors.

Firebase Authentication is integrated for authentication-related
functionality.

## 6. Component Structure

The UI is organized into reusable React components:

``` text
src/components/
├── Topbar/
├── Buttons/
│   └── Logout.tsx
├── Modals/
│   ├── AuthModal.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── ResetPassword.tsx
├── Timer/
│   └── Timer.tsx
└── Workspace/
    ├── ProblemDescription/
    │   └── ProblemDescription.tsx
    └── Playground/
        ├── Playground.tsx
        ├── EditorFooter.tsx
        └── PreferenceNav/
            └── PreferenceNav.tsx
```

This component-based approach makes the interface easier to maintain and
extend.

## 7. Responsive and Interactive Design

Tailwind CSS utility classes are used for styling and responsive
layouts.

React Split is used to provide resizable panels between the problem
description and coding playground.

The interface also includes interactive hover states, navigation
controls, authentication modals, timer functionality, and test-case
selection.

## 8. Technologies Used for UI

-   **React** -- Component-based UI development
-   **Next.js** -- Application framework and routing
-   **TypeScript** -- Type-safe development
-   **Tailwind CSS** -- Styling and responsive design
-   **React Icons** -- Interface icons
-   **React Toastify** -- Notifications
-   **React Split** -- Resizable panels
-   **CodeMirror** -- Online code editor
-   **Firebase** -- Authentication and database functionality

## 9. Design Goals

The main UI design goals are:

1.  Provide a clean coding-focused interface.
2.  Make coding problems easy to browse.
3.  Keep navigation simple and intuitive.
4.  Provide a comfortable dark coding environment.
5.  Clearly separate the problem description and coding areas.
6.  Provide interactive editor and test-case controls.
7.  Use reusable and organized React components.
8.  Provide a foundation for future features.

## 10. Future UI Improvements

Possible improvements include:

-   Additional programming language support
-   Improved mobile responsiveness
-   Advanced problem filtering and searching
-   Submission history
-   User progress dashboard
-   More editor settings
-   Detailed code execution results
-   Accessibility improvements
-   Further browser-performance optimization

## 11. Summary

The CodeArena Home Page and UI are designed to provide a focused and
user-friendly coding practice experience. The application combines a
dark-themed interface, reusable React components, responsive layouts,
interactive navigation, authentication, and a dedicated coding
workspace.