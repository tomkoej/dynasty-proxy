Dynasty Watchlist — Changelog
This file tracks the why behind each version of public/index.html, complementing the commit history in this repo. Commit this alongside the corresponding code change so the reasoning stays attached to the codebase, not just to chat history.

Versions prior to v1.33 were built across earlier sessions and aren't itemized individually here; see "Foundational Build" at the bottom for a summary.


## v2.60
**Added:** a visible warning badge on any player card whose name doesn't resolve to a live MFL player (typo, or MFL hasn't updated the record yet). Previously this failed silently — the player would just show with no team, age, or draft data and no indication why, which is how a spelling mismatch went unnoticed for a while before. Guarded against a false-positive flash on every page load while the player pool is still fetching.

## v2.59
**Fixed:** the "pool updated [time]" text was reading from `mflPoolTimeV2`, a cache key left behind from before the player pool cache was bumped to V3. Since nothing writes to V2 anymore, the displayed timestamp always silently fell back to "right now" instead of the true cache age. Now correctly reads V3. Audited every other localStorage key in the app for the same read/write mismatch pattern — this was the only one.

## v2.58
**Changed:** exported backup files no longer include a full watchlist snapshot inside every history entry — just date and description. History was previously 90%+ of a typical export's file size for no functional benefit (Import never read those snapshots). ~73% smaller files, same complete audit trail.

## v2.57
**Changed:** moved History into the Account & Data collapsible section (previously the only header button left outside it). Fixed a visible empty-row gap between the roster-refresh and export-status lines, caused by `#refresh-warning` reserving space even when empty. Removed now-orphaned `#header-right` CSS.

## v2.56
**Changed:** renamed the app to "Dynasty Dashboard." Restructured the header down to just title, tagline, and a collapsed "Account & Data" section holding everything else (API Keys, Undo/Redo, Export/Import, refresh + backup status) — badge shows on the collapsed header when something needs attention. Combined the two-line export status (timestamp + separate nudge) into one line with a status dot (grey/amber/green), fixing a case where the two lines could show contradictory info for pre-v2.55 backups. Subtitle became a tagline ("Tracking N players (position breakdown) across 6 leagues"), kept the position breakdown.

## v2.55
**Added:** MFL API keys are now included in Export/Import. Import merges keys in (imported values win per-league, nothing else touched) rather than replacing wholesale, and auto-triggers a roster refresh if any keys came in — same behavior as linking an MFL login. Added a "stale backup" nudge showing when the watchlist has changed since the last export, or the last export is 7+ days old. Centralized all 6 places that wrote the watchlist to storage into one `saveWatchlist()` helper so this tracking can't be missed at any of them.

## v2.54
**Added:** Import button — restores watchlist (and, from v2.55 on, API keys) from a previously exported backup file. Validates the file, filters out malformed entries, confirms before replacing anything, and the replacement is undo-able.
**Removed:** `DEFAULT_WATCHLIST` and the "Reset to Defaults" button entirely, now that Export/Import exists as the real backup mechanism. A one-time migration in v2.53 had already moved the then-current list into real storage before this removal shipped, so no data was lost.

## v2.53
**Added:** position breakdown in the subtitle (e.g. "4 QB · 9 RB · 12 WR · 6 TE"). One-time migration to persist the watchlist to real storage (see v2.54 note).
**Fixed:** root cause of the watchlist data-loss incident — `DEFAULT_WATCHLIST` had been silently acting as a permanent fallback that was never actually being saved to storage.

## v2.52
**Fixed:** export filenames now include local time, not just date, so multiple exports on the same day don't overwrite each other.

## v2.51
**Fixed:** exported watchlist order now matches whatever filter/sort was active on screen at export time, instead of raw storage order — extracted the shared filtering/sorting logic into `getVisibleRows()` so the on-screen list and the export can never drift apart. Export also now includes the complete unfiltered list alongside the filtered view, so an active filter can't cause a backup to silently drop players. Export timestamp switched from raw ISO format to a readable one.

## v2.50
**Added:** Export button — downloads the current watchlist and history as a JSON backup file.

