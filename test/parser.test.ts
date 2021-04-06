import { assertEquals } from "https://deno.land/std@0.92.0/testing/asserts.ts";
import { parser } from "../src/lrc-parser.ts";

const sampleText = Deno.readTextFileSync(new URL("sample-nami.lrc", import.meta.url));

const sampleJson = Deno.readTextFileSync(new URL("sample-nami.json", import.meta.url));
const sampleData = JSON.parse(sampleJson);

Deno.test("should parse empty string", () => {
    const result = parser("");
    assertEquals(result, {
        info: new Map(),
        lyric: [
            {
                text: "",
            },
        ],
    });
});

Deno.test("should parse lrc meta tags", () => {
    const { info, lyric } = parser("[hello: world]");

    assertEquals(info, new Map([["hello", "world"]]));
    assertEquals(lyric, []);
});

Deno.test("should parse nonstandard tags", () => {
    const { info, lyric } = parser(
        [
            "[ ar: akari  ]",
            "[tool  : lrc-maker]",
            "[01:02:03]hello world",
            "[ 1:04.5]hello lrc-maker",
            "[02:3.4 ]end",
        ].join("\n"),
    );

    assertEquals(
        info,
        new Map([
            ["ar", "akari"],
            ["tool", "lrc-maker"],
        ]),
    );

    assertEquals(lyric, [
        { time: 62.03, text: "hello world" },
        { time: 64.5, text: "hello lrc-maker" },
        { time: 123.4, text: "end" },
    ]);
});

Deno.test("should parse lrc with trim options", () => {
    const { info, lyric } = parser(sampleText, { trimStart: true, trimEnd: true });

    assertEquals(info, new Map(Object.entries(sampleData.info)));
    assertEquals(lyric, sampleData.lyric);
});
