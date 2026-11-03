# Scene Hai? ✳ — React Application
**Tagline:** Plan Kam, Scene Zyada!

This is the **React + TypeScript + Vite** application of Scene Hai? — the mobile-first social activity discovery and meetup platform with Firebase Authentication and Cloud Firestore synchronization.

## Features Delivered

- **Discover:** Hero banner with animated doodles, vibe categories, spotlight scene of the day, happening today feed, upcoming activities, search, and live cloud sync.
- **Explore:** Comprehensive search, category filter strip, time filter chips (Anytime, Today, Weekend, Free only), live refresh, and city filtering.
- **Scene Detail:** Cover imagery, local Asia/Karachi timing, estimated costs, spots remaining, safety notes, host controls (edit scene, cancel scene), guest/member actions (request to join, withdraw pending request, chat for approved participants, share link, report scene, hide host).
- **Create Scene:** Validated meetup creation form (title, vibe, city, neighborhood, date, time in future Asia/Karachi, capacity, estimated budget, description, landmarks, public/private toggle) saving live to Cloud Firestore.
- **My Scenes:** Three-tab manager for Joined, Hosted, and Incoming Join Requests. Allows hosts to review pending participant requests and manage hosted activities.
- **Scene Chat:** Group chat for approved attendees and host with local offline message persistence.
- **Community:** Interest-based groups (The Chai Circle, Turf After Hours, Build & Chill, Weekend Wanders) and crowd discovery with connection requests and share invitations.
- **Safety Centre:** Core meetup safety principles (public first meetups, respecting boundaries, protecting personal information, reporting & blocking).
- **Profile & Cloud Sync:** Firebase Google Sign-In, Cloud Firestore profile persistence (`users/{userId}`), editable display name, short bio, city & area, personal interests mix, saved scenes collection, and local-to-cloud migration assistant.

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Custom design system in `styles.css` using Outfit & DM Sans typography with warm canvas and vivid brand accents
- **Auth & Database:** Firebase Authentication (Google Sign-In) and Google Cloud Firestore
- **Assets:** Lightweight vector illustrations in `/assets/` and `/public/assets/`

## Running the App

```bash
npm run dev
```

The dev server runs on `http://0.0.0.0:3000`.

To build for production:

```bash
npm run build
```
