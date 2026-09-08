# CodeArena -- Home Page, UI Design, Coding Interface, Timer & Topbar

## 1. Overview

CodeArena is a web-based coding practice platform designed to provide
users with an interactive environment for browsing programming problems
and solving them using an online coding workspace.

The interface follows a dark coding-platform design and is divided into
reusable React components for easier maintenance and future development.

------------------------------------------------------------------------

## 2. Home Page

The Home Page is the main entry point of CodeArena. It allows users to
browse the available programming problems.

### 2.1 Top Navigation Bar

The Home Page contains a top navigation bar with:

-   CodeArena logo
-   Sign In option
-   User avatar/profile area after login
-   Logout option for authenticated users

The navigation is kept simple so users can quickly access the main
features.

### 2.2 Page Heading

The Home Page displays:

> "QUALITY OVER QUANTITY"

This represents the project's focus on providing useful and structured
coding problems.

### 2.3 Problems Table

The problems are displayed in a structured table.

  Column       Purpose
  ------------ -----------------------------------
  Status       Indicates the problem status
  Title        Displays problem number and title
  Difficulty   Shows Easy, Medium, or Hard
  Category     Shows the problem category
  Solution     Indicates solution availability

Clicking a problem title opens its individual coding workspace.

------------------------------------------------------------------------

## 3. UI Design

CodeArena uses a dark-themed interface designed for a focused coding
experience.

### 3.1 Color Scheme

The interface mainly uses:

-   Dark backgrounds for the application and workspace
-   White and light-gray text for readability
-   Green for successful actions and Easy problems
-   Yellow for Medium problems
-   Red for Hard problems
-   Gray shades for secondary controls and panels

### 3.2 Typography

Different font sizes and font weights are used to create a clear visual
hierarchy between:

-   Page headings
-   Problem titles
-   Difficulty labels
-   Navigation elements
-   Test-case information
-   Buttons and controls

### 3.3 Buttons and Icons

React Icons are used throughout the interface for controls such as:

-   Previous/next navigation
-   Problem list
-   Timer
-   Settings
-   Full-screen mode
-   Logout
-   Other workspace actions

Buttons use consistent spacing, rounded corners, and hover effects.

------------------------------------------------------------------------

# 4. Topbar

The `Topbar` is a reusable navigation component used across the
application.

## 4.1 Main Topbar

The main Topbar provides access to:

-   CodeArena logo
-   Sign In
-   User avatar after login
-   User email information
-   Logout

The authentication state controls whether the user sees the Sign In
option or authenticated-user controls.

## 4.2 Problem Page Topbar

On an individual problem page, the Topbar additionally provides problem
navigation controls:

-   Previous problem
-   Problem list
-   Next problem
-   Timer

This allows users to move between problems without returning to the Home
Page.

## 4.3 User Authentication Display

When a user is authenticated, the interface displays the user's avatar
and account information.

A logout button is available to allow the user to end the current
session.

## 4.4 Design

The Topbar uses the same dark theme as the rest of the application and
keeps important controls accessible without taking too much screen
space.

------------------------------------------------------------------------

# 5. Coding Interface

The coding interface is the main problem-solving area of CodeArena.

The workspace is divided into two resizable panels:

``` text
+------------------------------------------------------+
|                     Topbar                           |
+--------------------------+---------------------------+
|                          |                           |
|   Problem Description    |      Coding Playground    |
|                          |                           |
|   Problem Statement      |      Preference Nav       |
|   Examples               |      Code Editor          |
|   Constraints            |                           |
|   Like / Dislike / Star  |      Test Cases           |
|                          |      Input / Output       |
|                          |                           |
+--------------------------+---------------------------+
|                          |      Console  Run Submit |
+--------------------------+---------------------------+
```

## 5.1 Problem Description Panel

The left side displays the selected programming problem.

It contains:

-   Problem title
-   Problem statement
-   Examples
-   Constraints
-   Like button
-   Dislike button
-   Star/favorite functionality

This panel allows the user to understand the problem before writing
code.

## 5.2 Resizable Workspace

The problem description and coding playground are separated using
`React Split`.

Users can drag the divider to increase or decrease the width of either
panel.

This provides flexibility according to the user's preference.

------------------------------------------------------------------------

# 6. Code Editor

The code editor is implemented using **CodeMirror**.

It provides a dedicated environment for writing programming solutions.

### Features currently included:

-   JavaScript editor
-   Syntax support through the JavaScript CodeMirror extension
-   VS Code-style dark theme
-   Editable code area
-   Starter code for problems
-   Code changes maintained in React state

The editor is more suitable for programming than a basic HTML text area
because it provides a specialized coding-editor interface.

------------------------------------------------------------------------

# 7. Preference Navigation

The coding playground contains a preference navigation bar above the
editor.

It currently provides:

-   JavaScript language indicator
-   Settings control
-   Full-screen control

