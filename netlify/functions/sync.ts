import type { Config } from "@netlify/functions";
import { runSync } from '../utils/sync-core';

export default async (req: Request) => {
    return await runSync();
};

export const config: Config = {
    schedule: "0 * * * *"
};
