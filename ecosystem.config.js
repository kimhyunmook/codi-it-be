module.exports = {
  apps: [
    {
      name: 'codiit-be', // 앱 이름
      script: './dist/main.js', // 빌드된 엔트리 파일 경로
      instances: 2, // 실행 인스턴스 수 (CPU 코어 수 만큼 하려면 0 또는 'max')
      exec_mode: 'cluster', // 실행 모드: fork 또는 cluster
      watch: false, // 변경 감지 자동 재시작 여부
      env: {
        PORT: 3000,
      },
    },
  ],
};
