const nextJest = require('next/jest')
const path = require('path')

const createJestConfig = nextJest({
  dir: path.resolve(__dirname, './').replace(/\\/g, '/'),
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)

