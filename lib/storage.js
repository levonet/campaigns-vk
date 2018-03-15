'use strict';

const fs = require('fs');
const os = require('os');
const log = require('./logger');

module.exports = {
    save(toFile, table, data, fields) {
        let query = `insert into ${table} (${fields.join(',')}) values` + os.EOL;
        let rows = data.map((row) => '(' + row.join(',') + ')');

        fs.writeFile(toFile, query + rows.join(',' + os.EOL) + ';' + os.EOL, (err) => {
            if (err) {
                log.error(new Error(err), `in fs.writeFile() file '${toFile}'`);
                process.exit(101);
            }
        });
    }
};
