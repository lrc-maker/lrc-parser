import { assertEquals } from "https://deno.land/std@0.92.0/testing/asserts.ts";
import { stringify } from "../src/lrc-parser.ts";

const sampleText = Deno.readTextFileSync(new URL("sample-nami.lrc", import.meta.url));

const sampleJson = Deno.readTextFileSync(new URL("sample-nami.json", import.meta.url));
const sampleData = JSON.parse(sampleJson);

const defaultOptions = {
    fixed: 3 as 0 | 1 | 2 | 3,
    spaceStart: 1,
    spaceEnd: 0,
};

Deno.test("should stringify empty data", () => {
    const result = stringify(
        {
            info: new Map(),
            lyric: [],
        },
        defaultOptions,
    );

    assertEquals(result, "");
});

Deno.test("should stringify info tags", () => {
    const endOfLine = "\r\n";
    const result = stringify(
        {
            info: new Map([
                ["ti", "test"],
                ["ar", "akari"],
            ]),
            lyric: [],
        },
        {
            ...defaultOptions,
            endOfLine,
        },
    );
    assertEquals(result, ["[ti: test]", "[ar: akari]"].join(endOfLine));
});

Deno.test("should stringify lyric tags", () => {
    const endOfLine = "\r\n";
    const result = stringify(
        {
            info: new Map(),
            lyric: [
                { time: 1, text: "hello" },
                { time: 2, text: "world" },
            ],
        },
        {
            ...defaultOptions,
            endOfLine,
        },
    );
    assertEquals(result, ["[00:01.000] hello", "[00:02.000] world"].join(endOfLine));
});

const defaultData = {
    info: new Map([["ti", "test"]]),
    lyric: [
        { time: 1, text: "  hello  " },
        { time: 2, text: "   world   " },
    ],
};

Deno.test("should stringify with options", () => {
    const endOfLine = "\r\n";

    assertEquals(
        stringify(defaultData, defaultOptions),
        ["[ti: test]", "[00:01.000] hello", "[00:02.000] world"].join(endOfLine),
    );

    assertEquals(
        stringify(defaultData, { ...defaultOptions, endOfLine: "\n" }),
        ["[ti: test]", "[00:01.000] hello", "[00:02.000] world"].join("\n"),
    );

    assertEquals(
        stringify(defaultData, { ...defaultOptions, fixed: 0 }),
        ["[ti: test]", "[00:01] hello", "[00:02] world"].join(endOfLine),
    );

    assertEquals(
        stringify(defaultData, { ...defaultOptions, fixed: 1 }),
        ["[ti: test]", "[00:01.0] hello", "[00:02.0] world"].join(endOfLine),
    );

    assertEquals(
        stringify(defaultData, { ...defaultOptions, fixed: 2 }),
        ["[ti: test]", "[00:01.00] hello", "[00:02.00] world"].join(endOfLine),
    );

    assertEquals(
        stringify(defaultData, { ...defaultOptions, spaceStart: -1 }),
        ["[ti: test]", "[00:01.000]  hello", "[00:02.000]   world"].join(endOfLine),
    );

    assertEquals(
        stringify(defaultData, { ...defaultOptions, spaceStart: 2 }),
        ["[ti: test]", "[00:01.000]  hello", "[00:02.000]  world"].join(endOfLine),
    );

    assertEquals(
        stringify(defaultData, { ...defaultOptions, spaceEnd: -1 }),
        ["[ti: test]", "[00:01.000] hello  ", "[00:02.000] world   "].join(endOfLine),
    );
});

Deno.test("should stringify text", () => {
    const result = stringify(
        {
            info: new Map(Object.entries(sampleData.info)),
            lyric: sampleData.lyric,
        },
        defaultOptions,
    );

    assertEquals(result, sampleText);
});
