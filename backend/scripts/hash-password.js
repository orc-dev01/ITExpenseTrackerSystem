const bcrypt = require('bcryptjs');

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: node backend/scripts/hash-password.js "StrongPasswordHere"');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
