var s3Files = require('s3-files')

var region = 'us-west-2'
var bucket = 'mur-sst'
var folder = 'zarr-v1'
// Create a stream of keys.
var keyStream = s3Files
  .connect({
    region: region,
    bucket: bucket,
    credenti
  })
  .createKeyStream(folder, ['*'])

// Stream the files.
s3Files.createFileStream(keyStream)
  .on('data', function (chunk) {
    console.log(chunk.path, chunk.data.length);
  })

console.log(keyStream);