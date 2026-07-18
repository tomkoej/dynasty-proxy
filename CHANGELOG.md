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
