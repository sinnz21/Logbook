# Dry run: panel feedback checklist

Use this to check every UI update from the panel feedback **before pushing to GitHub**. It runs on sample data, so you don't need the backend or MySQL.

## 1. Start the demo

- **Windows:** double-click `start-demo.bat`.
- **Any OS:** `npm install`, then `npm run demo`, then open http://localhost:5173

| Username | Role |
|---|---|
| `nsantos` | Nurse |
| `acruz` | Admin |

Any password works in demo mode. Changes reset when you reload the page. The **DEMO DATA** badge in the corner confirms you're on sample data.

## 2. Walk through each item

| # | Panel item | Where to check | What you should see |
|---|---|---|---|
| 1 | Detect role automatically | Login screen | No Admin / Nurse-Staff picker. `nsantos` opens the Nurse dashboard, `acruz` opens the Admin dashboard. |
| 10 | Forgot password asks for email | Login → **Forgot password?** | An email field. Use `nsantos@isu.edu.ph`. |
| 11 | Code in separate boxes | Next step | 6 boxes, one digit each. Pasting a whole code fills all 6, and Backspace moves back a box. Demo mode shows the code on screen because no email is sent. |
| 12 | Code expiry shown | Same step | "Code expires in 10:00", counting down. When it hits 0 the boxes lock and you can send a new code. |
| 2 | Graphs on every dashboard | Nurse and Admin dashboards | The Insights content now appears on the dashboards as charts: client breakdown, visit outcomes, departments, demographics, visits per month, and treatment pairings. The Admin dashboard also has sign-in activity, account activity, and stock status. |
| 3 | Actual numbers | Any chart | Every bar and legend shows the count *and* the percentage, for example `8 · 16.3%`. Card subtitles show totals. |
| 7 | "Add visit record" not in sidebar | Nurse sidebar and dashboard | The sidebar item and the dashboard button are gone. Use the **Add visit record** button on **Patient records** instead. |
| 4 | Full list view | "View full list (N)" on Top complaints, Top 5 medicines, Departments | A dialog with the complete ranked list, a search box, counts, % and CSV export. |
| 5 | Reports in table view | Sidebar → **Reports** → **Table** | Every report section as rows and columns, with a total row and its own **CSV** button. The Charts/Table choice is remembered. |
| 6 | Audit log | Admin → **Audit log** | Who signed in and when, plus every add, edit and delete. The count tiles at the top can be clicked to filter. Try adding a visit as `nsantos`, then sign in as `acruz` and find it at the top of the log. |
| 9 | Backup and recovery | Admin → **Settings** | **Back up now** creates a snapshot. **Restore** asks for confirmation, takes a safety backup, then rolls the data back. Both show up in the audit log. |
| 8 | Readability | Everywhere | Every input, dropdown and date picker has a darker border. Small text (labels, hints, table subtext, chart labels, timestamps) is 1–1.5px bigger. Cards, the sidebar, the topbar, tables, panels and dialogs have a visible soft-green outline. |

## 3. Before you push

```bash
npm run check      # lint + production build. Must finish with no errors.
```

The production build contains **no** demo data. You can confirm this: `grep -c Kremil dist/assets/*.js` should print `0`.

## Needs the backend team

Items 6, 9 and 10–12 need new endpoints. They're specified in [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md#7-new-for-the-panel-feedback). Until the backend adds them, those screens show *"This feature needs a backend endpoint that isn't available yet"* when running against the real server. In demo mode everything works.
