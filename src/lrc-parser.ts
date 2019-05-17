declare global {
    // tslint:disable-next-line: interface-name
    interface String {
        trimStart(): string;
        trimEnd(): string;
    }
}

export type Fixed = 0 | 1 | 2 | 3;

export interface ILyric {
    time?: number;
    text: string;
}

export type State = Readonly<{
    info: Map<string, string>;
    lyric: readonly ILyric[];
}>;

export type TrimOptios = Partial<{
    trimStart: boolean;
    trimEnd: boolean;
}>;

export const parser = (lrcString: string, option: TrimOptios = {}): State => {
    const { trimStart = false, trimEnd = false } = option;

    const lines = lrcString.split(/\r\n|\n|\r/);

    const timeTag = /\[\s*(\d{1,3}):(\d{1,2}(?:[:.]\d{1,3})?)\s*]/g;
    const infoTag = /\[\s*(\w{1,6})\s*:(.*?)]/;

    const info: Map<string, string> = new Map();
    const lyric: ILyric[] = [];

    for (const line of lines) {
        if (line[0] !== "[") {
            lyric.push({
                text: line,
            });
            continue;
        }

        // now, line starts with "["
        timeTag.lastIndex = 0;
        const rTimeTag = timeTag.exec(line);
        if (rTimeTag !== null) {
            const mm = Number.parseInt(rTimeTag[1], 10);
            const ss = Number.parseFloat(rTimeTag[2].replace(":", "."));
            const text = line.slice(timeTag.lastIndex);

            lyric.push({
                time: mm * 60 + ss,
                text,
            });

            continue;
        }

        const rInfoTag = infoTag.exec(line);
        if (rInfoTag !== null) {
            const value = rInfoTag[2].trim();

            if (value === "") {
                continue;
            }

            info.set(rInfoTag[1], value);

            continue;
        }

        // if we reach here, it means this line starts with "[",
        // but not match time tag or info tag.

        lyric.push({
            text: line,
        });
    }

    if (trimStart || trimEnd) {
        lyric.forEach((line) => {
            if (trimStart) {
                line.text = line.text.trimStart();
            }
            if (trimEnd) {
                line.text = line.text.trimEnd();
            }
        });
    }

    return { info, lyric };
};

const storedFormaTter = new Map<Fixed, Intl.NumberFormat>();

const getFormatter = (fixed: Fixed) => {
    if (storedFormaTter.has(fixed)) {
        return storedFormaTter.get(fixed)!;
    } else {
        const newFormatter = new Intl.NumberFormat("en", {
            minimumIntegerDigits: 2,
            minimumFractionDigits: fixed,
            maximumFractionDigits: fixed,
        });
        storedFormaTter.set(fixed, newFormatter);
        return newFormatter;
    }
};

export const convertTimeToTag = (time: number | undefined, fixed: Fixed, withBrackets = true) => {
    if (time === undefined) {
        return "";
    }

    const formatter = getFormatter(fixed);

    const mm = Math.floor(time / 60)
        .toString()
        .padStart(2, "0");
    const ss = formatter.format(time % 60);

    return withBrackets ? `[${mm}:${ss}]` : `${mm}:${ss}`;
};

export const formatText = (text: string, spaceStart: number, spaceEnd: number) => {
    let newText = text;
    if (spaceStart >= 0) {
        newText = " ".repeat(spaceStart) + newText.trimStart();
    }
    if (spaceEnd >= 0) {
        newText = newText.trimEnd() + " ".repeat(spaceEnd);
    }
    return newText;
};

export interface IFormatOptions {
    spaceStart: number;
    spaceEnd: number;
    fixed: Fixed;
    endOfLine?: "\n" | "\r\n" | "\r";
}

export const stringify = (state: State, option: IFormatOptions): string => {
    const { spaceStart, spaceEnd, fixed, endOfLine = "\r\n" } = option;

    const infos = Array.from(state.info.entries()).map(([name, value]) => {
        return `[${name}: ${value}]`;
    });

    const lines = state.lyric.map((line) => {
        if (line.time === undefined) {
            return line.text;
        }
        const text = formatText(line.text, spaceStart, spaceEnd);

        return `${convertTimeToTag(line.time, fixed)}${text}`;
    });
    return infos.concat(lines).join(endOfLine);
};
