import typescript from "rollup-plugin-typescript2";

const input = "src/lrc-parser.ts";

export default [
    {
        input,
        output: {
            file: "build/umd/lrc-parser.js",
            name: "lrcParser",
            format: "umd",
            sourcemap: true,
        },

        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        outDir: "build/umd/",
                    },
                },
            }),
        ],
    },
    {
        input,
        output: {
            file: "build/es6/lrc-parser.js",
            name: "lrcParser",
            format: "umd",
            sourcemap: true,
        },

        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        target: "es2015",
                        outDir: "build/es6/",
                    },
                },
            }),
        ],
    },
    {
        input,
        output: {
            file: "build/es5/lrc-parser.js",
            name: "lrcParser",
            format: "umd",
            sourcemap: true,
        },

        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        target: "es5",
                        outDir: "build/es5/",
                    },
                },
            }),
        ],
    },
];
