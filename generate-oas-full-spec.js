#!/usr/bin/env node

/*
Usage:
npm run generate-swagger --args path/to/config/file output/directory
*/

const path = require('path');
const fs = require('fs');
const rootSpec = require('./swagger-baseline.js');
const { paths, components } = require('./route-modules-oas.json');

// rootSpec.tags = [];
rootSpec.paths = {};
rootSpec.paths = {
  ...rootSpec.paths,
  ...paths,
};
rootSpec.components = {
  ...rootSpec.components,
  ...components,
};
fs.writeFileSync(path.join(process.cwd(), 'custom-swagger.json'), JSON.stringify(rootSpec));
console.log(JSON.stringify(rootSpec));