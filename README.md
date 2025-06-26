🛍️ CODI-IT (BACK-END)
코딩 교육 수강생들을 위한 전문 쇼핑몰 백엔드 API 서버입니다.

📋 프로젝트 개요
CODI-IT은 코딩 교육 관련 상품(강의, 도서, 장비 등)을 판매하는 B2C 쇼핑몰의 백엔드 시스템입니다. RESTful API를 통해 사용자 관리, 상품 관리, 주문 처리, 결제 시스템을 제공합니다.

🛠 기술 스택
Core Technologies
Backend Framework: NestJS ^11.0.1
Database: PostgreSQL
ORM: Prisma ^6.8.2
Language: TypeScript ^5.7.3
Authentication & Security
JWT: @nestjs/jwt, jsonwebtoken
Password Hashing: bcrypt ^6.0.0
Authentication Strategy: Passport.js with JWT
Cloud & Storage
Cloud Storage: AWS S3 (@aws-sdk/client-s3)
File Upload: Multer with S3 integration
Deployment: AWS EC2, RDS
API Documentation
Documentation: Swagger UI (@nestjs/swagger)
API Testing: Built-in Swagger interface
Development Tools
Validation: class-validator, class-transformer
Testing: Jest, Supertest
Code Quality: ESLint, Prettier
Build Tool: SWC for faster compilation
🚀 주요 기능
👤 사용자 관리
회원가입/로그인 (JWT 기반 인증)
사용자 프로필 관리
권한 기반 접근 제어
📦 상품 관리
상품 CRUD 작업
카테고리별 상품 분류
상품 이미지 업로드 (AWS S3)
재고 관리
🛒 주문 시스템
장바구니 관리
주문 생성 및 처리
주문 상태 추적
📊 관리자 기능
상품 관리 대시보드
주문 관리
사용자 관리
📁 프로젝트 구조
src/
├── common/         # 공통 모듈
│   ├── prisma/     # Prisma 설정 및 시드
│   ├── guards/     # 인증 가드
│   ├── decorators/ # 커스텀 데코레이터
│   └── filters/    # 예외 필터
└── modules/        # 비즈니스 로직 모듈
    ├── auth/       # 인증 모듈
    ├── users/      # 사용자 관리
    ├── products/   # 상품 관리
    ├── orders/     # 주문 처리
    └── uploads/    # 파일 업로드
🏃‍♂️ 실행 방법
환경 설정
bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 데이터베이스 및 AWS 설정 추가
데이터베이스 설정
bash
# Prisma 마이그레이션 및 시드 실행
npm run prisma:migrate

# 개발용 시드 데이터 추가
npm run prisma:seed

# Prisma Studio 실행 (선택사항)
npm run prisma:studio
서버 실행
bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm run start:prod
📚 API 문서
서버 실행 후 http://localhost:3000/api 에서 Swagger 문서를 확인할 수 있습니다.

🧪 테스트
bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
🔧 개발 도구
bash
# 코드 포맷팅
npm run format

# 린팅
npm run lint

# Swagger 문서 빌드
npm run swagger:b
🌟 프로젝트 특징
확장 가능한 아키텍처: NestJS의 모듈 시스템을 활용한 깔끔한 구조
타입 안전성: TypeScript와 Prisma를 통한 end-to-end 타입 안전성
클라우드 네이티브: AWS 서비스와의 완전한 통합
자동화된 배포: GitHub Actions를 통한 CI/CD 파이프라인
실시간 API 문서: Swagger를 통한 자동 생성 API 문서
포괄적인 테스트: 단위 테스트 및 E2E 테스트 커버리지
🚀 배포
Server: AWS EC2
Database: AWS RDS (PostgreSQL)
Storage: AWS S3
CI/CD: GitHub Actions
🔍 주요 학습 포인트
이 프로젝트를 통해 다음과 같은 기술들을 학습하고 적용했습니다:

대규모 Node.js 애플리케이션 아키텍처 설계
RESTful API 설계 및 구현
데이터베이스 모델링 및 최적화
클라우드 서비스 통합
보안 및 인증 시스템 구현
테스트 주도 개발 (TDD)
CI/CD 파이프라인 구축
