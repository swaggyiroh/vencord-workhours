# WorkingHours

Automatically sets your status to Do Not Disturb during your working hours, and back to Online afterwards.

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| Start time | `08:00` | 24h `HH:MM`, in your computer's local time |
| End time | `17:00` | May be *earlier* than the start time for overnight shifts (e.g. `22:00` → `06:00`) |
| Work days | `Mon-Fri` | Comma separated, ranges allowed: `Mon-Fri`, `Mon,Tue,Sat`, `Fri-Mon` |
| Status during work | Do Not Disturb | Online / Idle / DND / Invisible |
| Status after work | Online | Same options, plus "Don't change it" |
| Apply on startup | on | Applies your work status right after Discord starts, but only if you are currently within working hours |

## Behaviour

- The schedule is checked every 30 seconds, and the status is only changed **at the transitions** — when your working hours start and when they end.
- Because of that, a status you set manually mid-shift is left alone until the next start/end. It doesn't fight you.
- Status is a remote (account-level) setting, so the change applies to all your logged-in clients.
- For overnight shifts, the window belongs to the day it *starts* on: with `Mon-Fri` and `22:00` → `06:00`, the Friday shift ends Saturday morning.
- If the times or days are typed invalidly, the plugin does nothing rather than guessing.
- Times use the local time of whichever machine runs the plugin, so a laptop travelling across timezones follows local time.
