# Garden Planner Web App - Project Roadmap

## Project Overview

A web application for managing a square foot garden using 3 raised beds (4x4 each = 48 total square feet). The app tells users what to plant and when, manages plant care, and dynamically updates schedules based on seed inventory and location/season.

## User Requirements

- **Multi-Device Access**: Web app accessible from desktop, laptop, and phone
- **Square Foot Method**: 3 raised beds, 4x4 feet each (16 squares per bed)
- **Seed Inventory Management**: Add/remove seeds, track quantities
- **Dynamic Scheduling**: Automatically generate planting schedules based on:
  - Current seed inventory
  - Time of year
  - Garden location (frost dates, climate zone)
- **Plant Care Guidance**: Instructions for germination, spacing, watering, etc.

## Existing Data Assets

Located in Google Drive (`~/Library/CloudStorage/GoogleDrive-ryanthomaseasley@gmail.com/My Drive/gardening/`):

| File | Description |
|------|-------------|
| `seed_database_complete.csv` | 27 seed varieties with full planting data (spacing, depth, sun, germination instructions, days to emerge, etc.) |
| `planting_schedule_2026.csv` | 6-phase schedule (indoor starts, early outdoor, post-frost, warm season, succession, fall) |
| `box_layout_plan.csv` | Square foot assignments for all 3 boxes (A1-D4 grid per box) |

---

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer (upgrade to Zustand if needed)
- **Backend/Database**: Supabase (PostgreSQL + Auth + Real-time sync)
- **Hosting**: Vercel (free tier, auto-deploys from GitHub)
- **Build Tool**: Vite
- **Date Handling**: date-fns
- **Mobile**: Progressive Web App (PWA) - installable on phone home screen

### Why This Stack for Multi-Device?

| Concern | Solution |
|---------|----------|
| Data sync across devices | Supabase real-time database |
| User identity | Supabase Auth (email/password or magic link) |
| Access from phone | PWA + responsive Tailwind design |
| Free hosting | Vercel free tier (unlimited for personal projects) |
| Offline support | Service worker + local cache, syncs when online |

---

## Phase 1: Project Setup & Data Foundation

### 1.1 Initialize Project
- [x] Set up Vite + React + TypeScript
- [x] Configure Tailwind CSS
- [x] Set up folder structure (`/components`, `/hooks`, `/data`, `/types`, `/utils`)
- [x] Create TypeScript interfaces for all data models
- [ ] Initialize Git repo, push to GitHub

### 1.2 Backend & Auth Setup
- [ ] Create Supabase project (free tier)
- [ ] Set up database tables (seeds, inventory, beds, tasks, user_settings)
- [ ] Configure Supabase Auth (email/magic link)
- [ ] Create Row Level Security policies (users see only their data)
- [x] Set up Supabase client in React app

### 1.3 Deployment Pipeline
- [ ] Connect GitHub repo to Vercel
- [ ] Configure environment variables (Supabase keys)
- [ ] Set up auto-deploy on push to main
- [ ] Test deployment works

### 1.4 Data Models
```typescript
interface Seed {
  id: string;
  commonName: string;
  genusSpecies: string;
  cultivar: string;
  type: 'flower' | 'herb' | 'vegetable';
  lifecycle: 'annual' | 'biennial' | 'perennial';
  daysToEmerge: string;
  sun: string;
  spacing: string;
  seedQuantityPerSpace: number;
  depth: string;
  sowTimeOutside: string;
  insideStartTime: string;
  growHeight: string;
  growWidth: string;
  germinationInstructions: string;
  animalResistance: string;
  bloom: string;
}

interface InventoryItem {
  seedId: string;
  quantityMg: number;
  dateAdded: Date;
  notes?: string;
}

interface GardenLocation {
  zipCode: string;
  hardinessZone: string;
  lastFrostDate: Date;
  firstFrostDate: Date;
}

interface PlantingTask {
  id: string;
  seedId: string;
  action: 'start indoors' | 'direct sow' | 'transplant' | 'succession sow';
  dateRange: { start: Date; end: Date };
  location: string;
  squareFeet: number;
  notes: string;
  completed: boolean;
}

interface BedSquare {
  bed: 1 | 2 | 3;
  position: string; // A1, A2, ... D4
  plantedSeedId?: string;
  plantedDate?: Date;
  status: 'empty' | 'planted' | 'growing' | 'harvesting' | 'done';
}
```

