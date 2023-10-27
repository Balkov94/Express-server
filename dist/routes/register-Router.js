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
const express = require("express");
const utils_1 = require("../utils");
const indicative = require("indicative");
const server_1 = require("../server");
const router = express.Router();
router.post('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newUser = req.body;
        try {
            yield indicative.validator.validate(newUser, {
                fname: 'required|string|min:2',
                lname: 'required|string|min:2',
                username: 'required|string|min:5|max:15',
                password: 'required|string|min:5',
                phone: 'string|min:10|max:10',
                mail: 'required|string',
                description: 'string',
                role: 'required',
                status: 'required',
                timeOfCreation: 'required|string',
                timeOfModification: 'string'
            });
            try {
                const usernameCheck = yield req.app.locals.db.collection("users").findOne({ username: newUser.username });
                const mailCheck = yield req.app.locals.db.collection("users").findOne({ mail: newUser.mail });
                if (usernameCheck) {
                    (0, utils_1.sendErrorResponse)(req, res, 400, `Server error: Username is already taken`);
                    return;
                }
                if (mailCheck) {
                    (0, utils_1.sendErrorResponse)(req, res, 400, `Server error: E-mail is already taken`);
                    return;
                }
                delete newUser.id;
                const { acknowledged, insertedId } = yield req.app.locals.db.collection('users').insertOne(newUser);
                if (acknowledged) {
                    res.status(201)
                        .location(`http://${server_1.HOSTNAME}:${server_1.PORT}/api/AllUsers/${insertedId}`)
                        .json(newUser);
                }
            }
            catch (err) {
                console.error(`Unable to create User`);
                console.error(err);
                (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid User data: ${errors === null || errors === void 0 ? void 0 : errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
exports.default = router;
//# sourceMappingURL=register-Router.js.map