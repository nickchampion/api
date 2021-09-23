const media = require('../../modules/media');
const exporter = require('../../modules/export');

class UploadController {
  async upload(request) {
    const result = await media.create(
      request.context.session.database,
      // eslint-disable-next-line no-underscore-dangle
      request.payload.file._data,
      request.payload.name || request.payload.file.hapi.filename,
      request.payload.type === 'undefined' ? undefined : request.payload.type,
      request.payload.id === 'undefined' ? undefined : request.payload.id,
    );
    return result.image;
  }

  async export(request, h) {
    const stream = await exporter.execute(request.context);
    return h
      .response(stream)
      .header('Content-Type', 'text/csv')
      .header('Access-Control-Expose-Headers', 'Content-Disposition')
      .header('Content-Disposition', `attachment; filename=${request.context.params.id}.csv`);
  }

  async deleteFile(request) {
    return media.remove(request.payload.url, request.context.session);
  }
}

module.exports = UploadController;
