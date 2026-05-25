const { Parser } = require('json2csv');

function exportCSV(data, fields) {
  const parser = new Parser({ fields });
  return parser.parse(data);
}

module.exports = { exportCSV };
