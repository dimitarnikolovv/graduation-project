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

import { pgGenerate } from 'drizzle-dbml-generator';

const schema = {
	// Enums
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

const out = './schema.dbml';
const relational = true;

pgGenerate({ schema, out, relational });
