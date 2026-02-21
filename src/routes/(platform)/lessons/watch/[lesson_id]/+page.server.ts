import { fetchExpandedLesson } from '$lib/server/db-querying/lessons';
import { DEFAULT_SEO_TITLE } from '$lib/utils/constants';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_HOST } from '$env/static/public';
import { checkIfUserHasAccessToLesson } from '$lib/server/server-utils/access-control';
import { getLessonGroupsToDisplayByGradeAndSubject } from '$lib/server/db-querying/lessonGroups';
import { getStudentLessonProgress } from '$lib/server/db-querying/studentLessons';
import { countLessonComments } from '$lib/server/db-querying/lessonComments';
import { checkIfUserLikedLesson, countLessonLikes } from '$lib/server/db-querying/lessonLikes';

export const load: PageServerLoad = async ({ params, locals }) => {
	const lesson = await fetchExpandedLesson(params.lesson_id);

	if (!lesson) {
		error(404, 'Не намерихме този урок.');
	}

	const commentsCount = await countLessonComments(lesson.id);

	const likesCount = await countLessonLikes(lesson.id);

	// Check if the lesson is paid or if the user has access to it
	// TODO
	if (lesson.isPaid && !locals.user) {
		redirect(302, `/lessons/purchase/${lesson.id}`);
	}

	if (lesson.isPaid && locals.user) {
		const hasAccess = await checkIfUserHasAccessToLesson(locals.user.id, lesson.id);
		if (!hasAccess) {
			redirect(302, `/lessons/purchase/${lesson.id}`);
		}
	}

	const {
		results: groupsInSeries,
		totalGroups,
		totalLessons
	} = await getLessonGroupsToDisplayByGradeAndSubject(lesson.subject.id, lesson.classGrade.id);

	// Get current progress if user is logged in (but don't enroll yet - that happens client-side)
	let studentProgress = null;
	if (locals.user) {
		studentProgress = await getStudentLessonProgress(locals.user.id, lesson.id);
	}

	let likedByUser = false;
	if (locals.user) {
		likedByUser = await checkIfUserLikedLesson({
			userId: locals.user.id,
			lessonId: lesson.id
		});
	}

	const title = `${lesson.title} | ${lesson.subject.name} за ${lesson.classGrade.name} | ${DEFAULT_SEO_TITLE}`;

	const description = lesson.resume;

	const ogImage = lesson.video.posterFile?.fileKey
		? `${PUBLIC_HOST}/api/file/${lesson.video.posterFile?.fileKey}`
		: null;

	return {
		lesson,
		title,
		ogImage,
		groupsInSeries,
		likedByUser,
		groupsCount: totalGroups,
		lessonsCount: totalLessons,
		description,
		studentProgress,
		commentsCount,
		likesCount
	};
};
