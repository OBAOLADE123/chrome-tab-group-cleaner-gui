# Chrome Tab Group Cleaner (Windows GUI)

**Chrome has no bulk delete for saved tab groups. This is one - now with a window, and it runs on Windows.**

Got hundreds of saved tab groups cluttering your bookmarks bar? Load them, search
by name, tick the ones you want gone (or grab every unnamed / "Tabs" group in one
click), and delete them. Every delete makes a backup first.

> Based on [franzenzenhofer/chrome-tab-group-cleaner](https://github.com/franzenzenhofer/chrome-tab-group-cleaner)
> (MIT). This version adds Windows support and a point-and-click GUI.

## Quick start (Windows)

1. Install [Node.js](https://nodejs.org) 20 or newer (once).
2. Download this repo (**Code > Download ZIP**) and unzip it.
3. Double-click **`setup.bat`** (once). It installs and builds the tool.
4. Double-click **`start.bat`**. A page opens in your browser. Keep the black window open.

## Using the app

1. **Load my groups** - Chrome can stay open for this step.
2. **Search** group names, or use the **Unnamed / "Tabs" only** filter.
3. **Select** rows one by one, shift-click for a range, or use *Select all shown* /
   *Select unnamed / "Tabs"*.
4. **Preview selected** to see exactly what would go, then **Delete selected**.

By default the app closes Chrome, deletes, and reopens your last session (Chrome
has to be closed for a delete). Untick that option to close Chrome yourself.

"Unnamed / Tabs" means groups with no name, or a name that is only "Tab", "Tabs"
or "3 tabs". A group called "Tabs for work" is **not** matched.

## Undo

Backups are saved to `C:\Users\<you>\.chrome-tab-group-cleaner\backups`. Use
**Restore a backup** at the bottom of the app (Chrome must be closed), or run
`node dist/cli.js restore --backup <folder> --profile Default`.

## Sync

If your Google account syncs tab groups, Chrome re-downloads a plain local delete,
so the tool skips synced profiles. Two ways around it:

- **Safest:** turn off **Tab groups** at `chrome://settings/syncSetup/advanced`,
  run the delete, then decide whether to turn it back on.
- **Experimental:** tick *also delete them from my Google account* (`--sync-tombstone`).
  It leaves a sync tombstone so the deletion reaches your account. The original
  author notes this is not verified against a real account - worst case, the
  groups come back.

## Command line

The GUI drives the same CLI, so you can use it directly (`node dist/cli.js ...`):

```bash
node dist/cli.js profiles                           # profiles, and which sync
node dist/cli.js list --all-profiles -v             # what is there
node dist/cli.js list --json --all-profiles         # same, machine-readable
node dist/cli.js delete --regex "^\s*((\d+\s*)?tabs?)?\s*$" --orphans --dry-run
node dist/cli.js delete --guids <a,b,c> --orphans --restart
node dist/cli.js restore --backup <folder> --profile Default
```

Pick groups with `--all`, `--claude`, `--match <text>`, `--regex <pattern>` or
`--guids <list>`. Then `--browser chrome|chromium|brave|edge`, `--profile <dir>`,
`--all-profiles`, `--orphans`, `--dry-run`, `--restart`, `--sync-tombstone`.

## What changed from the original

- **Windows support:** detects a running browser with `tasklist`, and `--restart`
  quits the browser and reopens each profile with its last session.
- **Windows file locks:** read-only snapshots no longer try to copy Chrome's
  locked `LOCK` file.
- **New options:** `list --json` and `delete --guids`.
- **GUI:** `gui/` - a small local page (no extra dependencies) that runs on
  `127.0.0.1` only.

Windows `--restart` is new: it asks Chrome to close normally so your session is
saved, then reopens it. Save anything important first.

## Where saved groups live

```
<user data>/<Profile>/Sync Data/LevelDB     one key per entity: saved_tab_group-dt-<uuid>

{ 1: schema version, 2: SavedTabGroupSpecifics }

SavedTabGroupSpecifics { 1: guid, 2: created us, 3: updated us, 4: group, 5: tab }
  group { 2: title, 3: color, 4: position }
  tab   { 1: group guid, 2: position, 3: url, 4: title }
```

A group is a group entity **plus** its tab entities - delete only the group and
the tabs linger as orphans (`--orphans` sweeps those). `src/proto.ts` reads this
wire format directly, no protobuf dependency.

## Development

`npm run gates` - typecheck, lint, test, build. Tests build real LevelDB stores
and read them back, no mocks.

## License

MIT - see `LICENSE`. Original work by Franz Enzenhofer.
