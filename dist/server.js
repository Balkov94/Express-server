"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.HOSTNAME = void 0;
const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const utils_1 = require("./utils");
const books_Router_1 = require("./routes/books-Router");
const comments_Router_1 = require("./routes/comments-Router");
const clubs_Router_1 = require("./routes/clubs-Router");
const users_Router_1 = require("./routes/users-Router");
const questions_Router_1 = require("./routes/questions-Router");
const login_Router_1 = require("./routes/login-Router");
const register_Router_1 = require("./routes/register-Router");
const mongodb_1 = require("mongodb");
exports.HOSTNAME = 'localhost';
exports.PORT = 8000;
//const dbUrl = `mongodb://localhost:27017`; NOT working need IP v6 / localhost!==IP v6
const dbUrl = `mongodb://127.0.0.1:27017`;
// got problen with configuration on mongodb as a service on (new work machine)
// 27.10.23 done some additional registration and configs now DB is migrated to Atlas (free 512mg cluster - ClusterO)
//const dbUrl = `mongodb+srv://balkov:8393356@cluster0.suzbtho.mongodb.net/?retryWrites=true&w=majority`;
const database = 'GoodBook';
const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE'
}));
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app
    .use('/api/ReadingClubs', clubs_Router_1.default)
    .use('/api/AllUsers', users_Router_1.default)
    .use('/api/QuestionRoom', questions_Router_1.default)
    .use('/api/ExchangePage', books_Router_1.default)
    .use('/api/Login', login_Router_1.default)
    .use('/api/Register', register_Router_1.default)
    .use('/api/', comments_Router_1.default)
    .use((req, res) => {
    (0, utils_1.sendErrorResponse)(req, res, 404, `This is not the page you are looking for...`);
});
app.use(function (err, req, res, next) {
    console.error(err.stack);
    (0, utils_1.sendErrorResponse)(req, res, err.status || 500, `Server error: ${err.message}`, err);
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const con = yield mongodb_1.MongoClient.connect(dbUrl);
    const db = con.db(database);
    app.locals.db = db;
    app.listen(exports.PORT, exports.HOSTNAME, () => {
        console.log(`HTTP Server listening on: http://${exports.HOSTNAME}:${exports.PORT}`);
    });
}))();
app.on('error', err => {
    console.log('Server error:', err);
});
//# sourceMappingURL=server.js.map