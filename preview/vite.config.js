import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@feeds': path.resolve(
                __dirname,
                '../packages/splunk-one/src/main/webapp/components/visualizations'
            ),
        },
    },
});
