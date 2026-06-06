const fs = require('fs');
const path = require('path');

const projectFile = path.join(__dirname, 'ios', 'edeen.xcodeproj', 'project.pbxproj');
let content = fs.readFileSync(projectFile, 'utf8');

// Update Bundle ID
content = content.replace(
  /PRODUCT_BUNDLE_IDENTIFIER = "org\.reactjs\.native\.example\.\$\(PRODUCT_NAME:rfc1034identifier\)";/g,
  'PRODUCT_BUNDLE_IDENTIFIER = app.hashstack.edeen;'
);

// Update Marketing Version to 1.5
content = content.replace(
  /MARKETING_VERSION = 1\.0;/g,
  'MARKETING_VERSION = 1.5;'
);

fs.writeFileSync(projectFile, content);
console.log('✅ iOS configuration updated successfully');
console.log('   - Bundle ID: app.hashstack.edeen');
console.log('   - Version: 1.5');
console.log('   - Build: 5');
