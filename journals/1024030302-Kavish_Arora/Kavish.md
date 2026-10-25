# CodeArena – Problems & Navigation README

## 1. Overview

This document covers the **Problems & Navigation** section of the CodeArena project.

The main responsibility of this section is to provide users with a problem listing page, individual problem pages, problem filtering/search, difficulty levels, and navigation between problems.

### Main Responsibilities

- Problem listing page
- Dynamic problem pages
- Problems table
- Problem search
- Problem filtering
- Difficulty levels
- Problem navigation
- Previous/Next problem functionality
- Integration with the application's top navigation
- Using mock problem data during development

---

# 2. Problems & Navigation Files / Folders

The main files/folders are:

```text
/src/app/problems
/src/app/problems/[pid]
/src/components/ProblemsTable
/src/components
/src/mockProblems/problem.ts
```

### Purpose of important files

| File / Folder | Purpose |
|---|---|
| `/src/app/problems` | Main problems listing page |
| `/src/app/problems/[pid]` | Dynamic page for an individual problem |
| `/src/components/ProblemsTable` | Displays problems in a table/list |
| `/src/components` | Reusable UI and navigation components |
| `/src/mockProblems/problem.ts` | Mock problem data used for development/testing |

---

# 3. Application Flow

The basic problem-solving flow is:

```text
Home Page
   ↓
Problems
   ↓
Problems Listing
   ↓
Search / Filter
   ↓
Select Problem
   ↓
/problems/[pid]
   ↓
Individual Problem Page
   ↓
Previous / Next Problem
```

---

# 4. Problem Data Structure

During development, problems can be stored as mock data.

Example:

```ts
export const problems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array",
    description: "Find two numbers that add up to a target.",
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    category: "String",
    description: "Reverse the given string.",
  },
];
```

A problem normally contains information such as:

```text
id
title
difficulty
category
description
examples
constraints
```

Depending on the project implementation, additional fields can be added.

---

# 5. Problems Listing Page

The problems page is responsible for displaying all available coding problems.

Typical route:

```text
/problems
```

The page should:

1. Load the problem data.
2. Display problems in a table/list.
3. Show the problem title.
4. Show difficulty.
5. Allow the user to search/filter.
6. Allow the user to open an individual problem.

Example:

```tsx
{problems.map((problem) => (
  <div key={problem.id}>
    {problem.title}
  </div>
))}
```

---

# 6. Dynamic Problem Page

Individual problems use a dynamic route:

```text
/problems/[pid]
```

For example:

```text
/problems/two-sum
/problems/reverse-string
/problems/binary-search
```

Here `[pid]` represents the problem ID.

The page uses the ID to find the correct problem.

Example:

```ts
const problem = problems.find(
  (problem) => problem.id === pid
);
```

If the problem is found, its details are displayed.

If it is not found, the application should show an appropriate error or not-found page.

---

# 7. Problem Search

The search functionality allows users to find a problem by title or other relevant information.

Example:

```ts
const filteredProblems = problems.filter((problem) =>
  problem.title.toLowerCase().includes(search.toLowerCase())
);
```

### Search Flow

```text
User enters search text
        ↓
Search state updates
        ↓
Problem list is filtered
        ↓
Matching problems are displayed
```

---

# 8. Problem Filtering

Problems can be filtered according to their difficulty.

Example difficulty levels:

```text
Easy
Medium
Hard
```

Example:

```ts
const filteredProblems = problems.filter(
  (problem) => problem.difficulty === selectedDifficulty
);
```

For an "All" option:

```ts
const filteredProblems =
  selectedDifficulty === "All"
    ? problems
    : problems.filter(
        (problem) => problem.difficulty === selectedDifficulty
      );
```

---

# 9. Search + Filter Together

Search and difficulty filtering can be combined.

Example:

```ts
const filteredProblems = problems.filter((problem) => {
  const matchesSearch = problem.title
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesDifficulty =
    selectedDifficulty === "All" ||
    problem.difficulty === selectedDifficulty;

  return matchesSearch && matchesDifficulty;
});
```

This allows the user to:

- Search for a specific problem.
- Select a difficulty.
- See only problems matching both conditions.

---

# 10. Difficulty Levels

The problem table should clearly display the difficulty of each problem.

Recommended values:

```text
Easy
Medium
Hard
```

Difficulty is useful because users can choose problems according to their skill level.

Example:

```tsx
<span>{problem.difficulty}</span>
```

---

# 11. Problem Navigation

