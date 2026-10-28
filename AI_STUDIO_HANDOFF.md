# Scene Hai? — Google AI Studio handoff

## Import this actual project (no giant generation prompt)

Google AI Studio Build mode supports **Import from GitHub** (Google official documentation: https://ai.google.dev/gemini-api/docs/aistudio-build-mode).

1. Unzip `scene-hai-design.zip`.
2. Create a new GitHub repository (private is fine), and upload the project files to its root. **Do not upload the zip alone.**
3. Open https://aistudio.google.com/apps in **Build** mode.
4. At the prompt field, click **+ / Add files → Import from GitHub**.
5. Select your repository. Once imported, **preview the existing app before requesting any changes**.
6. If AI Studio offers GitHub two-way sync, keep it enabled to avoid copying files back and forth.

This package is built in dependency-free HTML/CSS/JavaScript, not React. Google AI Studio supports developing web apps with Node.js; if conversion to React is desired, request a faithful migration without changing screens or styling. Avoid asking it to create a new design.

## First prompt: preserve and run

> This repository is the approved Scene Hai? UI/UX reference implementation. First inspect the existing files and run the application. Do NOT redesign any screen, replace colors, change the typography, add new design libraries, or invent missing features. Preserve the current UI, copy and navigation. Explain how the app is structured and confirm which behaviors are demo-only/localStorage. Show the live preview and fix only errors blocking it.

## Second prompt, when ready for backend (not together with first)

> Add Firebase Authentication using Google Sign-In to this **existing Scene Hai? app** while keeping the approved visual design identical. Use a clean authentication service boundary. Users should be able to sign in and sign out. Do not migrate scene creation, joins, or chats yet. Keep existing demo data but clearly distinguish it from authenticated user data. Never embed credentials in client code. Explain the Firebase setup, security rules and changes before implementing other features.

## Third prompt, only after auth is confirmed

> Add Firestore persistence for scene creation and discovery without changing the approved UI. Define a normalized scene schema, indexes, owner authorization and suitable Firestore security rules. Replace localStorage persistence for scene data with Firestore. Seed demo records in a controlled development environment only; do not present them as real public scenes. Validate create/read/update/delete permissions and loading/error/empty states. Do not implement chat or notifications in this step.

## Then progress in this order

1. Auth (Google sign-in, profiles, authorization)
2. Scene collection CRUD with Firestore
3. Join request / approval transaction logic and capacity safeguards
4. Real-time participant chat, with access restricted to approved members
5. Notifications and moderation/report/block workflow
6. Location search + privacy-safe place lookup; optional maps
7. Admin, analytics, performance, accessibility and deployment

## Important design and trust rules

- **No AI-builder branding** in the app.
- Maintain mobile-first and desktop-responsive layouts.
- Keep public profiles limited; never expose raw phone numbers or exact meetup details before approval.
- Do not let client-side state masquerade as a server-enforced permission.
- Scene capacity and approvals must be atomic server-side operations.
- Require actual evidence before displaying "verified host", "live", "filling fast" or participant counts publicly.
- Do not upload sensitive credentials to GitHub.
