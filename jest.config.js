/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // 1. Diciamo a Jest di cercare i test SOLO nella cartella "test"
  roots: ['<rootDir>/tests'],
  
  // 2. Diciamo a Jest di eseguire SOLO i file che finiscono con ".test.ts"
  testMatch: ['**/*.test.ts'],
  
  // 3. Ignoriamo esplicitamente la cartella dei file compilati (se si chiama dist o build)
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/']
};