Navigation allows users to move between problems without returning to the main problem list.

Example:

```text
Problem 1
   ↓
Next
   ↓
Problem 2
   ↓
Next
   ↓
Problem 3
```

And backwards:

```text
Problem 3
   ↓
Previous
   ↓
Problem 2
```

---

# 12. Previous Problem Logic

If the current problem has an index:

```ts
const currentIndex = problems.findIndex(
  (problem) => problem.id === pid
);
```

The previous problem can be obtained using:

```ts
const previousProblem = problems[currentIndex - 1];
```

Before navigating, check that the current problem is not the first problem.

Example:

```ts
if (currentIndex > 0) {
  // Navigate to previous problem
}
```

---

# 13. Next Problem Logic

The next problem can be obtained using:

```ts
const nextProblem = problems[currentIndex + 1];
```

Before navigating, check that the current problem is not the last problem.

Example:

```ts
if (currentIndex < problems.length - 1) {
  // Navigate to next problem
}
```

---

# 14. Navigation Using Next.js

For client-side navigation, Next.js `useRouter()` can be used.

Example:

```tsx
"use client";

import { useRouter } from "next/navigation";

const router = useRouter();

router.push(`/problems/${nextProblem.id}`);
```

For a problem link, `Link` can also be used:

```tsx
import Link from "next/link";

<Link href={`/problems/${problem.id}`}>
  {problem.title}
</Link>
```

---

# 15. Handling Invalid Problem IDs

A user may manually enter a URL such as:

```text
/problems/abc123
```

when that problem does not exist.

The application should check whether the problem exists.

Example:

```ts
const problem = problems.find(
  (problem) => problem.id === pid
);

if (!problem) {
  // Show not found page
}
```

With Next.js:

```ts
import { notFound } from "next/navigation";

if (!problem) {
  notFound();
}
```

This prevents the application from displaying an empty or broken problem page.

---

# 16. Problems Table

The `ProblemsTable` component is responsible for presenting problems in an organized format.

Typical columns:

```text
Problem
Difficulty
Category
Action
```

Example:

```text
---------------------------------------------
| Problem        | Difficulty | Action       |
---------------------------------------------
| Two Sum        | Easy       | Solve        |
| Binary Search  | Medium     | Solve        |
| Merge Sort     | Hard       | Solve        |
---------------------------------------------
```

Each problem should provide a way to open its individual page.

---

# 17. Mock Problems Data

During development, mock data can be used instead of a backend.

Example:

```ts
export const problems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
  },
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Medium",
  },
];
```

Mock data makes it possible to build and test the UI before connecting a real database or API.

---

# 18. Common Problems & Navigation Errors

## Error 1 – Problem page is blank

### Possible cause

The problem ID does not match any item in the problem data.

Example:

```text
/problems/two-sum
```

but the data contains:

```ts
id: "Two-Sum"
```

### Fix

Make sure the IDs match exactly.

Recommended:

```ts
id: "two-sum"
```

and:

```ts
/problems/two-sum
```

---

# 19. Error 2 – `Cannot read properties of undefined`

### Possible cause

The code tries to access a problem before checking whether it exists.

For example:

```ts
problem.title
```

when `problem` is undefined.

### Fix

Check the problem first:

```ts
if (!problem) {
  notFound();
}
```

or conditionally render it.

---

# 20. Error 3 – Next button causes an error

### Possible cause

There is no next problem because the user is already on the last problem.

### Fix

Check the index:

```ts
if (currentIndex < problems.length - 1) {
  router.push(`/problems/${problems[currentIndex + 1].id}`);
}
```

The Next button can also be disabled:

```tsx
disabled={currentIndex === problems.length - 1}
```

---

# 21. Error 4 – Previous button causes an error

### Possible cause

The user is already on the first problem.

### Fix

Check:

```ts
if (currentIndex > 0) {
  router.push(`/problems/${problems[currentIndex - 1].id}`);
}
```

Disable the button when required:

```tsx
disabled={currentIndex === 0}
```

---

# 22. Error 5 – Search is not working

### Possible causes

- Search state is not updating.
- The wrong property is being searched.
- Case sensitivity is causing unexpected results.
- Filtering is being applied to the wrong array.

### Recommended solution

Convert both values to lowercase:

```ts
problem.title
  .toLowerCase()
  .includes(search.toLowerCase())
```

---

# 23. Error 6 – Filter shows no problems

### Possible causes

The difficulty value in the filter does not match the data.

For example:

