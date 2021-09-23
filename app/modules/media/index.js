const _ = require('lodash');
const rp = require('request-promise-native');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const config = require('../configuration').config();
const raven = require('../ravendb');
const map = require('../map');
const urls = require('../../utils/urls');
const { randomFileName } = require('../../utils/security');
const { tryExecuteAsync } = require('../../utils/common');
const { IMAGE_TYPES } = require('../../constants');

const sharedKeyCredential = new StorageSharedKeyCredential(config.azure.storage.account, config.azure.storage.accessKey);
const blobServiceClient = new BlobServiceClient(config.azure.storage.url, sharedKeyCredential);

const getImageQuery = (image) => {
  const parts = image.name.split('_');
  const name = parts
    .slice(0, parts.length - 1)
    .filter((p) => !/\d/.test(p))
    .join('-');
  return name.split('-');
};

const create = async (session, buffer, fileName, type, resourceId) => {
  const mediaType = type && _.map(IMAGE_TYPES, (e) => e).includes(type) ? type : IMAGE_TYPES.Cms;

  const image = new raven.Models.Image({
    mediaType,
    linkedTo: resourceId ? [resourceId] : [],
    container: mediaType,
    createdAt: new Date().toISOString(),
    size: Math.round(buffer.length / 1024), // KB,
    deleted: false,
  });

  await session.store(image);

  image.name = randomFileName(fileName, raven.utils.friendlyId(image.id), true);
  image.url = `${config.azure.storage.mediaUrl}/${mediaType}/${image.name}`;
  image.query = getImageQuery(image);

  const client = blobServiceClient.getContainerClient(mediaType);
  const blockClient = client.getBlockBlobClient(image.name);
  await blockClient.upload(buffer, buffer.length);

  return {
    success: true,
    image,
  };
};

const createFromUrl = async (session, url, fileName, type, resourceId) => {
  const imageOptions = {
    url,
    encoding: null,
    resolveWithFullResponse: true,
  };

  const buffer = await tryExecuteAsync(() => rp.get(imageOptions), true, false);

  if (!buffer.failed) return create(session, buffer.body, fileName, type, resourceId);

  return {
    success: false,
  };
};

const fix = async (doc, fileName, container, extension) => {
  const client = blobServiceClient.getContainerClient(container);
  const newFileName = fileName.replace(`.${extension}`, '.png');

  const blockClient = client.getBlockBlobClient(newFileName);
  const exists = await blockClient.exists();

  if (!exists) {
    const oldBlockClient = client.getBlockBlobClient(fileName);

    if (await oldBlockClient.exists()) {
      await blockClient.beginCopyFromURL(oldBlockClient.url);
      await oldBlockClient.delete();

      doc.url = `https://media.zesttee.com/${container}/${newFileName}`;
      doc.name = newFileName;
    }
  }
};

const query = async (request) => {
  const page = await request.context.session.search(raven.Models.Image);
  page.results = map.images(page.results);
  return page;
};

const remove = async (url, session) => {
  const fileNameParts = urls.getFilenameWithoutExtension(url).split('_');
  const id = fileNameParts[fileNameParts.length - 1];

  await session.patch({
    id: raven.Models.Image.getId(id),
    deleted: true,
  });

  return {
    success: true,
  };
};

module.exports = {
  create,
  createFromUrl,
  query,
  remove,
  fix,
  getImageQuery,
};
