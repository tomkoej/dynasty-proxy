# Dynasty Watchlist — Changelog

This file tracks the *why* behind each version of `public/index.html`, complementing the commit history in this repo. Commit this alongside the corresponding code change so the reasoning stays attached to the codebase, not just to chat history.

Versions prior to v1.33 were built across earlier sessions and aren't itemized individually here; see "Foundational Build" at the bottom for a summary.

---

## v1.98 — Undrafted option in Draft Round / Overall Pick filters
Added an explicit "Undrafted" choice to both filters (only shown when a UDFA exists on the watchlist), since those two fields are legitimately empty for undrafted players and they were previously unreachable through those filters.

## v1.97 — Undrafted formatting aligned with drafted format
Undrafted line now reads `2023 Draft Class · Undrafted · Yr 4`, matching the same structure as drafted players instead of leading with "Undrafted."

## v1.94–v1.96 — Fixed undrafted detection
Root cause found: MFL sets `draft_year` even for UDFAs (their rookie season) but marks `draft_team: "FA"`. Detection was checking the wrong field. Fixed to key off `draft_team === "FA"`.

## v1.93 — Overall pick number + 4 new filters
Added computed overall pick (`(round-1)*32+pick`, an approximation since real round sizes vary with comp picks) to the draft line. Added Draft Class, Draft Round, Overall Pick, and Years in NFL filters, all multi-select, populated dynamically from the current watchlist.

## v1.91–v1.92 — Jersey pill reshaped to rounded square
Changed from pill shape to a 29×29 rounded square sized to visually sit between the name row and the draft-meta row below it. Draft line wording updated to "Draft Class" and "ROOKIE" in place of "Yr 1".

## v1.88–v1.90 — Draft year/round/pick/experience added
New `draft-meta` line under each player's name: draft year, round/pick, and computed years of NFL experience (derived from draft year since MFL doesn't expose this directly). Handles undrafted/missing data gracefully.

## v1.86 — Next Game pill
Shows each player's next scheduled game: `Wk7 Sun 1:00 PM vs DAL`. Home/away (`vs`/`@`) pulled from MFL's `isHome` flag. Reuses the same `nflSchedule` fetch as bye weeks — one API call powers both features.

## v1.84–v1.85 — Bye weeks
Derived bye weeks per team from MFL's `nflSchedule` endpoint (no dedicated bye-week field exists; computed by finding which teams are absent from each week's matchups). Cache is keyed to the current season year so it self-updates every year with no code changes. Bye Week filter added.

## v1.77–v1.83 — Jersey number pills
Added team-colored jersey number badges (three brand colors per team: fill, border, number). Required `DETAILS=1` on the MFL players API call to get jersey numbers at all. Several rounds of NFL team color mapping fixes for MFL's non-standard team codes (`KCC`, `LVR`, `GBP`, etc.).

## v1.73–v1.76 — Fixed "My Team" filter undercounting
Root cause: the nWo league's `MY_TEAM_MATCH` entry had an extra `(nWo)` suffix added purely for display purposes, which broke the franchise name match against MFL's actual data (just "The Undertaker"). Fixed.

## v1.66–v1.72 — Background/theme iteration
User reverted an attempted sky-gradient background experiment back to solid dark/light backgrounds. Reworked Trade Block / My Trade Block colors to violet/amber for better contrast in light mode. Added and tuned film grain texture. Fixed a bug where the Expand toggle and Dark/Light toggle were sharing the same text-selector target.

## v1.64–v1.65 — File corruption incident and recovery
A Python string-slicing bug during a gradient-background edit truncated the live file to 3.5KB (an unguarded `.find()` returning `-1` was used directly in a slice). File had to be reconstructed from the last known-good deployed version, pasted back in by the user. **Lesson: this is the direct motivation for this changelog and the git-backup conversation.**

## v1.52–v1.63 — League renumbering, theming, layout polish
League display order changed to match user's preferred grouping. Major CSS Grid rework of the per-league status icon row. Day/Night theme toggle introduced. Emoji removed app-wide per user preference.

## v1.42–v1.51 — Trade Block / My Trade Block system
Introduced trade-block detection via MFL's `tradeBait` API, including a teal/orange ring system on player status icons distinguishing "on trade block" from "I've listed this player."

## v1.33–v1.41 — Status filter highlighting, refresh button, rate-limit compliance
Status filter now highlights matching rows in the expanded owner view. Added a manual refresh button with abuse warnings, and brought refresh timing in line with MFL's API guidelines (1s spacing between league calls, 30min cooldown).

---

## Foundational Build (v1.1–v1.32, earlier sessions)
Initial build of the dynasty fantasy football watchlist: Vercel proxy for MFL API calls, league configuration for 6 leagues (mixed SF and SF/TE+ formats, including a 2-roster-spot "nWo" league), player pool caching, watchlist add/remove with undo/redo and history, custom multi-select filter system, and the core dark-mode UI. Full detail lives in the session transcripts referenced in `/mnt/transcripts/journal.txt` if needed.

---

## Process notes for future sessions
- Every deploy should pass a JS syntax check (`node --check`) before being handed off — this is now standard practice after the v1.64 incident.
- Large multi-block edits are done via `str_replace` (which fails loudly if the target text isn't found exactly once) rather than manual string slicing, for the same reason.
- When debugging live data issues (API field names, filter logic, matching bugs), the fastest reliable path has consistently been adding a temporary diagnostic line to the in-app debug ticker, having the user paste back the output, then removing the diagnostic once resolved — rather than guessing at MFL's data shape from memory.
