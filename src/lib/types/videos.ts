import type { FetchExpandedVideoResult } from '$lib/server/db-querying/videos';

export type ExpandedVideo = Exclude<FetchExpandedVideoResult, undefined>;
