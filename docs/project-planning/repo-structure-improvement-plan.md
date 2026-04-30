# Repository Structure Improvement Plan

## Why This Was Done

This document records the structural clean-up applied to the UhelpU repo before course submission.
The goal was to satisfy the marking criterion *"Is your repo clearly organised?"* by ensuring:
- All documentation lives in one place (`docs/`)
- No unrelated files pollute the repo
- Naming is consistent across folders
- No backup/duplicate files in production paths

---

## Changes Made

### Critical Fixes

| Change | Reason |
|--------|--------|
| Deleted `test/Kraken_...` website dump (200+ files, ~3 MB) | Completely unrelated external website accidentally saved to repo |
| Moved `assets/audio/bgm/ncm2mp3_20260325.zip` → `readytodelete/` | 96 MB source archive should never be in a deployed project |
| Renamed `assets/audio/bgm/23.exe,初音ミク - CHO-DARI-.mp3` → `cho-dari-hatsune-miku.mp3` | Filename contained `.exe` and comma — misleading and shell-unsafe |

### Documentation Reorganisation

All `.md` documentation files were moved from the repo root and scattered subsystem folders
into a unified `docs/` directory:

```
docs/
├── systems/       ← 12 system documentation files (previously scattered at root + js/tutorial-system/)
├── design/        ← architecture/feature reference docs (previously in prompt/)
└── archive/       ← old version docs and UML diagrams (previously in old-document/)
```

### Code Organisation

| Change | Reason |
|--------|--------|
| Renamed `js/achievement system/` → `js/achievement-system/` | Folder name with space breaks shell tooling; all other subsystems use kebab-case |
| Updated imports in 4 files (`Level2.js`, `Level4.js`, `Level5.js`, `StaticPageAchieves.js`) | Required after folder rename |
| Moved 4 `*_backup.js` files → `readytodelete/` | Backup files should not exist in production; git history preserves old versions |
| Moved `claud-suggestion/` → `readytodelete/` | Auto-generated Claude Code planning artifacts, not project source |

### Asset Clean-up

| Change | Reason |
|--------|--------|
| Moved 3 duplicate `menu copy*.png` → `readytodelete/` | Only one `menu.png` needed; copies were manual duplicates |
| Moved 6 duplicate `phantom_prompt_* copy*.txt` → `readytodelete/` | 3 EN + 3 ZH copies kept alongside originals |
| Deleted empty `assets/sounds/` folder | Completely empty; purpose duplicated by `assets/audio/` |

### Configuration

| Change | Reason |
|--------|--------|
| Updated `.gitignore` | Added `readytodelete/`, `.DS_Store`, `Thumbs.db`, `*.log` — previously had only 1 entry |

---

## readytodelete/ Folder

Files in `readytodelete/` are gitignored and staged for permanent deletion after verification.
They are kept locally in case anything needs to be recovered before final submission.

---

## Verification Checklist

- [ ] `index.html` loads in browser without errors
- [ ] `js/achievement-system/` imports resolve (check browser console)
- [ ] `test/` contains only the 4 legitimate HTML test checklists
- [ ] `docs/` contains all 12 system documentation files
- [ ] Repo root contains only `README.md` (no other `.md` files)
- [ ] `find . -name "*backup*" -not -path "./readytodelete/*"` returns nothing
- [ ] `find . -path "*/achievement system/*"` returns nothing
