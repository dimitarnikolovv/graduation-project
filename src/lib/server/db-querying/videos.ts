import { and, desc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm';
import { db } from '../db';
import { videos } from '../db/schema/videos';

function generateQueryFromParams(searchParams: URLSearchParams) {
	const startDate = searchParams.get('startDate')?.trim();
	const endDate = searchParams.get('endDate')?.trim();
	const fileName = searchParams.get('fileName')?.trim();
	const fileId = searchParams.get('fileId')?.trim();
	const uploadedById = searchParams.get('uploadedById')?.trim();

	const subjectIds = searchParams
		.getAll('subjectIDs')
		.filter((id) => id.trim() !== '')
		.map(Number);
	const classGradeIds = searchParams
		.getAll('classIDs')
		.filter((id) => id.trim() !== '')
		.map(Number);

	const query = [];

	if (startDate) query.push(gte(videos.createdAt, new Date(startDate)));
	if (endDate && endDate !== startDate) query.push(lte(videos.createdAt, new Date(endDate)));
	if (startDate && endDate && startDate === endDate)
		query.push(
			lte(videos.createdAt, new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)))
		);
	if (fileId) query.push(eq(videos.id, fileId));
	if (fileName)
		query.push(
			or(ilike(videos.originalName, `%${fileName}%`), ilike(videos.displayName, `%${fileName}%`))
		);
	if (uploadedById) query.push(eq(videos.uploadedById, uploadedById));

	if (subjectIds.length > 0) query.push(inArray(videos.subjectId, subjectIds));
	if (classGradeIds.length > 0) query.push(inArray(videos.classGradeId, classGradeIds));

	return query.length > 0 ? and(...query) : undefined;
}

export type FetchExpandedVideosParams = {
	page: number;
	limit: number;
	searchParams?: URLSearchParams;
};

export async function fetchExpandedVideos({
	page,
	limit,
	searchParams
}: FetchExpandedVideosParams) {
	const query = generateQueryFromParams(searchParams ?? new URLSearchParams());

	const results = await db.query.videos.findMany({
		with: {
			posterFile: true,
			chaptersFile: true,
			subject: true,
			classGrade: true,
			uploadedByUser: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					role: true
				}
			}
		},
		orderBy: desc(videos.createdAt),
		limit,
		offset: (page - 1) * limit,
		where: query
	});

	const totalItems = await db.$count(videos, query);

	return { results, totalItems };
}

export type FetchExpandedVideosResult = Awaited<ReturnType<typeof fetchExpandedVideos>>;

export async function fetchExpandedVideo(videoId: string) {
	const result = await db.query.videos.findFirst({
		with: {
			posterFile: true,
			chaptersFile: true,
			subject: true,
			classGrade: true,
			uploadedByUser: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					role: true
				}
			}
		},

		where: eq(videos.id, videoId)
	});

	return result;
}

export type FetchExpandedVideoResult = Awaited<ReturnType<typeof fetchExpandedVideo>>;
