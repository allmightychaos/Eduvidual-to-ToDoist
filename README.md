# Eduvidual (Moodle) to Todoist Sync

Automate your student life! This project is a Netlify Scheduled Function that fetches your Eduvidual (Moodle) calendar, shifts the deadlines 24 hours earlier (so you don't do it at the last minute), and pushes them securely to Todoist.

## Features
- **Zero Data Exposure**: No hardcoded API keys or personal URLs. Everything is securely managed via Environment Variables.
- **Hourly Sync**: Runs automatically every hour.
- **Deduplication**: Checks your active tasks to ensure duplicate assignments aren't created.
- **Proactive Deadlines**: Automatically shifts Moodle deadlines 24 hours backwards.

## Setup Instructions

### 1. Get your Eduvidual iCal Link
1. Log into your [Eduvidual (Moodle) Account](https://www.eduvidual.at/).
2. Navigate to your **Calendar**.
3. Scroll to the bottom and click **Export calendar**.
4. Select **All events** and **recent and next 60 days** (or whichever you prefer).
5. Click **Get calendar URL** and copy the resulting link.
