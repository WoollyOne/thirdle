import { TestFramework } from "./ts/spec/testframework";

export class TestRunner {
    constructor() {
        this.registerTests();
    }

    public registeredTests: TestFramework[] = [];

    public registerTests() {
    }

    public runTests() {
        let total = this.registeredTests.length;
        let test = 1;
        let failures = 0;
        let successes = 0;

        console.log(`>>>>>> RUNNING ${total} TEST(S)...`)
        for (let registeredTest of this.registeredTests) {
            console.log(`>>>> BEGIN TEST ${test}/${total}: ${registeredTest.name}`);
            const result = registeredTest.runTestSuite();

            if (result) {
                console.log(">>>> TEST PASSED");
            } else {
                console.log(">>>> TEST FAILED");
            }

            console.log(`>>>> END TEST ${test}/${total}: ${registeredTest.name}`);
            test++;
        }
    }
}