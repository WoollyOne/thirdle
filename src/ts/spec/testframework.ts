export interface TestFramework {
    runTestSuite(): boolean;
    name: string;
}