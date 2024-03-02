import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const { AWS_REGION = '', MYFILE_STORAGE_BUCKET_NAME = '' } = process.env;

const getMinutesAsSeconds = (minutes: number) => Math.floor(minutes * 60);

export const getPresignedDownloadUrl = async (bucketName: string, keyPath: string) => {
  const env = process.env.NODE_ENV;
  if (env === 'dev') {
    return `https://${MYFILE_STORAGE_BUCKET_NAME}.s3.amazonaws.com/${keyPath}`;
  }
  const s3Client = new S3Client({ region: AWS_REGION });
  const command = new GetObjectCommand({ Bucket: bucketName, Key: keyPath });
  return await getSignedUrl(s3Client, command, { expiresIn: getMinutesAsSeconds(2) });
};

export const getPresignedUploadUrl = async (bucketName: string, keyPath: string) => {
  const env = process.env.NODE_ENV;
  if (env === 'dev') {
    return `https://${MYFILE_STORAGE_BUCKET_NAME}.s3.amazonaws.com/${keyPath}`;
  }
  const s3Client = new S3Client({ region: AWS_REGION });
  const command = new PutObjectCommand({ Bucket: bucketName, Key: keyPath });
  return await getSignedUrl(s3Client, command, { expiresIn: getMinutesAsSeconds(2) });
};
