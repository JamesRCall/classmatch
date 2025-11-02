# ClassMatch — CS 4090 (Group 10)

A minimal, runnable skeleton aligned to Assignment 1 (user stories/EPICs/MVP) and Assignment 2 (use cases & diagrams).
Tracks Week 1–3 deliverables.

## Team
- James Callender
- Parsa Hajiha
- Tri Le

## Project Description
ClassMatch helps students discover compatible classmates in the same courses and form study groups.

## Weeks & Deliverables
### Week 1
- Repo created; branching policy: `main` (protected) and `develop` (default for PRs).
- README included.

### Week 2
- Runnable base app with initial screens for MVP stories: Signup (#1), Login (#18), Matchmaking (#2), Create Group (#7), Dashboard (#20).
- Basic docs and initial commits.

### Week 3
- Refinements after internal review; finalized repo link.

## Scripts
```bash
# install and run web client
cd web
npm install
npm run dev
```

## Structure
```
.
├── README.md
├── CONTRIBUTING.md
├── docs/
│   ├── assignment-refs.md
│   ├── use-cases/           # A2: Use case IDs (stubs)
│   └── diagrams/            # Mermaid sources
├── web/                     # Runnable Vite + React app
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── routes.jsx
│       ├── lib/
│       │   └── api.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── Matches.jsx
│       │   ├── CreateGroup.jsx
│       │   └── Dashboard.jsx
│       └── components/
│           └── Nav.jsx
└── .gitignore
```