### 1.5 Import Existing Data
- [ ] Create CSV parser utility
- [x] Import seed database as base seed catalog (27 varieties in seedCatalog.ts)
- [ ] Import box layout as default bed configuration
- [ ] Convert planting schedule logic into reusable rules

### 1.6 PWA Setup (Mobile Install)
- [ ] Configure Vite PWA plugin
- [ ] Create app manifest (icon, name, theme color)
- [ ] Set up service worker for offline caching
- [ ] Test "Add to Home Screen" on phone

---

## Phase 2: Core Features

### 2.1 Seed Inventory Management
- [ ] Seed inventory list view (sortable, filterable)
- [ ] Add seed to inventory form
  - Select from catalog or add custom
  - Quantity in mg or packet count
  - Purchase date, notes
- [ ] Edit/delete inventory items
- [ ] Low inventory warnings
- [ ] Seed detail view (all planting info, instructions)

### 2.2 Garden Location Setup
- [ ] Location configuration screen
- [ ] Zip code input with frost date lookup (or manual entry)
- [ ] Hardiness zone display
- [ ] Calculate all date-relative planting windows from frost dates

### 2.3 Bed Visualization
- [ ] Visual 4x4 grid for each bed
- [ ] Color-coded squares by status (empty, planted, ready to harvest)
- [ ] Click square to see what's planted / assign plant
- [ ] Bed overview showing all 3 beds

---

## Phase 3: Smart Scheduling

### 3.1 Planting Schedule Generator
- [ ] Calculate planting windows based on:
  - Seed's `sowTimeOutside` and `insideStartTime` relative to frost dates
  - Current date
  - Available inventory
- [ ] Generate task list: "Start tomatoes indoors by [date]"
- [ ] Handle succession planting (recurring tasks)

### 3.2 Dashboard / "What to Do Now"
- [ ] Show current and upcoming tasks (next 2 weeks)
- [ ] Overdue task warnings
- [ ] Quick actions: "Mark as done", "Skip", "Snooze"
- [ ] Season-aware welcome message

### 3.3 Dynamic Schedule Updates
- [ ] When new seed is added to inventory:
  - Check if it's plantable this season
  - Suggest optimal planting window
  - Recommend bed placement based on spacing/companions
- [ ] Recalculate schedule when location changes

---

## Phase 4: Plant Care & Guidance

### 4.1 Care Instructions
- [ ] Per-plant care cards with:
  - Germination instructions
  - Watering needs
  - Sun requirements
  - Spacing reminders
  - Harvest timing
- [ ] Link care info to planted squares

### 4.2 Notifications / Reminders (Future)
- [ ] Optional browser notifications for upcoming tasks
- [ ] Email digest option (requires backend)

---

## Phase 5: Polish & Enhancements

### 5.1 UI/UX Improvements
- [ ] Mobile-responsive design
- [ ] Dark mode
- [ ] Print-friendly schedule view
- [ ] Keyboard shortcuts

### 5.2 Advanced Features (Future)
- [ ] Companion planting suggestions
- [ ] Crop rotation tracking year-over-year
- [ ] Weather API integration
- [ ] Photo journal for each square
- [ ] Seed packet barcode scanning

---

## Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │              SUPABASE                    │
                    │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
                    │  │ Auth    │  │PostgreSQL│  │Realtime │ │
                    │  └─────────┘  └─────────┘  └─────────┘ │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────┴─────┐     ┌─────┴─────┐     ┌─────┴─────┐
              │  Desktop  │     │  Laptop   │     │   Phone   │
              │  Browser  │     │  Browser  │     │    PWA    │
              └───────────┘     └───────────┘     └───────────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                              ┌────────┴────────┐
                              │   Vercel CDN    │
                              │  (React App)    │
                              └─────────────────┘
```

## Data Flow

```
[Seed Catalog] (Supabase - shared reference data)
       │
       ▼
[User Inventory] ──▶ [Schedule Generator] ──▶ [Task List]
       │                     ▲                      │
       ▼                     │                      ▼
