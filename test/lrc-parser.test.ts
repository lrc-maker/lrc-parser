import { expect } from "chai";
import { readFileSync } from "fs";
import "mocha";
import { resolve } from "path";
import { parser, stringify } from "../src/lrc-parser";

const sampleText = readFileSync(resolve(__dirname, "sample-nami.lrc"), "utf8");
const sampleJson = readFileSync(resolve(__dirname, "sample-nami.json"), "utf8");
const sampleData = JSON.parse(sampleJson);

describe("parser test", () => {
    it("should parse empty string", () => {
        const result = parser("");

        expect(result).to.be.a("object");
        expect(result).has.property("info").which.to.be.empty;
        expect(result)
            .has.property("lyric")
            .with.lengthOf(1);
    });

    it("should parse lrc meta tags", () => {
        const { info, lyric } = parser("[hello: world]");

        expect(info).has.all.keys("hello");
        expect(info).to.include("world");

        expect(lyric).is.empty;
    });

    it("should parse nonstandard tags", () => {
        const { info, lyric } = parser(
            [
                "[ ar: akari  ]",
                "[tool  : lrc-maker]",
                "[01:02:03]hello world",
                "[ 1:04.5]hello lrc-maker",
                "[02:3.4 ]end",
            ].join("\n"),
        );

        expect(info.get("ar")).equal("akari");
        expect(info.get("tool")).equal("lrc-maker");

        expect(lyric).deep.equal([
            { time: 62.03, text: "hello world" },
            { time: 64.5, text: "hello lrc-maker" },
            { time: 123.4, text: "end" },
        ]);
    });

    it("should parse lrc with trim options", () => {
        const { info, lyric } = parser(sampleText, { trimStart: true, trimEnd: true });

        const infoObj = Array.from(info).reduce(
            (obj, [key, value]) => {
                obj[key] = value;
                return obj;
            },
            {} as Record<string, string>,
        );

        expect(infoObj).deep.equal(sampleData.info);
        expect(lyric).deep.equal(sampleData.lyric);
    });
});

describe("stringify test", () => {
    const defaultOptions = {
        fixed: 3 as 0 | 1 | 2 | 3,
        spaceStart: 1,
        spaceEnd: 0,
    };

    it("should stringify empty data", () => {
        const result = stringify(
            {
                info: new Map(),
                lyric: [],
            },
            defaultOptions,
        );
        expect(result).equal("");
    });

    it("should stringify info tags", () => {
        const endOfLine = "\r\n";
        const result = stringify(
            {
                info: new Map([["ti", "test"], ["ar", "akari"]]),
                lyric: [],
            },
            {
                ...defaultOptions,
                endOfLine,
            },
        );
        expect(result).equal(["[ti: test]", "[ar: akari]"].join(endOfLine));
    });

    it("should stringify lyric tags", () => {
        const endOfLine = "\r\n";
        const result = stringify(
            {
                info: new Map(),
                lyric: [{ time: 1, text: "hello" }, { time: 2, text: "world" }],
            },
            {
                ...defaultOptions,
                endOfLine,
            },
        );
        expect(result).equal(["[00:01.000] hello", "[00:02.000] world"].join(endOfLine));
    });

    const defaultData = {
        info: new Map([["ti", "test"]]),
        lyric: [{ time: 1, text: "  hello  " }, { time: 2, text: "   world   " }],
    };

    it("should stringify with options", () => {
        const endOfLine = "\r\n";

        expect(stringify(defaultData, defaultOptions)).equal(
            ["[ti: test]", "[00:01.000] hello", "[00:02.000] world"].join(endOfLine),
        );

        expect(stringify(defaultData, { ...defaultOptions, endOfLine: "\n" })).equal(
            ["[ti: test]", "[00:01.000] hello", "[00:02.000] world"].join("\n"),
        );

        expect(stringify(defaultData, { ...defaultOptions, fixed: 0 })).equal(
            ["[ti: test]", "[00:01] hello", "[00:02] world"].join(endOfLine),
        );

        expect(stringify(defaultData, { ...defaultOptions, fixed: 1 })).equal(
            ["[ti: test]", "[00:01.0] hello", "[00:02.0] world"].join(endOfLine),
        );

        expect(stringify(defaultData, { ...defaultOptions, fixed: 2 })).equal(
            ["[ti: test]", "[00:01.00] hello", "[00:02.00] world"].join(endOfLine),
        );

        expect(stringify(defaultData, { ...defaultOptions, spaceStart: -1 })).equal(
            ["[ti: test]", "[00:01.000]  hello", "[00:02.000]   world"].join(endOfLine),
        );

        expect(stringify(defaultData, { ...defaultOptions, spaceStart: 2 })).equal(
            ["[ti: test]", "[00:01.000]  hello", "[00:02.000]  world"].join(endOfLine),
        );

        expect(stringify(defaultData, { ...defaultOptions, spaceEnd: -1 })).equal(
            ["[ti: test]", "[00:01.000] hello  ", "[00:02.000] world   "].join(endOfLine),
        );
    });

    it("should stringify text", () => {
        const result = stringify(
            {
                info: new Map(Object.entries(sampleData.info)),
                lyric: sampleData.lyric,
            },
            defaultOptions,
        );

        expect(result).equal(sampleText);
    });
});
