import { command, form, getRequestEvent, query } from '$app/server';
import { checkIfUserAndRole } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { fetchLessonComments } from '$lib/server/db-querying/lessonComments';
import { increaseLessonViewCount, searchForLesson } from '$lib/server/db-querying/lessons';
import {
	enrollStudentInLesson,
	updateStudentLessonProgress
} from '$lib/server/db-querying/studentLessons';
import { lessonComments } from '$lib/server/db/schema/lessonComments';
import { lessonLikes } from '$lib/server/db/schema/lessonLikes';
import { lessons } from '$lib/server/db/schema/lessons';
import { RolesEnum, UserPermissionsEnum } from '$lib/types/enums';
import { checkIfUserHasPermission } from '$lib/utils/access-control';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const enrollStudentInLessonRemoteSchema = z.object({
	userId: z.string(),
	lessonId: z.string()
});

export const enrollStudentInLessonRemote = command(
	enrollStudentInLessonRemoteSchema,
	async ({ userId, lessonId }) => {
		// Check if user is authenticate
		try {
			// Enroll student in lesson (or update last accessed time)
			await enrollStudentInLesson(userId, lessonId);
		} catch (err) {
			console.error('Error enrolling student in lesson:', err);
		}
	}
);

const studentLessonProgressRemoteSchema = z.object({
	userId: z.string(),
	lessonId: z.string(),
	progress: z.number(),
	videoProgress: z.number()
});

export const setStudentLessonProgressRemote = command(
	studentLessonProgressRemoteSchema,
	async ({ userId, lessonId, progress, videoProgress }) => {
		// Check if user is authenticate
		try {
			await updateStudentLessonProgress(userId, lessonId, progress, videoProgress);
		} catch (err) {
			console.error('Error setting student lesson progress:', err);
			error(500, 'Грешка при записване на напредъка');
		}
	}
);

const increaseLessonViewCountRemoteSchema = z.object({
	lessonId: z.string()
});

export const increaseLessonViewCountRemote = command(
	increaseLessonViewCountRemoteSchema,
	async ({ lessonId }) => {
		const { locals } = getRequestEvent();

		if (locals.user && checkIfUserAndRole(locals, [RolesEnum.admin, RolesEnum.teacher])) {
			// Do not increase view count for admins or editors
			return;
		}

		try {
			await increaseLessonViewCount(lessonId);
		} catch (err) {
			console.error('Error increasing lesson view count:', err);
		}
	}
);

const getLessonCommentsRemoteSchema = z.object({
	lessonId: z.string(),
	limit: z.number().optional(),
	page: z.number().optional()
});

export const getLessonCommentsRemote = query(
	getLessonCommentsRemoteSchema,
	async ({ lessonId, limit, page }) => {
		try {
			const { comments, totalItems, totalPages } = await fetchLessonComments(lessonId, {
				limit,
				page
			});
			return { comments, totalItems, totalPages };
		} catch (err) {
			console.error('Error fetching lesson comments:', err);
			error(500, 'Грешка при зареждане на коментарите');
		}
	}
);

export type GetLessonCommentsRemoteResponse = Awaited<ReturnType<typeof getLessonCommentsRemote>>;

const postCommentRemoteSchema = z.object({
	lessonId: z.string(),
	content: z
		.string()
		.min(1, 'Коментарът не може да бъде празен')
		.max(5000, 'Коментарът е твърде дълъг. Максимум 5000 символа.')
});

export const postCommentRemote = form(postCommentRemoteSchema, async ({ lessonId, content }) => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		error(401, 'Трябва да сте влезли в системата, за да публикувате коментар.');
	}

	try {
		await db
			.insert(lessonComments)
			.values({
				lessonId,
				authorId: locals.user.id,
				content
			})
			.returning();
	} catch (err) {
		console.error('Error posting lesson comment:', err);
		error(500, 'Грешка при публикуване на коментара');
	}
});

const deleteCommentRemoteSchema = z.object({
	commentId: z.string()
});

export const deleteCommentRemote = command(deleteCommentRemoteSchema, async ({ commentId }) => {
	const { locals } = getRequestEvent();

	const currentUser = locals.user;

	if (!currentUser) {
		error(401, 'Трябва да сте влезли в системата, за да изтриете коментар.');
	}

	try {
		// Check if the user is admin
		if (checkIfUserAndRole(locals, [RolesEnum.admin])) {
			// if the user is admin, allow deletion without further checks
			await db.delete(lessonComments).where(eq(lessonComments.id, commentId));

			return;
		}

		// Check if the comment exists and belongs to the user
		const comment = await db.query.lessonComments.findFirst({
			where: (table, { eq, and }) =>
				and(eq(table.id, commentId), eq(table.authorId, currentUser.id))
		});

		if (!comment) {
			error(404, 'Коментарът не е намерен или нямате право да го изтриете.');
		}

		await db.delete(lessonComments).where(eq(lessonComments.id, commentId));
	} catch (err) {
		console.error('Error deleting lesson comment by admin:', err);
		error(500, 'Грешка при изтриване на коментара');
	}
});

const likeLessonRemoteSchema = z.object({
	lessonId: z.string()
});

export const likeLessonRemote = command(likeLessonRemoteSchema, async ({ lessonId }) => {
	const { locals } = getRequestEvent();

	const currentUser = locals.user;

	if (!currentUser) {
		error(401, 'Трябва да сте влезли в системата, за да харесате урок.');
	}

	try {
		const existingLike = await db.query.lessonLikes.findFirst({
			where: (table, { and, eq }) =>
				and(eq(table.lessonId, lessonId), eq(table.userId, currentUser.id))
		});

		if (existingLike) {
			// If the like already exists, remove it (unlike)
			await db.delete(lessonLikes).where(eq(lessonLikes.id, existingLike.id));

			return;
		}

		await db.insert(lessonLikes).values({
			lessonId,
			userId: currentUser.id
		});
	} catch (err) {
		console.error('Error liking lesson:', err);
		error(500, 'Грешка при харесване на урока');
	}
});

const deleteLessonSchema = z.object({
	id: z.string()
});

export const deleteLessonRemote = command(deleteLessonSchema, async ({ id }) => {
	const { locals } = getRequestEvent();

	if (!checkIfUserAndRole(locals, [RolesEnum.admin])) {
		error(403, 'Отказан достъп.');
	}

	if (!checkIfUserHasPermission(locals.userPermissions, UserPermissionsEnum.DeleteLessons)) {
		error(403, 'Нямате нужните права за изтриване на уроци.');
	}

	try {
		await db.delete(lessons).where(eq(lessons.id, id));
	} catch (err) {
		console.log('Error deleting lesson:', err);
		error(500, 'Възникна грешка при изтриването на урока.');
	}
});

const searchForLessonsRemoteSchema = z.object({
	searchTerm: z.string(),
	limit: z.int().optional(),
	page: z.int().optional()
});

export const searchForLessonsRemote = query(
	searchForLessonsRemoteSchema,
	async ({ searchTerm, limit, page }) => {
		try {
			const result = await searchForLesson({
				searchTerm,
				page,
				limit
			});

			return result;
		} catch (err) {
			console.error('Error searching for lessons:', err);
			error(500, 'Грешка при търсене на уроци');
		}
	}
);
