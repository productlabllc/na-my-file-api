import { SQSEvent } from 'aws-lambda';
import { getDB } from '../lib/db';
import { deleteQueueMessage, sendMessageToQueue } from '../lib/sqs';
import { generatePDF } from '../lib/pdf';
import { uploadObject } from '../lib/s3';
import { S3Prefix, USER_FILE_STATUS } from '../lib/constants';

export const handler = async (event: SQSEvent, context: any) => {
  const db = getDB();

  console.log('event', event);
  console.log('context', context);

  const { DOCUMENT_GENERATOR_QUEUE_URL, CLIENT_FILE_BUCKET_NAME } = process.env;

  for (const record of event.Records) {
    const data = JSON.parse(record.body) as { generatedFileId: string };

    const generatedFile = await db.generatedFile.findFirst({ where: { id: data.generatedFileId, DeletedAt: null } });

    const readyFiles = await db.userFile.findMany({
      where: {
        GeneratedFileId: data.generatedFileId,
        DeletedAt: null,
        Status: USER_FILE_STATUS.UPLOADED,
      },
    });

    if (!readyFiles.length) {
      await deleteQueueMessage(DOCUMENT_GENERATOR_QUEUE_URL!, record);
      throw `Generated file has no associated user files that has been uploaded: ${generatedFile?.id}`;
    }

    if (generatedFile) {
      const {
        outputPdfFilepath: pdfFilepath,
        outputPdfThumbnailFilepath: pdfThumbnailFilepath,
        previewImageFilePath,
      } = await generatePDF(
        CLIENT_FILE_BUCKET_NAME!,
        generatedFile,
        // make sure documents are sorted accordingly
        readyFiles.sort((a, b) => (a.PageNumber ?? 0) - (b?.PageNumber ?? 0)),
      );

      const ownerUser = readyFiles[0].OwnerUserId;

      const fileNameAr = generatedFile?.Title?.split('.') ?? [];
      fileNameAr.pop();
      const filename = fileNameAr.join('-').replace(/(\W+)/gi, '-');

      const s3PdfFileKey = `${S3Prefix.GENERATED_FILES}${ownerUser}/${generatedFile.id}.pdf`;
      const s3PdfThumbnailFileKey = `${S3Prefix.GENERATED_FILES}${ownerUser}/${generatedFile.id}.png`;
      const s3PdfPreviewFileKey = `${S3Prefix.GENERATED_FILES}${ownerUser}/${generatedFile.id}/preview.png`;

      console.log(
        `pdf processing complete... uploading pdf to bucket as key: 
        ${s3PdfFileKey}`,
      );

      const uploadPdfResponse = await uploadObject(CLIENT_FILE_BUCKET_NAME!, pdfFilepath, s3PdfFileKey, {
        ContentType: 'application/pdf',
        ContentDisposition: `inline; filename="${filename}.pdf"`,
      });

      const uploadPdfThumbnailResponse = await uploadObject(
        CLIENT_FILE_BUCKET_NAME!,
        pdfThumbnailFilepath,
        s3PdfThumbnailFileKey,
        {
          ContentType: 'image/png',
          ContentDisposition: `inline; filename="${filename}.png"`,
        },
      );

      const uploadPreviewResponse = await uploadObject(
        CLIENT_FILE_BUCKET_NAME!,
        previewImageFilePath,
        s3PdfPreviewFileKey,
        {
          ContentType: 'image/png',
          ContentDisposition: `inline; filename="${filename}-preview.png"`,
        },
      );

      console.log(`s3 upload pdf response: 
      ${JSON.stringify(uploadPdfResponse, null, 2)}

      thumbnail response:
      ${JSON.stringify(uploadPdfThumbnailResponse, null, 2)}

      image preview response:
      ${JSON.stringify(uploadPreviewResponse, null, 2)}
      `);

      // Update Generated File with status and content type and original file name.
      await db.generatedFile.update({
        where: {
          id: generatedFile.id,
        },
        data: {
          Status: USER_FILE_STATUS.UPLOADED,
          OriginalFilename: (generatedFile.OriginalFilename?.split('.').shift() ?? generatedFile.Title) + '.pdf',
        },
      });

      await deleteQueueMessage(DOCUMENT_GENERATOR_QUEUE_URL!, record);
    } else {
      await deleteQueueMessage(DOCUMENT_GENERATOR_QUEUE_URL!, record);
      throw `Generated file ${data.generatedFileId} does not exists`;
    }
  }
};
