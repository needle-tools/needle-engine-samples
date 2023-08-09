import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';


import { sveltekit } from '@sveltejs/kit/vite';

// https://github.com/sapphi-red/vite-plugin-static-copy#usage
import { viteStaticCopy } from 'vite-plugin-static-copy'

const files = [];

export default defineConfig(async ({ command }) => {
    const { needlePlugins, useGzip, loadConfig } = await import("@needle-tools/engine/plugins/vite/index.js");
    const needleConfig = await loadConfig();
    return {
        plugins: [
            mkcert(),
            // useGzip(needleConfig) ? viteCompression({ deleteOriginFile: true }) : null,
            needlePlugins(command, needleConfig),
            viteStaticCopy({
                targets: files.map((file) => {
                    return {
                        src: file.path,
                        dest: "downloads",
                    }
                }),
            }),
            sveltekit(),
        ],
        server: {
            port: 3000,
            fs: {
                strict: false,
            },
        },
        build: {
            emptyOutDir: true,
            keepNames: true,
        }
    }
});