const fs = require('fs');
const path = require('path');

module.exports = async function (context) {
    const resourcesDir = context.appOutDir;
    const localesDir = path.join(resourcesDir, 'locales');

    if (!fs.existsSync(localesDir)) return;

    const keep = new Set(['ko.pak', 'en-US.pak']);
    fs.readdirSync(localesDir).forEach((file) => {
        if (!keep.has(file)) {
            fs.unlinkSync(path.join(localesDir, file));
        }
    });

    console.log('locales trimmed');
};
