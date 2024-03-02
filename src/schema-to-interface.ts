import { convertFromDirectory } from 'joi-to-typescript';

convertFromDirectory({
  schemaDirectory: './src/lib/route-schemas',
  typeOutputDirectory: './src/lib/route-interfaces',
  debug: true,
});