The language indicator shows the currently selected programming
language.

The full-screen button allows the user to enter or exit browser
full-screen mode.

The settings control provides a place for future editor customization
features.

------------------------------------------------------------------------

# 8. Test Cases

The coding interface contains a Testcases section below the editor.

Users can select different test cases.

For the selected test case, the interface displays:

### Input

The input values used for the test case.

### Output

The expected output for the selected test case.

The test-case interface makes it easier for users to understand how the
solution is expected to behave.

Example:

``` text
Case 1

Input:
nums = [2,7,11,15], target = 9

Output:
[0,1]
```

Multiple test cases can be selected using the case buttons.

------------------------------------------------------------------------

# 9. Editor Footer

The bottom of the coding interface contains the editor footer.

It provides:

-   Console button
-   Run button
-   Submit button

The Console control provides a dedicated area for execution-related
output.

The Run and Submit controls are positioned on the right side for easy
access while coding.

The submission and code-execution functionality can be extended further
as the project develops.

------------------------------------------------------------------------

# 10. Timer

The CodeArena problem workspace includes a coding timer.

The timer is implemented as a reusable React component.

## 10.1 Timer Behaviour

Initially, the timer control is displayed in the Topbar.

When the user activates the timer:

-   The timer starts counting seconds.
-   The elapsed time is displayed in `HH:MM:SS` format.
-   The timer continues while it is active.
-   A refresh/reset control is provided to stop and reset the timer.

Example:

``` text
00:05:32
```

This represents 5 minutes and 32 seconds of elapsed coding time.

## 10.2 Timer Implementation

The timer uses React state to store the elapsed time and `useEffect`
with `setInterval` to update the value every second.

When the timer is stopped or reset, the interval is cleared and the
elapsed time is returned to zero.

## 10.3 Purpose

The timer helps users track how much time they spend solving a
particular problem and provides a more realistic coding-practice
experience.

------------------------------------------------------------------------

# 11. Authentication UI

CodeArena contains a dedicated authentication interface.

It includes:

-   Login
-   Registration
-   Forgot Password

The authentication interface uses a modal-based design.

Toast notifications are used to display success and error messages.

Firebase Authentication is integrated into authentication-related
functionality.

------------------------------------------------------------------------

# 12. Responsive and Interactive Design

Tailwind CSS utility classes are used for styling and responsive
layouts.

Interactive features include:

-   Hover effects
-   Clickable problem titles
-   Test-case selection
-   Resizable workspace panels
-   Timer controls
-   Full-screen mode
-   Authentication modal navigation
-   Navigation between problems

The UI is designed to remain consistent across the Home Page and
problem-solving workspace.

------------------------------------------------------------------------

# 13. Component Structure

The interface is organized into reusable React components:

``` text
src/components/
├── Topbar/
│   └── Topbar.tsx
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

The component-based structure makes individual features easier to
develop, test, modify, and reuse.

------------------------------------------------------------------------

# 14. Technologies and Libraries Used

  Technology / Library              Purpose
  --------------------------------- ---------------------------------------------
  React                             Building reusable user-interface components
  Next.js                           Application framework and routing
  TypeScript                        Type-safe development
  Tailwind CSS                      Styling and responsive design
  Firebase                          Authentication and database functionality
  Recoil                            Application state management
  React Icons                       Interface icons
  React Toastify                    Notifications
  React Split                       Resizable workspace panels
  CodeMirror                        Online code editor
  CodeMirror JavaScript Extension   JavaScript syntax support

------------------------------------------------------------------------

# 15. Design Goals

The main design goals of CodeArena are:

1.  Provide a clean coding-focused interface.
2.  Make coding problems easy to browse.
3.  Keep navigation simple and intuitive.
4.  Provide a comfortable dark coding environment.
5.  Clearly separate problem description and coding areas.
6.  Provide an interactive code editor.
7.  Allow users to switch between test cases easily.
8.  Provide useful coding controls such as Run, Submit, Console, and
    Timer.
9.  Use reusable and organized React components.
10. Provide a foundation for future coding-platform features.

------------------------------------------------------------------------

# 16. Future UI Improvements

Possible future improvements include:

-   Additional programming language support
-   Improved mobile responsiveness
-   Advanced problem filtering and searching
-   Submission history
-   User progress dashboard
-   More editor customization settings
-   Detailed code execution results
-   Improved console functionality
-   Accessibility improvements
-   Further browser-side performance optimization

------------------------------------------------------------------------

# 17. Summary

The CodeArena UI combines a problem-list Home Page with an interactive
coding workspace. The application uses a dark-themed design, reusable
React components, a navigation Topbar, coding timer, resizable problem
and editor panels, CodeMirror, test cases, and editor controls.

The overall interface is designed to provide a focused and user-friendly
environment for practicing programming problems while keeping the
application modular and easy to extend.