## v2.49
**Fixed:** recovered the original watchlist (29 players, traced back to the message that first seeded it at project start) plus two players confirmed from screenshots (Trevor Lawrence, De'Von Achane), replacing a placeholder list that had been showing after a browser data clear wiped local storage.

## v2.48
**Changed:** Filter & Sort restructured — Players/Position/Status/League/Sort stay always visible; the other 9 filters (NFL Team, Format, Bye Week, College, Draft Class, Draft Round, Overall Pick, Years in NFL, Age) collapse behind a "More filters" toggle with a count badge showing how many are active.

## v2.47
**Changed:** swapped card order in the Status/Teams panel — Teams now shows first.

## v2.46
**Changed:** Status legend and Teams key restructured into a collapsible two-panel card layout, collapsed by default. Expand All/Collapse All stays visible outside the collapsible section since it's a functional control, not reference material.

## v2.45
**Changed:** simplified the Draft Slot legend — UDFA now reads "Undrafted Free Agent," N/A reads "Draft Data Unavailable."

## v2.44
**Changed:** UDFA legend entry expanded to explain what it means (superseded by the simpler wording in v2.45).

## v2.43
**Changed:** Draft Slot legend key updated — sample tag changed to "1.01," added descriptor rows for UDFA and N/A so the key is actually instructive instead of just showing one example pill.

## v2.30–v2.42
**Changed:** expanded-view column width and inter-column gap tuning across many small iterative passes. Widened the expanded-view text columns (previously cramped, sized off the icon grid's 44px columns) — discovered partway through that an attempt using `minmax(...,1fr)` was silently always filling to the full container width regardless of the specified minimum, so switched to a genuinely fixed pixel width instead. Several further rounds of percentage-based width/gap adjustments, landing on a 343px text column, 120px first column, and 2.8px gap between icon/draft-slot columns. Added "Expand All"/"Collapse All" wording to the expand-toggle labels. Expanded view now shows the actual franchise name for "My Team" status instead of the generic phrase.
**Fixed:** the nWo league (64818) was pulling in pre-2024 MFL draft history that predated when it was actually taken over, incorrectly showing real draft picks as UDFA. Added `minYear:2024` to its config and bumped the draft-results cache key to invalidate the bad cached data.

## v1.99–v2.29 — Reconstructed, lower confidence
**Note:** this range happened in the prior chat session, before a new session picked up the project at v2.29. Unlike everything above, this section is pieced together from a search of that old conversation rather than direct visibility into every change, so treat version numbers and boundaries here as approximate rather than exact.

**Draft slot pill ambiguity fixed.** The compact per-player status/draft-slot grid relied purely on column position to convey which league each pill belonged to, with no explicit label — easy to misread. Resolved by prefixing each draft pill with its league number (matching the `[N]` bracket convention already used everywhere else in the app — league key, status filter, expanded owner lines), and also adding draft slot info into the expanded view's per-league lines so every card has an unambiguous cross-check.

**Debug ticker collapse toggle (~v2.12).** The bottom diagnostic ribbon had accumulated enough temporary debug lines over the session that it was wrapping to multiple rows and eating vertical space meant for the player list. Added a collapse/expand toggle button that persists its state across reloads.

**General polish through v2.29.** Continued iterative refinement of the status icon grid, draft metadata display, and filter system building on the v1.33–v1.98 foundation below — the prior session's summary describes this stretch as "hundreds of incremental feature additions and bug fixes," which is consistent with the density of small fixes visible in what's documented above and below this entry.

v1.98 — Undrafted option in Draft Round / Overall Pick filters
Added an explicit "Undrafted" choice to both filters (only shown when a UDFA exists on the watchlist), since those two fields are legitimately empty for undrafted players and they were previously unreachable through those filters.

v1.97 — Undrafted formatting aligned with drafted format
Undrafted line now reads 2023 Draft Class · Undrafted · Yr 4, matching the same structure as drafted players instead of leading with "Undrafted."

v1.94–v1.96 — Fixed undrafted detection
Root cause found: MFL sets draft_year even for UDFAs (their rookie season) but marks draft_team: "FA". Detection was checking the wrong field. Fixed to key off draft_team === "FA".

v1.93 — Overall pick number + 4 new filters
Added computed overall pick ((round-1)*32+pick, an approximation since real round sizes vary with comp picks) to the draft line. Added Draft Class, Draft Round, Overall Pick, and Years in NFL filters, all multi-select, populated dynamically from the current watchlist.

v1.91–v1.92 — Jersey pill reshaped to rounded square
Changed from pill shape to a 29×29 rounded square sized to visually sit between the name row and the draft-meta row below it. Draft line wording updated to "Draft Class" and "ROOKIE" in place of "Yr 1".

v1.88–v1.90 — Draft year/round/pick/experience added
New draft-meta line under each player's name: draft year, round/pick, and computed years of NFL experience (derived from draft year since MFL doesn't expose this directly). Handles undrafted/missing data gracefully.

v1.86 — Next Game pill
Shows each player's next scheduled game: Wk7 Sun 1:00 PM vs DAL. Home/away (vs/@) pulled from MFL's isHome flag. Reuses the same nflSchedule fetch as bye weeks — one API call powers both features.

v1.84–v1.85 — Bye weeks
Derived bye weeks per team from MFL's nflSchedule endpoint (no dedicated bye-week field exists; computed by finding which teams are absent from each week's matchups). Cache is keyed to the current season year so it self-updates every year with no code changes. Bye Week filter added.

