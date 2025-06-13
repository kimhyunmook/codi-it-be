// script/copy/swagger-ui.js
const ncp = require('ncp').ncp;
const { join } = require('path');
const fs = require('fs');
const swaggerUiDist = require('swagger-ui-dist').getAbsoluteFSPath();

function copySwaggerUI() {
  const targetDir = join(__dirname, '../public/swagger-ui');
  // public/swagger-ui 폴더가 없으면 생성
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  // swagger-ui-dist 전체 복사
  ncp(swaggerUiDist, targetDir, function (err) {
    if (err) {
      return console.error(err);
    }
    console.log('✔️ Swagger UI files copied to public/swagger-ui');
  });
}

copySwaggerUI();
