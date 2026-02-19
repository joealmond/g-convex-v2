const fs = require('fs');
const { execSync } = require('child_process');

console.log('Uploading .env variables to Convex...');

if (!fs.existsSync('.env')) {
  console.error('Error: .env file not found in the root directory.');
  process.exit(1);
}

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');

let successCount = 0;
let failCount = 0;

for (const line of lines) {
  const trimmed = line.trim();
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) continue;

  const firstEq = trimmed.indexOf('=');
  if (firstEq === -1) continue;

  const key = trimmed.slice(0, firstEq).trim();
  let value = trimmed.slice(firstEq + 1).trim();

  // Remove wrapping quotes if they exist
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  } else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  }

  // Skip convex deployment which is internal
  if (key === 'CONVEX_DEPLOYMENT') continue;

  console.log(`Setting ${key}...`);
  try {
    // Escape quotes inside the value string
    const escapedValue = value.replace(/"/g, '\\"');
    execSync(`npx convex env set ${key} "${escapedValue}"`, { stdio: 'pipe' });
    successCount++;
  } catch (err) {
    console.error(`Failed to set ${key}: You may need to run this command when connected to Convex.`);
    failCount++;
  }
}

console.log(`\nFinished! Successfully uploaded ${successCount} variables. Failed: ${failCount}`);
