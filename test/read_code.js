const fs          = require('fs');

exports.ReadCode = (path) => {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err)
      console.log(err);
    else
      console.log(data);
  });
}