# JLPT N2 Japanese Mastery Studio

Enterprise Japanese N2 Learning Web Application built with **Next.js 16 (App Router)** and **Clean Architecture**.

## Architecture Overview

The codebase is structured according to Clean Architecture and Domain-Driven Design principles:

```text
src/
├── app/                           # Next.js App Router
│   ├── api/users/route.js         # API Route Handler (/api/users)
│   ├── layout.jsx                 # Global root layout & SEO metadata
│   ├── page.jsx                   # Main Client Component orchestrator
│   └── globals.css                # Global Tailwind CSS styles & animations
│
├── features/                      # Domain Feature Modules
│   ├── auth/                      # Authentication & session management
│   │   ├── components/AuthPage.jsx
│   │   ├── hooks/useAuth.js
│   │   └── services/auth.service.js
│   ├── grammar/                   # 235 JLPT N2 Grammar (Bunpou) Patterns
│   │   ├── components/GrammarWorkspace.jsx
│   │   └── hooks/useGrammar.js
│   ├── vocab/                     # 1,550+ Core & Mazii Vocabulary Words
│   │   ├── components/VocabWorkspace.jsx
│   │   └── hooks/useVocab.js
│   ├── kanji/                     # 380+ JLPT N2 Kanji with Readings & Compounds
│   │   ├── components/KanjiWorkspace.jsx
│   │   └── hooks/useKanji.js
│   ├── favorites/                 # Unified Cross-Module Favorites
│   │   ├── components/FavoritesWorkspace.jsx
│   │   └── hooks/useFavorites.js
│   └── study/                     # Study State, Ratings & Cloud Sync
│       ├── hooks/useStudyState.js
│       └── services/study.service.js
│
├── components/                    # Reusable UI & Layout Components
│   ├── ui/
│   │   ├── Flashcard.jsx          # 3D Flip Flashcard with smooth animation
│   │   ├── RatingControls.jsx     # Status rate & navigation controls (Hotkeys 1 & 2)
│   │   ├── StatusBadge.jsx        # State indicators (Mastered, Need Review, New)
│   │   ├── FilterBar.jsx          # Filter chips (All, Belum Ingat, Dikuasai, ★ Favorit)
│   │   ├── Pagination.jsx         # Accessible pagination control
│   │   ├── EmptyState.jsx         # Clean empty state display
│   │   └── Toast.jsx              # Floating feedback notification
│   └── layout/
│       ├── Header.jsx             # Top bar with stats & toggles
│       ├── Sidebar.jsx            # Desktop collapsible navigation
│       ├── MobileNav.jsx          # Native mobile bottom navigation bar
│       └── MobileDrawer.jsx       # Quick settings drawer
│
├── services/                      # Core Infrastructure Services
│   ├── database/
│   │   └── db.service.js          # Multi-tenant table manager & Edge Config mirror
│   └── speech/
│       └── speech.service.js      # Natural SpeechSynthesis (JA, ID, EN)
│
├── lib/                           # Shared Libraries & Internationalization
│   ├── i18n/
│   │   ├── translations.js        # Bilingual dictionary (EN & ID)
│   │   └── useTranslation.js      # Translation hook
│   └── utils.js                   # Class merging & text sanitizers
│
├── data/                          # Learning Datasets
│   ├── cards.js                   # Grammar dataset
│   ├── vocab.js                   # Vocabulary dataset
│   ├── kanji.js                   # Kanji dataset
│   └── mazii.js                   # Mazii dataset
│
└── database/                      # Multi-Tenant Table Storage (JSON)
    ├── users.json                 # User accounts & SHA-256 credentials
    ├── user_states.json           # User ratings & mastery state
    └── favorites.json             # Starred favorites partitioned per user
```

## Features

- **Multi-Tenant State Isolation**: Each user's data is strictly partitioned. User A can never see or mutate User B's state.
- **Cross-Device Persistence**: Smart Delta Merging ensures updates to individual cards never wipe other cards, even during page refresh or Incognito access.
- **Dual Speech Engine**: Native text-to-speech for Japanese (`ja-JP`) and meaning translations in Indonesian (`id-ID`) or English (`en-US`).
- **Auto Play Mode**: Hands-free sequential playback with audio pronunciation and automated card flipping.
- **Bilingual Interface**: Seamless instant toggling between Indonesian (ID) and English (EN).
- **Responsive & Dark Mode**: Mobile-first design with bottom navigation bar and full theme support.

## Getting Started

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Automated Tests
```bash
npm test
```
