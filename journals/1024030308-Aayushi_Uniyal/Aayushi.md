# CodeArena – Firebase & Authentication README

## 1. Overview

This document covers the Firebase work completed for the **CodeArena** project.

### Firebase Responsibilities

- Firebase project creation and configuration
- Firebase Authentication
- Signup and Login
- Authentication state management
- Firestore database setup
- Storing and fetching user data
- Logout functionality
- Connecting Firebase with Next.js
- Environment variable configuration
- Troubleshooting Firebase-related errors

---

## 2. Firebase Files / Folders

The main Firebase-related files in the project are:

```text
/firebase
/src/app/auth
/src/atoms/authModalAtom.ts
/src/components/Modals/AuthModal.tsx
/src/app/providers.tsx
.env.local
```

### Purpose of important files

| File / Folder | Purpose |
|---|---|
| `/firebase` | Firebase configuration and Firebase-related code |
| `/src/app/auth` | Authentication-related pages/routes |
| `/src/atoms/authModalAtom.ts` | Authentication modal state |
| `/src/components/Modals/AuthModal.tsx` | Login/Signup UI |
| `/src/app/providers.tsx` | Application providers and authentication state |
| `.env.local` | Firebase environment variables |

---

# 3. Firebase Setup

## Step 1 – Create Firebase Project

1. Open the Firebase Console.
2. Create a Firebase project.
3. Add a Web App.
4. Copy the Firebase configuration values.
5. Add them to `.env.local`.

Example:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> Never upload `.env.local` or Firebase secret credentials to GitHub.

---

# 4. Firebase Authentication

Firebase Authentication is used for:

- User Signup
- User Login
- Maintaining the logged-in user state
- Logout

The authentication flow is:

```text
User
  ↓
Login / Signup Form
  ↓
Firebase Authentication
  ↓
Authenticated User
  ↓
Application Authentication State
  ↓
CodeArena
```

---

# 5. Signup Query / Logic

For email-password signup, Firebase Authentication can be used with:

```ts
createUserWithEmailAndPassword(auth, email, password)
```

Example:

```ts
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

await createUserWithEmailAndPassword(auth, email, password);
```

If additional user information is stored in Firestore, a document can also be created after successful signup.

Example:

```ts
await setDoc(doc(db, "users", user.uid), {
  uid: user.uid,
  email: user.email,
  createdAt: new Date(),
});
```

---

# 6. Login Query / Logic

For login:

```ts
signInWithEmailAndPassword(auth, email, password)
```

Example:

```ts
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

await signInWithEmailAndPassword(auth, email, password);
```

---

# 7. Logout Query / Logic

To log out the current user:

```ts
signOut(auth)
```

Example:

```ts
import { signOut } from "firebase/auth";

await signOut(auth);
```

After logout, the authentication state should update and protected user information should no longer be displayed.

---

# 8. Authentication State Query

Firebase provides `onAuthStateChanged()` to detect whether a user is logged in or logged out.

Example:

```ts
import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.uid);
  } else {
    console.log("No user logged in");
  }
});
```

This is useful for maintaining authentication state throughout the application.

---

# 9. Firestore Setup

Firestore is used to store user-related data.

Basic structure:

```text
users
 ├── userId1
 │    ├── uid
 │    ├── email
 │    └── createdAt
 │
 └── userId2
      ├── uid
      ├── email
      └── createdAt
```

Example initialization:

```ts
import { getFirestore } from "firebase/firestore";

const db = getFirestore(app);
```

---

# 10. Firestore Queries

## Add / Create User Data

```ts
setDoc(doc(db, "users", user.uid), {
  uid: user.uid,
  email: user.email,
});
```

## Get One User

```ts
const userRef = doc(db, "users", user.uid);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  console.log(userSnap.data());
}
```

## Get Multiple Users

```ts
const usersRef = collection(db, "users");
const snapshot = await getDocs(usersRef);

snapshot.forEach((doc) => {
  console.log(doc.id, doc.data());
});
```

## Query Users Using a Field

Example:

```ts
const q = query(
  collection(db, "users"),
  where("email", "==", email)
);

const snapshot = await getDocs(q);
```

---

# 11. Important Firebase Questions / Queries

### Q1. How do I connect Firebase to Next.js?

Install Firebase:

```bash
npm install firebase
```

Create the Firebase configuration file and initialize the Firebase app using environment variables.

---

### Q2. Where should Firebase credentials be stored?

Use:

```text
.env.local
```

Example:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

Do not hard-code credentials directly into components.

---

### Q3. How can another team member access the Firebase project?

The Firebase project owner can add another person's Google account through:

**Firebase Console → Project Settings → Users and permissions**

The other team member can then access the same Firebase project using the Google account that was granted permission.

---

### Q4. How can another team member run the project on their computer?

They need:

1. The CodeArena source code.
2. Node.js and npm installed.
3. Project dependencies installed:

