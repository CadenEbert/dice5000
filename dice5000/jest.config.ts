import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  projects: [
    {
      displayName: 'browser',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/app/**/*.test.{ts,tsx}',
        '<rootDir>/app/**/*.spec.{ts,tsx}',
      ],
      transform: {
        '^.+\\.(t|j)sx?$': ['@swc/jest', {
          jsc: {
            transform: {
              react: {
                runtime: 'automatic', 
              },
            },
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server.test.js'],
    },
  ],
}

export default createJestConfig(config)