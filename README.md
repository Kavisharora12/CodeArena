# CodeArena – Competitive Programming Platform

**Live Link:** 

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Website Preview
### Code Editor
![ride1](https://github.com/user-attachments/assets/04705a8d-f19f-4df3-8c03-b5e61473881f)

### Profile
![ride1](https://github.com/user-attachments/assets/4f9bcd91-3151-4989-93e6-b9771ab29d2f)

### Submissions
![ride1](https://github.com/user-attachments/assets/0e5ed5ac-83e8-40ab-984d-40172c0578ee)

## Overview
CodeArena is a platform for developers to practice coding problems, follow their progress, and share solutions. It includes the Monaco Editor and an opt-in local Node.js child-process runner for trusted development environments.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Setup](#project-setup)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- **JavaScript Execution:** Run and grade Node.js submissions in a restricted child process for local development and trusted environments only.
- **Advanced Code Editor:** Integrated **Monaco-React Editor** providing a VS Code-like experience with syntax highlighting and indentation.
- **Solution Sharing:** A dedicated space for users to write and share their logic using **React-MD Editor** for beautiful Markdown formatting.
- **CodeArena AI:** A built-in chat assistant to help users brainstorm algorithms, explain time complexity, or debug code logic.
- **Progress Tracking:** Personalized dashboard displaying the total count of solved problems and a comprehensive history of all user submissions.
- **Secure Authentication:** Robust sign-up flow with **email verification** via **Resend Mail** and schema validation using **Zod**.

## Technologies Used

- **Next.js:** Full-stack React framework for optimized routing and server-side rendering.
- **Tailwind CSS:** For a sleek, responsive, and developer-centric UI/UX.
- **Firebase Authentication and Cloud Firestore:** Identity and application data, accessed through Firebase client authentication and server-side Firebase Admin APIs.
- **TypeScript:** Ensuring end-to-end type safety and better developer experience.
- **Node.js:** Local JavaScript execution in a child process using Node's permission flags.
- **Monaco-React:** The industry-standard web code editor.
- **React-MD Editor:** A powerful Markdown editor for community solution posts.
- **Resend:** Professional email API for handling account verification.
- **React Hook Form & Zod:** For efficient form management and strict data validation.

## Project Setup

### Getting Started

Follow these steps to set up the project on your local machine:

1. **Clone the Repository**
```bash
git clone https://github.com/Avijit200318/Uber-Clone.git
```
2. **Configure Firebase**
- Copy `.env.example` to `.env.local` and set the Firebase web-app values from Firebase Console → Project settings → General → Your apps.
- Set `GOOGLE_APPLICATION_CREDENTIALS` to the local path of a service-account JSON file. Never commit that file or expose its private key in client code or chat.
- In Firebase Console, enable Authentication → Sign-in method → Email/Password and create the Cloud Firestore **Native mode** `(default)` database in the intended region.
- To provision the first CodeArena administrator, find your account UID in Authentication → Users, then in Firestore update `users/{UID}` and set `userType` to the string `admin`. Do this only for trusted administrators; normal users cannot change this field through the app.
- Contest management uses the same `users/{UID}.userType` role. A project administrator may provision a trusted teacher by setting that field to `teacher` in Firestore. There is no self-service role promotion; only admins can manage contests outside their own ownership.
- The server-side Firebase Admin SDK bypasses Firestore rules. The app uses API routes for data access; the checked-in `firestore.rules` deny client writes and restrict direct reads. Deploy the rules and required composite indexes with `firebase deploy --only firestore`.
- Allow the app's local host and production domain in Authentication → Settings → Authorized domains.
- Use Node.js 22 or newer on Windows so the runner can use the Node permission model. The runner starts one restricted child process per case and does not inherit Firebase/Gemini credentials. This is not an OS sandbox: the child still runs as the application account, outbound network access is not blocked, and in-memory rate limits do not coordinate across server instances. Do not expose this runner to arbitrary public submissions.
- Optional AI chat uses the server-only `GEMINI_API_KEY`; without it, the chat API responds that AI chat is not configured.
3. **Install Dependencies**
```bash
npm install
```
4. **Run the Development Server**
```bash
npm run dev
```
In Windows PowerShell, check the Node version and start the app with:
```powershell
node --version
npm install
npm run dev
```
Use Node.js 22 or newer. The app will be accessible at http://localhost:3000. The Firebase web configuration and Admin service account must refer to the same project.

### Test the local runner

Run the focused runner suite in PowerShell:
```powershell
node --experimental-strip-types --test src/lib/javascriptRunner.test.mjs
```
The suite covers stdin/stdout, syntax and runtime errors, timeouts, output/input limits, filesystem/environment restrictions, grading normalization, rate limits, and concurrency limits. For a UI check, sign in, open a problem, enter JavaScript that reads `process.stdin` and writes to `console.log`, enter test input in the Test Result tab, then click **Run**. Run does not save a submission. **Submit** loads test inputs and expected outputs from Firestore on the server.

For example, this program adds two whitespace-separated numbers; enter `2 3` as stdin:
```js
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => input += chunk);
process.stdin.on("end", () => {
  const [a, b] = input.trim().split(/\s+/).map(Number);
  console.log(a + b);
});
```

To confirm API authentication enforcement while the dev server is running:
```powershell
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/code/run-code" `
    -ContentType "application/json" -Body "{}"
} catch {
  $_.Exception.Response.StatusCode.value__
}
```
Without a Firebase session cookie this should return `401`. Do not test public deployment with untrusted code; this local runner is not a secure public sandbox.

### Contests

Teachers and admins use **Contests** in the main navigation to create a draft, select existing problems, set start/end times, optionally require a join access code, and publish. Contest schedule input is local to the browser's displayed IANA timezone and stored as UTC instants. Students sign in, join before the contest ends, and submit from the linked problem workspace only during the published contest window. Contest submissions use the existing JavaScript runner and server-side test cases; scores are updated transactionally on first accepted solve per problem.

The repository does not include the referenced contest SRS, so the scoring policy is provisional: each uniquely accepted problem is worth 100 points; ties are broken by earlier time reaching that score, then earlier join time. The leaderboard is derived from server-maintained participant records and is capped at 500 displayed participants. Access codes are salted scrypt hashes and are never returned by APIs. Contest, participant, and contest submission data are accessed through server API routes using Firebase Admin; Firestore client rules remain deny-by-default, so no additional client rule or composite index is required.

## API Documentation
 For API documentation [**click here**](./src/app/api/readme.md)

## Usage

### For Users:

1. **Account Verification:** Sign up and verify your email through the link sent by **Resend**.
2. **Solve Problems:** Choose a challenge and write JavaScript in the **Monaco Editor**. JavaScript is the only supported execution language; use stdin in the Test Result panel or problem examples to provide input.
3. **Run & Submit:** Run executes against the custom stdin without saving a submission. Submit grades against server-side Firestore test cases, saves the submission, and updates solved progress only when all cases pass. The local child-process runner is only for development and trusted limited environments, not public untrusted code.
4. **Chat with CodeArena AI:** Get hints, clarify problem statements, or brainstorm logic when stuck.

### For Community & Sharing:

1. **Post Solutions:** Navigate to the solution tab and use the **Markdown Editor** (React-MD) to explain your approach with formatted code blocks and text.
2. **Track Growth:** View your profile to see the total count of problems solved and review your entire submission history.

## Contributing

Contributions are welcome! Whether you're fixing a bug, enhancing features, or suggesting improvements, feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.
