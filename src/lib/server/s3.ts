import {
	PRIVATE_S3_ACCESS_KEY,
	PRIVATE_S3_ENDPOINT,
	PRIVATE_S3_REGION,
	PRIVATE_S3_SECRET_KEY
} from '$env/static/private';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

const isHttps = PRIVATE_S3_ENDPOINT.startsWith('https://');

const agent = isHttps
	? new HttpsAgent({ keepAlive: true, maxSockets: 1000 })
	: new HttpAgent({ keepAlive: true, maxSockets: 1000 });

const s3 = new S3Client({
	endpoint: PRIVATE_S3_ENDPOINT,
	forcePathStyle: true, // required for MinIO and R2
	region: PRIVATE_S3_REGION,
	credentials: {
		accessKeyId: PRIVATE_S3_ACCESS_KEY,
		secretAccessKey: PRIVATE_S3_SECRET_KEY
	},
	requestHandler: new NodeHttpHandler({
		httpAgent: agent,
		httpsAgent: agent
	})
});

export { s3 };