```text
Filter: Medium
Data: medium
```

These values are different.

### Fix

Use consistent values:

```text
Easy
Medium
Hard
```

throughout the application.

---

# 24. Error 7 – Dynamic route does not work

### Possible cause

The folder structure is incorrect.

Correct structure:

```text
src
└── app
    └── problems
        ├── page.tsx
        └── [pid]
            └── page.tsx
```

The square brackets are important because `[pid]` represents a dynamic route.

---

# 25. Error 8 – `useRouter` error

### Possible cause

The component uses a client-side hook without being a Client Component.

### Fix

Add:

```tsx
"use client";
```

at the top of the component when using:

```ts
useRouter()
useState()
useEffect()
```

Example:

```tsx
"use client";

import { useRouter } from "next/navigation";
```

---

# 26. Error 9 – Search/filter resets unexpectedly

### Possible cause

The search or filter state is stored incorrectly or the component is being unnecessarily remounted.

### Fix

Keep UI state inside the component that controls the search/filter and ensure the problem data is stable.

Example:

```ts
const [search, setSearch] = useState("");
const [selectedDifficulty, setSelectedDifficulty] =
  useState("All");
```

---

# 27. Error 10 – Problem links go to the wrong page

### Possible cause

The wrong ID is passed into the route.

Incorrect:

```tsx
<Link href="/problems">
```

Correct:

```tsx
<Link href={`/problems/${problem.id}`}>
```

---

# 28. Common Queries / Logic Used

### Find a problem

```ts
const problem = problems.find(
  (problem) => problem.id === pid
);
```

### Find current problem index

```ts
const currentIndex = problems.findIndex(
  (problem) => problem.id === pid
);
```

### Find next problem

```ts
const nextProblem = problems[currentIndex + 1];
```

### Find previous problem

```ts
const previousProblem = problems[currentIndex - 1];
```

### Search

```ts
const result = problems.filter((problem) =>
  problem.title.toLowerCase().includes(search.toLowerCase())
);
```

### Filter by difficulty

```ts
const result = problems.filter(
  (problem) => problem.difficulty === selectedDifficulty
);
```

---

# 29. Testing Checklist

Before considering the Problems & Navigation section complete:

```text
[ ] Problems page opens correctly
[ ] All problems are displayed
[ ] Problem titles are correct
[ ] Difficulty levels are displayed
[ ] Search works
[ ] Difficulty filter works
[ ] Search + filter work together
[ ] Clicking a problem opens the correct page
[ ] Dynamic /problems/[pid] route works
[ ] Problem description is displayed
[ ] Invalid problem ID is handled
[ ] Previous button works
[ ] Next button works
[ ] Previous is disabled on first problem
[ ] Next is disabled on last problem
[ ] Navigation does not produce broken URLs
[ ] Top navigation correctly opens Problems
[ ] Responsive layout works
```

---

# 30. Debugging Process

When the Problems section is not working:

```text
1. Check the browser console
        ↓
2. Check the problem ID
        ↓
3. Check mock problem data
        ↓
4. Check /problems/page.tsx
        ↓
5. Check /problems/[pid]/page.tsx
        ↓
6. Check ProblemsTable component
        ↓
7. Check search/filter logic
        ↓
8. Check router.push() / Link
        ↓
9. Check Previous/Next index
        ↓
10. Test again
```

---

# 31. Git Collaboration Notes

When working with multiple team members, avoid making unrelated changes inside the same files.

For the Problems & Navigation section, the main files to coordinate are:

```text
/src/app/problems
/src/app/problems/[pid]
/src/components/ProblemsTable
/src/mockProblems/problem.ts
```

Before pushing changes:

```bash
git status
git add .
git commit -m "Update problems and navigation"
git push
```

Before starting new work:

```bash
git pull
```

If another member has modified the same file, resolve the Git conflict carefully before committing.

---

# 32. Final Summary

The **Problems & Navigation** section provides the core problem-browsing experience in CodeArena.

It includes:

- Problem listing
- Problems table
- Dynamic problem pages
- Search
- Difficulty filtering
- Mock problem data
- Previous/Next navigation
- Invalid problem handling
- Integration with top navigation

The overall structure is:

```text
Problems Data
     ↓
Problems Listing
     ↓
Search / Filter
     ↓
Select Problem
     ↓
Dynamic Problem Page
     ↓
Previous / Next Navigation
```

This structure keeps the problem-browsing functionality organized and makes it easier to later replace mock data with a real backend or database.
