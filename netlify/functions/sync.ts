import { getStore } from '@netlify/blobs';
import { TodoistApi } from '@doist/todoist-api-typescript';
import type { Config } from "@netlify/functions";
import ical from 'node-ical';

export default async (req: Request) => {
    const store = getStore("sync-state");
    
    try {
        console.log("Sync started...");
        const todoistToken = process.env.TODOIST_API_TOKEN;
        const icalUrl = process.env.EDUVIDUAL_ICAL_URL;
        const projectId = process.env.TODOIST_PROJECT_ID;
        
        if (!todoistToken || !icalUrl) {
            console.error("Missing environment variables.");
            await store.setJSON("latest", { timestamp: new Date().toISOString(), status: "error (missing env vars)" });
            return new Response("Missing env vars", { status: 500 });
        }
        
        const todoist = new TodoistApi(todoistToken);
        
        console.log("Fetching iCal feed...");
        let events;
        try {
            events = await ical.async.fromURL(icalUrl);
        } catch (icalError: any) {
            console.error("Failed to fetch or parse iCal URL:", icalError);
            await store.setJSON("latest", { timestamp: new Date().toISOString(), status: `error: Failed to fetch iCal feed - ${icalError.message || icalError}` });
            return new Response("iCal error", { status: 500 });
        }
        
        const eventList = Object.values(events).filter(e => e && e.type === 'VEVENT');
        console.log(`Found ${eventList.length} events in feed.`);
        
        console.log("Fetching Todoist tasks...");
        let tasksResponse;
        try {
            tasksResponse = await todoist.getTasks(projectId ? { projectId } : undefined);
        } catch (todoistError: any) {
            console.error("Failed to fetch Todoist tasks:", todoistError);
            const errMsg = todoistError?.responseData?.error || todoistError.message || String(todoistError);
            await store.setJSON("latest", { timestamp: new Date().toISOString(), status: `error: Failed to connect to Todoist API - ${errMsg}` });
            return new Response("Todoist error", { status: 500 });
        }

        const activeTaskNames = new Set(tasksResponse.results ? tasksResponse.results.map((t: any) => t.content) : tasksResponse.map((t: any) => t.content));
        
        for (const item of eventList) {
            const eventItem = item as any;
            const summary = eventItem.summary;
            const end = eventItem.end;
            
            if (!summary || !end) continue;
            
            if (activeTaskNames.has(summary)) {
                console.log(`Skipping duplicate task: ${summary}`);
                continue;
            }
            
            const originalDate = new Date(end);
            const shiftedDate = new Date(originalDate.getTime() - (24 * 60 * 60 * 1000));
            
            console.log(`Creating task: "${summary}" | Due: ${shiftedDate.toISOString()}`);
            try {
                await todoist.addTask({
                    content: summary,
                    dueDate: shiftedDate.toISOString().split('T')[0],
                    ...(projectId && { projectId })
                });
            } catch (taskError: any) {
                console.error(`Failed to create task ${summary}:`, taskError);
                // We don't abort the whole run if one task fails, but we could log it
            }
        }
        
        console.log("Sync completed successfully.");
        await store.setJSON("latest", { timestamp: new Date().toISOString(), status: "success" });
        return new Response("OK", { status: 200 });
    } catch (error: any) {
        console.error("Critical Error during sync:", error);
        await store.setJSON("latest", { timestamp: new Date().toISOString(), status: `error: Critical Sync Failure - ${error.message || String(error)}` });
        return new Response("Error", { status: 500 });
    }
};

export const config: Config = {
    schedule: "0 * * * *"
};