v1.77–v1.83 — Jersey number pills
Added team-colored jersey number badges (three brand colors per team: fill, border, number). Required DETAILS=1 on the MFL players API call to get jersey numbers at all. Several rounds of NFL team color mapping fixes for MFL's non-standard team codes (KCC, LVR, GBP, etc.).

v1.73–v1.76 — Fixed "My Team" filter undercounting
Root cause: the nWo league's MY_TEAM_MATCH entry had an extra (nWo) suffix added purely for display purposes, which broke the franchise name match against MFL's actual data (just "The Undertaker"). Fixed.

v1.66–v1.72 — Background/theme iteration
User reverted an attempted sky-gradient background experiment back to solid dark/light backgrounds. Reworked Trade Block / My Trade Block colors to violet/amber for better contrast in light mode. Added and tuned film grain texture. Fixed a bug where the Expand toggle and Dark/Light toggle were sharing the same text-selector target.

v1.64–v1.65 — File corruption incident and recovery
A Python string-slicing bug during a gradient-background edit truncated the live file to 3.5KB (an unguarded .find() returning -1 was used directly in a slice). File had to be reconstructed from the last known-good deployed version, pasted back in by the user. Lesson: this is the direct motivation for this changelog and the git-backup conversation.

v1.52–v1.63 — League renumbering, theming, layout polish
League display order changed to match user's preferred grouping. Major CSS Grid rework of the per-league status icon row. Day/Night theme toggle introduced. Emoji removed app-wide per user preference.

v1.42–v1.51 — Trade Block / My Trade Block system
Introduced trade-block detection via MFL's tradeBait API, including a teal/orange ring system on player status icons distinguishing "on trade block" from "I've listed this player."

v1.33–v1.41 — Status filter highlighting, refresh button, rate-limit compliance
Status filter now highlights matching rows in the expanded owner view. Added a manual refresh button with abuse warnings, and brought refresh timing in line with MFL's API guidelines (1s spacing between league calls, 30min cooldown).

Foundational Build (v1.1–v1.32, earlier sessions)
Initial build of the dynasty fantasy football watchlist: Vercel proxy for MFL API calls, league configuration for 6 leagues (mixed SF and SF/TE+ formats, including a 2-roster-spot "nWo" league), player pool caching, watchlist add/remove with undo/redo and history, custom multi-select filter system, and the core dark-mode UI. Full detail lives in the session transcripts referenced in /mnt/transcripts/journal.txt if needed.

Process notes for future sessions
Every deploy should pass a JS syntax check (node --check) before being handed off — this is now standard practice after the v1.64 incident.
Large multi-block edits are done via str_replace (which fails loudly if the target text isn't found exactly once) rather than manual string slicing, for the same reason.
When debugging live data issues (API field names, filter logic, matching bugs), the fastest reliable path has consistently been adding a temporary diagnostic line to the in-app debug ticker, having the user paste back the output, then removing the diagnostic once resolved — rather than guessing at MFL's data shape from memory.