[Garden Location] ───────────┘              [Dashboard View]
       │                                          │
       ▼                                          ▼
[Frost Dates] ────▶ [Date Calculations]    [Bed Visualizer]

All user data syncs via Supabase across devices in real-time
```

---

## File Structure

```
garden-planner/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── SignUp.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── beds/
│   │   │   ├── BedGrid.tsx
│   │   │   ├── BedSquare.tsx
│   │   │   └── BedOverview.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryList.tsx
│   │   │   ├── AddSeedForm.tsx
│   │   │   └── SeedDetail.tsx
│   │   ├── schedule/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── Calendar.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Navigation.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── useInventory.ts
│   │   ├── useSchedule.ts
│   │   ├── useLocation.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   └── supabase.ts          # Supabase client config
│   ├── data/
│   │   ├── seedCatalog.ts
│   │   └── defaultBedLayouts.ts
│   ├── utils/
│   │   ├── dateCalculations.ts
│   │   ├── scheduleGenerator.ts
│   │   └── csvParser.ts
│   ├── types/
│   │   └── index.ts
│   ├── context/
│   │   ├── GardenContext.tsx
│   │   └── AuthContext.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # App icons for PWA
├── supabase/
│   └── migrations/              # Database schema migrations
├── .env.local                   # Supabase keys (not committed)
├── ROADMAP.md
├── package.json
└── vercel.json                  # Vercel config
```

---

## MVP Milestones

| Milestone | Features | Target |
|-----------|----------|--------|
| **M1** | Project setup, data models, seed catalog imported | - |
| **M2** | Inventory management (add/view/edit seeds) | - |
| **M3** | Location setup + frost date calculations | - |
| **M4** | Bed visualization (3 beds, click to view) | - |
| **M5** | Basic schedule generation + dashboard | - |
| **M6** | Dynamic updates when adding new seeds | - |

---

## Questions to Resolve

1. **Location Data**: What's your garden's zip code? (needed for frost date calculations)
2. **Seed Quantities**: Your CSV has `seedInventoryMg` - should we track by mg, packet count, or both?
3. **Multi-year Tracking**: Should we track perennials/biennials across seasons?
4. **Auth Method**: Email/password, magic link (passwordless), or both?

---

## Session Recovery Notes

*Use this section to note where we left off each session:*

- **2026-05-17**: Created initial roadmap. Updated to web-based architecture with Supabase + Vercel for multi-device access. Project has `package.json` only. Ready to start Phase 1.1 (project initialization).

- **2026-05-17 (Session 2)**: Completed Phase 1.1 setup:
  - Initialized Vite + React + TypeScript project
  - Configured Tailwind CSS v3
  - Created folder structure (components, hooks, lib, data, utils, types, context)
  - Created TypeScript types for Seed, InventoryItem, GardenLocation, PlantingTask, BedSquare
  - Imported all 27 seed varieties from CSV into seedCatalog.ts
  - Created Supabase client config (ready for credentials)
  - Built basic App with dashboard, beds view, inventory list, and schedule placeholder
  - Project builds successfully!

  Completed Phase 1.2 & 1.3:
  - Created Supabase project with PostgreSQL database
  - Set up 5 tables: seed_catalog, inventory, garden_locations, bed_squares, planting_tasks
  - Configured Row Level Security policies for user data isolation
  - Imported all 27 seed varieties to Supabase
  - Pushed to GitHub: https://github.com/RTEasy/garden-planner
  - Deployed to Vercel: https://garden-planner-three-delta.vercel.app

  **Project location**: `~/Library/CloudStorage/GoogleDrive-ryanthomaseasley@gmail.com/My Drive/gardening/garden-planner/`

---

## Next Steps

1. ~~Initialize Vite + React + TypeScript project~~ DONE
2. ~~Set up Tailwind CSS~~ DONE
3. ~~Initialize Git repo and push to GitHub~~ DONE
4. ~~Create Supabase project and configure database~~ DONE
5. ~~Connect to Vercel for deployment~~ DONE
6. Set up PWA for phone access
7. ~~Create TypeScript type definitions~~ DONE
8. ~~Import seed catalog data~~ DONE
9. Add user authentication (sign up / login)
10. Build inventory management (add seeds to your collection)
11. Set up garden location with frost dates
