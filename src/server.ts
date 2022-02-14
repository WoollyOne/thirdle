import { Request, Response } from "express";
import { TestRunner } from "./test_runner";

const path = require('path');
const express = require('express');
const openJs = require('open');

console.log("SERVER:", process.env.NODE_ENV);

if (!process.env.TEST) {
    // create express application
    const app = express();

    const port = 3002;
    const host = `http://127.0.0.1:${port}`;

    /*-------------------*/
    // endpoint to serve web assets
    app.use('/thirdle', express.static('dist/public'));

    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
    app.listen(port, async () => {
        console.log(`Thirdle is running on port ${port}!`);
        if (process.env.NODE_ENV && process.env.NODE_ENV === "development") {
            openJs(`${host}/thirdle`); // opens `web/index.html` page
        }
    });
} else {
    new TestRunner().runTests();
}