# Phoenix Team Manager

The equipment and travel app for the Wellington Phoenix first team, 2026-27 A-League season.

It runs as one web page. Anyone stepping into the role can run a week from it.

## What it does

- **Today.** Today's session, where we are in the game week (MD-4, MD-1, MD+1), today's jobs and reminders.
- **Schedule.** One week at a time. Tick jobs, add reminders for any day, change a session or write notes. Fixtures sit underneath.
- **Bag packs.** Every bag for a trip. Pick the trip type and the kit (Home, Away or Third), then tick bags and items as they are packed. Rename bags and move items between them.
- **Squad.** Pick the travelling squad. It works out kit sizes needed and who carries which bag by seniority.
- **Game day.** The changing room setup list.
- **Guide and setup.** How the app works, and where to edit every checklist.
- **PDF print off.** Bags, squad, sizes and bag contents with blank tick boxes for travel.

## Put it on GitHub Pages

1. Create a new repository on GitHub.
2. Upload everything in this folder. Keep the `src` folder.
3. Go to **Settings**, then **Pages**.
4. Under **Branch**, pick `main` and `/ (root)`, then **Save**.
5. After a minute the app is live at `https://<your-username>.github.io/<repo-name>/`.

`index.html` is the finished app. Nothing needs building to get it online.

## Saving on GitHub Pages

On GitHub Pages the app saves in the browser you use it in. Your phone and laptop each keep their own copy.

To move your data between devices, go to **Guide and setup**, tap **Download a backup** on one device, then **Load a backup** on the other.

The version inside Claude saves to your Claude account and syncs between devices on its own.

## Changing the app

The source is in `src`:

| File | What is in it |
| --- | --- |
| `src/data.js` | Players and sizes, fixtures, bags and their contents, staff, checklists, carry-on items |
| `src/season_plan.js` | Every day of the 2026-27 season schedule (sessions and notes) |
| `src/logic.js` | Game week labels, the game week pattern, checklists, kit sizes and bag allocation |
| `src/app.jsx` | The screens |
| `src/shell.html` | The page layout, colours and fonts |

After changing anything in `src`, rebuild `index.html`:

```
npm install
npm run build
```

This needs [Node.js](https://nodejs.org) installed. Then upload the new `index.html`.

Most changes can be made inside the app without touching code: players, sizes, seniority order, fixtures, bags, items and checklists.

## The game week pattern

Days come from the season schedule. Where the schedule has no entry, this pattern fills the day in:

| Day | Normally |
| --- | --- |
| MD-5, MD-4, MD-3 | Training |
| MD-2 | Off |
| MD-1 | Training. Away games: train, then travel |
| MD | Game |
| MD+1 | Recovery. Away games: travel home |

## Libraries

React 18.3.1, jsPDF 2.5.1 and jsPDF-AutoTable 3.8.2, loaded from cdnjs. Fonts are Barlow and Barlow Condensed from Google Fonts.