```bash
npm install
```

4. A local `.env.local` file containing the required Firebase configuration.
5. Permission to the Firebase project if they need to access the Firebase Console.

Then start the project:

```bash
npm run dev
```

---

# 12. Common Firebase Errors and Fixes

## Error 1 – Firebase configuration is undefined

### Possible message

```text
Firebase: Error (auth/invalid-api-key)
```

### Cause

A Firebase environment variable is missing, incorrectly named, or not loaded.

### Fix

Check `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

After changing `.env.local`, restart the Next.js development server.

```bash
npm run dev
```

---

## Error 2 – `auth/invalid-credential`

### Cause

The email/password credentials are incorrect, or the authentication configuration is not correct.

### Fix

- Check the entered email.
- Check the password.
- Confirm Email/Password authentication is enabled in Firebase.
- Confirm the Firebase project is the correct project.

---

## Error 3 – `auth/email-already-in-use`

### Cause

The email address is already registered in Firebase Authentication.

### Fix

Use another email or log in with the existing account.

---

## Error 4 – `auth/weak-password`

### Cause

The password does not satisfy Firebase's password requirements.

### Fix

Use a stronger password and display a clear validation message to the user.

---

## Error 5 – `auth/user-not-found`

### Cause

No Firebase Authentication account exists for the entered email.

### Fix

Check the email address or create an account using Signup.

---

## Error 6 – Firestore `permission-denied`

### Cause

Firestore Security Rules are preventing the current user from reading or writing the requested document.

### Fix

Check:

**Firebase Console → Firestore Database → Rules**

Make sure the rules match the application's authentication and database requirements.

Example development rule:

```text
allow read, write: if request.auth != null;
```

> Use secure production rules instead of leaving broad development permissions enabled.

---

## Error 7 – `Missing or insufficient permissions`

### Cause

The current Firebase user does not have permission to access the Firestore document/collection.

### Fix

Check:

1. Is the user logged in?
2. Is `request.auth` available?
3. Does the document path match the Security Rules?
4. Are the Firestore rules published?

---

## Error 8 – Firebase works on one computer but not another

### Possible causes

- `.env.local` is missing.
- Environment variable names are different.
- The second computer is using a different Firebase project.
- Dependencies have not been installed.

### Fix

On the new computer:

```bash
npm install
```

Create `.env.local` with the same required Firebase configuration.

Then restart:

```bash
npm run dev
```

---

## Error 9 – Changes in `.env.local` are not working

### Cause

Next.js reads environment variables when the development server starts.

### Fix

Stop the server and restart it:

```bash
Ctrl + C
npm run dev
```

---

# 13. Firebase + Next.js Checklist

Before running the application, verify:

```text
[ ] Firebase project created
[ ] Web app added to Firebase
[ ] Authentication enabled
[ ] Email/Password provider enabled
[ ] Firestore Database created
[ ] Firebase configuration added
[ ] .env.local created
[ ] .env.local is not committed to Git
[ ] npm install completed
[ ] Development server restarted
[ ] Signup tested
[ ] Login tested
[ ] Logout tested
[ ] Firestore read/write tested
```

---

# 14. GitHub / Team Collaboration

Do not commit the local environment file:

```text
.env.local
```

Make sure it is included in `.gitignore`:

```gitignore
.env.local
```

Each team member should create their own local `.env.local` file.

The Firebase project itself can be shared with team members by giving them the required Firebase project permissions.

---

# 15. Debugging Process

When a Firebase feature is not working, follow this order:

```text
1. Check browser console
        ↓
2. Read the Firebase error code
        ↓
3. Check .env.local
        ↓
4. Check Firebase project
        ↓
5. Check Authentication settings
        ↓
6. Check Firestore Database
        ↓
7. Check Firestore Security Rules
        ↓
8. Restart Next.js
        ↓
9. Test Signup / Login again
```

---

# 16. Firebase Work Completed

The Firebase section of CodeArena includes:

- Created Firebase project
- Integrated Firebase with Next.js
- Implemented Firebase Authentication
- Implemented Signup/Login
- Configured environment variables
- Managed authentication state
- Set up Firestore
- Stored and fetched user data
- Implemented Logout
- Connected authentication with application components
- Troubleshot Firebase configuration and permission issues

---

## 17. Quick Commands

Install Firebase:

```bash
npm install firebase
```

Install project dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build project:

```bash
npm run build
```

---

## 18. Final Notes

Firebase Authentication handles **who the user is**, while Firestore handles **user/application data**.

```text
Firebase Authentication
        ↓
   User Login
        ↓
 Authentication State
        ↓
    Firestore
        ↓
   User Data
        ↓
     CodeArena
```

For team development, keep Firebase configuration consistent across the project, keep `.env.local` private, and verify Firebase Authentication and Firestore Rules whenever a permission-related error occurs.
