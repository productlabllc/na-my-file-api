import { S3Client, GetObjectCommand, PutObjectCommand, PutObjectRequest } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream, existsSync, readFileSync, unlink, unlinkSync, writeFileSync } from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const { AWS_REGION = '', MYFILE_STORAGE_BUCKET_NAME = '' } = process.env;

export const DocumentsPrefix = 'documents';

const getMinutesAsSeconds = (minutes: number) => Math.floor(minutes * 60);

export const getPresignedDownloadUrl = async (
  bucketName: string,
  keyPath: string,
  filename = 'downloaded-file',
  disposition: 'attachment' | 'inline',
) => {
  const env = process.env.NODE_ENV;
  if (env === 'dev') {
    return `https://${MYFILE_STORAGE_BUCKET_NAME}.s3.amazonaws.com/${keyPath}`;
  }
  const s3Client = new S3Client({ region: AWS_REGION });
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: keyPath,
    ResponseContentDisposition: `${disposition}; filename="${filename}"`,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: getMinutesAsSeconds(100) });
};

export const getPresignedUploadUrl = async (bucketName: string, keyPath: string) => {
  const env = process.env.NODE_ENV;
  if (env === 'dev') {
    return `https://${MYFILE_STORAGE_BUCKET_NAME}.s3.amazonaws.com/${keyPath}`;
  }
  const s3Client = new S3Client({ region: AWS_REGION });
  const command = new PutObjectCommand({ Bucket: bucketName, Key: keyPath });
  return await getSignedUrl(s3Client, command, { expiresIn: getMinutesAsSeconds(100) });
};

export const createFilePath = (ownerId: string, documentId: string, fileId: string) =>
  `${DocumentsPrefix}/${ownerId}/${documentId}/${fileId}`;

export const downloadObject = async (bucketName: string, keyPath: string, outputPath: string) => {
  const downloadUrl = await getPresignedDownloadUrl(bucketName, keyPath, undefined, 'attachment');

  const res = await fetch(downloadUrl);
  if (existsSync(outputPath)) {
    unlinkSync(outputPath);
  }
  const fileStream = createWriteStream(outputPath, { flags: 'wx' });
  await finished(Readable.fromWeb(res.body! as any).pipe(fileStream));
  // const s3Client = new S3Client({region: AWS_REGION})
  // const command = new GetObjectCommand({Bucket: bucketName, Key: keyPath})
  // const result = await s3Client.send(command)
  // const data = await result.Body?.transformToByteArray()
  // if(data) {
  //   throw `No content found for ${keyPath} at ${bucketName}`
  // }

  // writeFileSync(outputPath, data!)
};

export const uploadObject = async (
  bucketName: string,
  filePath: string,
  key: string,
  otherParams: Partial<PutObjectRequest> = {},
) => {
  const data = readFileSync(filePath);
  const s3Client = new S3Client({});
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: data,
    ...otherParams,
  });

  const response = await s3Client.send(command);

  return response;
};
