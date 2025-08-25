const fs = require('fs');
const path = require('path');

// Path to babel-loader index.js
const babelLoaderPath = path.join(__dirname, 'node_modules/babel-loader/lib/index.js');

// Read the current file
let content = fs.readFileSync(babelLoaderPath, 'utf8');

// Replace the problematic import
content = content.replace(
  'const validateOptions = require("schema-utils");',
  'const validateOptions = require("schema-utils");'
);

// Add a fallback for the validateOptions function
const fallbackCode = `
// Fallback for validateOptions if it doesn't exist
if (typeof validateOptions !== 'function') {
  const schemaUtils = require("schema-utils");
  if (typeof schemaUtils === 'function') {
    validateOptions = schemaUtils;
  } else if (schemaUtils && typeof schemaUtils.validate === 'function') {
    validateOptions = schemaUtils.validate;
  } else {
    validateOptions = function() { /* no-op */ };
  }
}
`;

// Insert the fallback code after the import
content = content.replace(
  'const validateOptions = require("schema-utils");',
  'const validateOptions = require("schema-utils");' + fallbackCode
);

// Write the patched file
fs.writeFileSync(babelLoaderPath, content);

console.log('✅ Babel-loader patched successfully!');