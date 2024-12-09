import { GeneratedFile, UserFile } from '@prisma/client';
import gm from 'gm';
import { PDFDocument, PDFImage } from 'pdf-lib';
import fs from 'fs';
import { downloadObject } from './s3';
import path from 'path';
import imageSize from 'image-size';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';

const pageWidth = 612;
const pageHeight = 792;

export async function generatePDF(bucketName: string, document: GeneratedFile, documentFiles: UserFile[]) {
  console.log(`Processing multipage document:
      ${JSON.stringify(document, null, 2)}
      `);
  const pdfDoc = await PDFDocument.create();
  const files = documentFiles || [];
  const savedFiles = await downloadDocumentFiles(bucketName, documentFiles);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let embedContent;
    console.log(`Processing file type: ${file.ContentType}`);

    const imgWidth = 500;
    const imgMargin = (pageWidth - imgWidth) / 2;
    let imageDims: ISizeCalculationResult = { height: 0, width: 0 };
    let resizedImage: Buffer = Buffer.from([]);
    if (!file.ContentType?.includes('pdf')) {
      const imgSrc = savedFiles[file.id];
      resizedImage = await getResizedImage(imgSrc, imgWidth);
      imageDims = imageSize(resizedImage);
    }

    if (file.ContentType?.includes('jpeg')) {
      console.log('embedding jpeg...');
      embedContent = await pdfDoc.embedJpg(resizedImage);
    } else if (file.ContentType?.includes('png')) {
      console.log('embedding png...');
      embedContent = await pdfDoc.embedPng(resizedImage);
    } else if (file.ContentType?.includes('pdf')) {
      console.log('embedding pdf...');
      const fileContentBuffer = fs.readFileSync(savedFiles[file.id]);
      var bytes = new Uint8Array(fileContentBuffer);
      const loadedPdf = await PDFDocument.load(bytes);
      const totalPages = loadedPdf.getPageCount();
      const copyPageIndices = [];
      for (let i = 0; i < totalPages; i++) {
        copyPageIndices.push(i);
      }
      const copiedPages = await pdfDoc.copyPages(loadedPdf, copyPageIndices);
      copiedPages.forEach(p => pdfDoc.addPage(p));
    } else {
      throw new Error('File must be jpeg, png or pdf');
    }

    if (embedContent instanceof PDFImage) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embedContent, {
        x: imgMargin,
        y: pageHeight - imgMargin - imageDims.height!,
      });
    }
  }

  console.log('Completed embedding images to pdf. Generating bytestream...');
  const bytesFile = await pdfDoc.save();
  const outputPdfFilepath = path.join('/tmp/', `${document.id}.pdf`);
  fs.writeFileSync(outputPdfFilepath, bytesFile);
  console.log('PDF bytestream generation complete. Returning raw data.');
  console.log('Generating thumbnail from first page...');
  const outputPdfThumbnailFilepath = await createThumbnail(outputPdfFilepath);
  const previewImageFilePath = await createThumbnail(outputPdfFilepath, 2480, 3508, '_preview.png');
  return { outputPdfFilepath, outputPdfThumbnailFilepath, previewImageFilePath };
}

const downloadDocumentFiles = async (bucketName: string, files: Array<UserFile>) => {
  const savedFiles: Record<string, string> = {};
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileSavePath = path.join('/tmp/', file.id);
    console.log(`attempting to download file ${file.FilePath} to ${fileSavePath}`);
    await downloadObject(bucketName, file.FilePath!, fileSavePath);
    savedFiles[file.id] = fileSavePath;
  }
  console.log(`Multipage Document saved files for processing:
    ${JSON.stringify(savedFiles, null, 2)}
    `);
  return savedFiles;
};

const createThumbnail = (inputPath: string, width = 128, height = 128, extension = '.png') => {
  const outputPath = `${inputPath.replace('.pdf', extension)}`;
  return new Promise<string>((resolve, reject) => {
    gm(`${inputPath}[0]`)
      .setFormat('png')
      .resize(width, height)
      .extent(width, height)
      // .quality(75) // Quality from 0 to 100
      .write(outputPath, function (error) {
        // Callback function executed when finished
        if (!error) {
          console.log('Finished saving png thumbnail of pdf.');
          resolve(outputPath);
        } else {
          console.log(`There was an error saving png thumbnail of pdf:
              ${JSON.stringify(error, null, 2)}
              `);
          reject(error);
        }
      });
  });
};

const getResizedImage = (inputPath: string, width: number) => {
  return new Promise<Buffer>((resolve, reject) => {
    gm(inputPath)
      .autoOrient()
      .resize(width) // Resize to fixed 128px width, maintaining aspect ratio
      .toBuffer(function (error: any, buffer: Buffer) {
        if (!error) {
          resolve(buffer);
        } else {
          console.log(`There was an error getting resized image buffer:
          ${JSON.stringify(error, null, 2)}
          `);
          reject(error);
        }
      });
  });
};
