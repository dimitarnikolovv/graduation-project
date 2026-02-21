import { eq } from 'drizzle-orm';
import { db } from '../db';
import { lessonLikes } from '../db/schema/lessonLikes';

type CheckIfUserLikedLessonParams = {
	userId: string;
	lessonId: string;
};

export async function checkIfUserLikedLesson(
	params: CheckIfUserLikedLessonParams
): Promise<boolean> {
	const { userId, lessonId } = params;

	const like = await db.query.lessonLikes.findFirst({
		where: (table, { and, eq }) => and(eq(table.userId, userId), eq(table.lessonId, lessonId))
	});

	return !!like;
}

export async function countLessonLikes(lessonId: string): Promise<number> {
	const likesCount = await db.$count(lessonLikes, eq(lessonLikes.lessonId, lessonId));

	return likesCount;
}
