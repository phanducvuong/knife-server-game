const fs            = require('fs');
const readLine      = require('readline');
const path          = require('path');
const DS            = require('../repository/datastore');
const { clearLsNotificaBanner } = require('../redis/redis_client');

exports.ReadCode = (filename) => {
  const fileStream  = fs.createReadStream(path.join(__dirname, filename));
  const rl          = readLine.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let markup      = '';
  let lineNumber  = 0;
  let nameFile    = 0;
  rl.on('line', async (line) => {
    lineNumber++;
    markup += `${line}\n`;
    if (lineNumber === 30000) {
      nameFile++;
      lineNumber = 0;
      fs.writeFileSync(path.join(__dirname, `${nameFile}.txt`), markup);
      markup = '';
    }
  });
}

exports.importCode = (filename) => {
  const fileStream  = fs.createReadStream(path.join(__dirname, filename));
  const rl          = readLine.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let arr   = [];

  fs.readFile(path.join(__dirname, filename), 'utf8', async(err,data) => {
    let split = data.split('\n');
    for (let s of split) {
      let ss = s.split('\t');
      if (ss[0] !== undefined && ss[1] !== undefined) {
        arr.push({
          id    : ss[0].trim(),
          code  : ss[1].trim()
        });
      }
    }

    for (let d of arr) {
      let result = await DS.DSImportCode('codes', d['id'], {
        code  : d['code'],
        used  : 0
      });

      if (result === null) {
        console.log('ERROR');
        process.exit(0);
      }
    }
    console.log('done!');

  });
}