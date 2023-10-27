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
const router = express.Router();
const usersDB = 'usersDB.json';
// Login (authentication)
//************************************** */
//some authentication stuff here
//************************************** */
router.post('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const currInput = new LoginInput(req.body.username, req.body.password);
        try {
            yield indicative.validator.validate(currInput, {
                username: 'required|string|min:2',
                password: 'required|string|min:2',
            });
            try {
                const user = yield req.app.locals.db.collection('users').findOne({ username: currInput.username });
                if (user && user.password === currInput.password) {
                    const result = (0, utils_1.replaceUnderscoreId)(user);
                    res.status(200).json(result);
                }
                else {
                    (0, utils_1.sendErrorResponse)(req, res, 400, `Wrong username or password.`);
                    return;
                }
            }
            catch (_a) {
                (0, utils_1.sendErrorResponse)(req, res, 400, `Wrong username or password.`);
                return;
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
exports.default = router;
class LoginInput {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
}
//# sourceMappingURL=login-Router.js.map