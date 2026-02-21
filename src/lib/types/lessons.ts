import type { FetchExpandedLessonResult } from '$lib/server/db-querying/lessons';

export type ExpandedLesson = Exclude<FetchExpandedLessonResult, undefined>;
