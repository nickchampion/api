const { format } = require('fast-csv');
const { WriteStream } = require('../../utils/streams');
const exporters = require('./exporters');

async function execute(context) {
  const exporter = exporters[context.params.id];
  const info = exporter.info ? await exporter.info(context) : null;
  const stream = await context.session.database.advanced.stream(exporter.query(context));
  const output = new WriteStream();
  const csvStream = format({
    headers: exporter.headers(),
    writeHeaders: true,
    delimiter: ',',
  });

  csvStream.pipe(output);

  stream.on('data', (data) => {
    const row = exporter.format(data.document, info);

    if (Array.isArray(row)) {
      row.forEach((r) => {
        csvStream.write(r);
      });
    } else {
      csvStream.write(row);
    }
  });

  stream.on('end', async () => {
    csvStream.end();
  });

  return csvStream;
}

module.exports = {
  execute,
};
