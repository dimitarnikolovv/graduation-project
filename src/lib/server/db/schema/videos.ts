import { timestamps } from '../column-helpers';
import { pgTable, text, bigint, index, integer } from 'drizzle-orm/pg-core';
import { videoStatusEnum } from './enums';
import { users } from './auth';
import { relations } from 'drizzle-orm';
import { VideoStatusEnum } from '../../../types/enums';
import { files } from './files';
import { classGrades, subjects } from './subjects';
import { lessons } from './lessons';

export const videos = pgTable(
	'videos',
	{
		id: text('id').primaryKey(),

		fileKey: text('file_key').notNull().unique(), // e.g. "matematika_12klas/intro.m3u8"
		originalName: text('original_name').notNull(), // e.g. "intro.m3u8"
		contentType: text('content_type').notNull(), // "application/vnd.apple.mpegurl"
		size: bigint('size', { mode: 'number' }).notNull(), // Size in bytes
		displayName: text('display_name').notNull(), // e.g. "Intro"
		thumbnailsKey: text('thumbnails_key'), // e.g. "matematika_12klas/intro-thumbnail.jpg - should be optional"
		status: videoStatusEnum('status')
			.$type<VideoStatusEnum>()
			.default(VideoStatusEnum.pending)
			.notNull(),
		subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'set null' }), // Subject ID
		classGradeId: integer('class_grade_id').references(() => classGrades.id, {
			onDelete: 'set null'
		}), // Class Grade ID (optional for filtering)
		uploadedById: text('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }), // User ID
		posterFileId: text('poster_file_id').references(() => files.id, { onDelete: 'set null' }),
		chaptersFileId: text('chapters_file_id').references(() => files.id, { onDelete: 'set null' }),
		...timestamps
	},
	(table) => [
		index('video_status_idx').on(table.status),
		index('video_uploaded_by_idx').on(table.uploadedById),
		index('video_file_key_idx').on(table.fileKey),
		index('video_created_at_idx').on(table.createdAt),
		index('video_deleted_at_idx').on(table.deletedAt)
	]
);

export type Video = typeof videos.$inferSelect;

export const videoRelations = relations(videos, ({ one, many }) => ({
	uploadedByUser: one(users, {
		fields: [videos.uploadedById],
		references: [users.id]
	}),

	posterFile: one(files, {
		fields: [videos.posterFileId],
		references: [files.id]
	}),

	chaptersFile: one(files, {
		fields: [videos.chaptersFileId],
		references: [files.id]
	}),

	subject: one(subjects, {
		fields: [videos.subjectId],
		references: [subjects.id]
	}),

	classGrade: one(classGrades, {
		fields: [videos.classGradeId],
		references: [classGrades.id]
	}),

	lesson: many(lessons) // Could be one to many if needed in the future
}));
