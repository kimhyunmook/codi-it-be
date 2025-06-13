// script/copy/deploy-swagger-to-docs.js
const { join } = require('path');
const fs = require('fs-extra');

async function copyToDocs() {
  const fromDir = join(__dirname, '../public/swagger-ui');
  const toDir = join(__dirname, '../docs/swagger-ui');

  try {
    // 기존 docs/swagger-ui 삭제 후 복사
    await fs.remove(toDir);
    await fs.copy(fromDir, toDir);
    console.log('✔️ Swagger UI static files copied to docs/swagger-ui');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

copyToDocs();
