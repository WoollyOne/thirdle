export interface GuessResult {
    resultType: GuessResultType,
    resultList: string[]
}

export enum GuessResultType {
    Win,
    Valid,
    Error,
}

export const LetterResultType = new Map<string, string>([
    ["wrong", "#111111"],
    ["match", "#00c839"],
    ["close", "#c8c100"],
    ["mixed", "#6b00c8"],
    ["default_value", "#00303c"]
]);