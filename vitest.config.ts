import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 30000,
        hookTimeout: 30000,
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        reporters: ['verbose'],
        sequence: {
            hooks: 'stack',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
