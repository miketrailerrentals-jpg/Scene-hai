# Scene Hai? ✳ — Complete Design Prototype
**Tagline:** Plan Kam, Scene Zyada!

This is a **working, mobile-first frontend demonstration** of the Scene Hai? social activity discovery application for Pakistani young adults. No builder logos or external UI libraries.

## Quick start

With Node.js installed:

```bash
npm run dev
```

Visit **http://localhost:5173**. For best results, use the local server rather than opening `index.html` as a `file://` URL, because some browsers restrict localStorage on file URLs.

No `npm install`, API keys, authentication or payment information are needed.

## Screens delivered

- **Discover:** Hero, categories, featured scene, upcoming activities, search and save.
- **Explore:** Search, category, city, date and free-only filters.
- **Scene detail:** Host info, timings, budget type, spots, safety guidance, share, join request.
- **Create:** Validated scene form, public/private selection, local draft publication.
- **My Scenes:** Going, hosting, and sample host join-request approvals.
- **Notifications:** Demo notifications and read/unread state.
- **Profile:** Editable display name, interests, saved scenes, statistics and links to safety & communities.
- **Friends & Groups:** Interest communities, sample connection requests and join/leave states.
- **Safety Centre:** Meetup guidelines, scene reports and hide-host controls (local demo only).
- **Chat:** Offline group conversation for a demo joined scene.

## Architecture and limitations

- Built with **HTML, CSS and plain JavaScript** for zero dependencies, fast preview and easy editing. All screens share one design system.
- All interactive changes save to **localStorage**, limited to a single browser/device. This is **not** a multiuser app or a backend.
- Photos are locally bundled **original SVG illustrations**. No remote image or image licensing dependencies.
- Demo city / scene data is fictional. Capacity, join requests, approvals, notifications and chat are simulations. Demo link sharing is for the layout only, and doesn't work as a public scene invitation without deployment and a database.
- App is designed for ages **18–35**; no university-only constraints.
- Safety/privacy rules are UI examples, **not** actual moderation, permissions or enforcement.

## Deliverable for AI Studio

See **AI_STUDIO_HANDOFF.md** for the verified GitHub import workflow and carefully scoped development prompts.

## Design tokens

| Role | Value |
|---|---|
| Warm canvas | `#fcfaf5` |
| Editorial ink | `#1f2140` |
| Social lime | `#d8fa65` |
| Coral highlight | `#ff7358` |
| Lavender hero | `#e8e2ff` |
| Card surfaces | `#ffffff` |
| Body font | DM Sans (falls back to Segoe UI) |
| Display font | Outfit (falls back to Segoe UI) |

All illustration SVGs live under `assets/`; they can be replaced later by real host-uploaded event images.
