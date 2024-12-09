import { S3Event } from 'aws-lambda';
import { getDB } from '../lib/db';
import { sendMessageToQueue } from '../lib/sqs';
import { USER_FILE_STATUS } from '../lib/constants';

export const handler = async (event: S3Event, context: any) => {
  const db = getDB();

  const { DOCUMENT_GENERATOR_QUEUE_URL } = process.env;

  const processedFiles: string[] = [];

  console.log('event', event);
  console.log('context', context);

  for (const record of event.Records) {
    const filePath = decodeURI(`${record.s3.object.key}`).replace(/\+/g, ' ');
    const userFile = await db.userFile.findFirst({
      where: {
        FilePath: filePath,
        FileUploadedAt: null,
      },
    });

    if (userFile) {
      await db.userFile.update({
        where: {
          id: userFile.id,
        },
        data: {
          FileUploadedAt: new Date(),
          Status: USER_FILE_STATUS.UPLOADED,
        },
      });

      /* 
        After processing this uploaded user file from S3, and setting its status to 'UPLOADED', we must check to see if we can now trigger the creation of the pdf (generated file). 
        This can only be done when all user files have been successfully uploaded to S3 and handled by this lambda.
        We check here to see if there are any more remaining user files in a 'DRAFT' state.
        If there are no more "pending" user files that we are currently awaiting to be triggered by the S3 put object trigger, we will then have '0' pending files... 
        or no more user files associated with this generatedFileId that are still marked in a 'DRAFT' status.
      */
      const pendingUserFiles = await db.userFile.findMany({
        where: {
          Status: USER_FILE_STATUS.DRAFT,
          FileUploadedAt: null,
          GeneratedFileId: userFile.GeneratedFileId,
        },
      });

      console.warn('Pending files include: ', pendingUserFiles);

      /*
        If there are no more user files pending upload to S3 (i.e. Status = DRAFT, or "pending"), then we can trigger the creation of the pdf for all related user files.
      */
      if (pendingUserFiles?.length === 0) {
        console.warn('queue url: ', DOCUMENT_GENERATOR_QUEUE_URL);
        await sendMessageToQueue(
          DOCUMENT_GENERATOR_QUEUE_URL!,
          { generatedFileId: userFile.GeneratedFileId },
          userFile.GeneratedFileId!,
        );
      }

      processedFiles.push(filePath);
    }

    return { processedFiles };
  }
};
