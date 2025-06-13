// src/swagger.ts
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import swaggerConstant from './common/constants/swagger';

async function generateSwaggerJson() {
  const app = await NestFactory.create(AppModule, { logger: false });
  // Swagger 설정: 필요에 따라 변경
  const config = new DocumentBuilder()
    .setTitle(swaggerConstant.name)
    .setDescription(swaggerConstant.description)
    .setVersion(swaggerConstant.version)
    .addBearerAuth() // JWT 인증을 사용한다면
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // dist 폴더에 swagger.json으로 저장
  const outputPath = join(process.cwd(), 'docs', 'swagger.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`✔️ Swagger JSON generated at: ${outputPath}`);
  await app.close();
}

generateSwaggerJson()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
