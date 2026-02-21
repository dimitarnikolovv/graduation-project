import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as dotenv from 'dotenv';

dotenv.config();

import * as auth from './schema/auth';
import * as enums from './schema/enums';
import * as userPermissions from './schema/userPermissions';
import * as videos from './schema/videos';
import * as files from './schema/files';
import * as tests from './schema/tests';
import * as paidTestEntries from './schema/paidTestEntries';
import * as subjects from './schema/subjects';
import * as lessonGroups from './schema/lessonGroups';
import * as lessons from './schema/lessons';
import * as studentLessons from './schema/studentLessons';
import * as lessonComments from './schema/lessonComments';
import * as lessonLikes from './schema/lessonLikes';
import * as publicEvents from './schema/publicEvents';
import * as publicEventEntries from './schema/publicEventEntries';
import * as paidEvents from './schema/paidEvents';
import * as paidEventEntries from './schema/paidEventEntries';
import * as transactions from './schema/transactions';
import * as uploadTokens from './schema/uploadTokens';

if (!process.env.PRIVATE_DATABASE_URL) throw new Error('PRIVATE_DATABASE_URL is not set');

const client = postgres(process.env.PRIVATE_DATABASE_URL);

const schema = {
	// Enums always first
	...enums,

	// Tables
	...auth,
	...userPermissions,
	...videos,
	...files,
	...tests,
	...paidTestEntries,
	...subjects,
	...lessonGroups,
	...lessons,
	...studentLessons,
	...lessonComments,
	...lessonLikes,
	...publicEvents,
	...publicEventEntries,
	...paidEvents,
	...paidEventEntries,
	...transactions,
	...uploadTokens
};

export function createDb(dbUrl: string) {
	const pgClient = postgres(dbUrl);
	return drizzle(pgClient, { schema });
}

export const db = drizzle(client, { schema });

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
