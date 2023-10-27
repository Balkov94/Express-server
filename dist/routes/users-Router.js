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
const mongodb_1 = require("mongodb");
const router = express.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUsers = yield req.app.locals.db.collection("users").find().toArray();
        const result = (0, utils_1.replaceUnderscoreId)(allUsers);
        res.status(200).json(result);
    }
    catch (err) {
        (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
    }
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    try {
        const currUser = yield req.app.locals.db.collection("users").findOne({ _id: new mongodb_1.ObjectId(params.id) });
        if (!currUser) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `User with ID=${req.params.id} does not exist`);
            return;
        }
        const result = (0, utils_1.replaceUnderscoreId)(currUser);
        res.status(200).json(result);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid User data`, errors);
    }
}));
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
                mail: 'required|email',
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
                    const result = (0, utils_1.replaceUnderscoreId)(newUser);
                    res.status(201)
                        .location(`http://${server_1.HOSTNAME}:${server_1.PORT}/api/AllUsers/${insertedId}`)
                        .json(result);
                }
            }
            catch (err) {
                console.error(`Unable to create User`);
                console.error(err);
                (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
router.put("/Edit-form:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    const oldUser = yield req.app.locals.db.collection('users').findOne({ _id: new mongodb_1.ObjectId(params.id) });
    if (!oldUser) {
        (0, utils_1.sendErrorResponse)(req, res, 404, `User with ID=${params.id} does not exist`);
        return;
    }
    const updatedUser = req.body;
    if (oldUser._id.toString() !== updatedUser.id) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `User ID=${updatedUser.id} does not match URL ID=${params.id}`);
        return;
    }
    try {
        yield indicative.validator.validate(updatedUser, {
            id: 'required|regex:^[0-9a-f]{24}$',
            fname: 'required|string|min:2',
            lname: 'required|string|min:2',
            username: 'required|string|min:5|max:15',
            password: 'required|string|min:5',
            phone: 'string|min:10|max:10',
            mail: 'required|email',
            description: 'string',
            role: 'required',
            status: 'required',
            timeOfCreation: 'required|string',
            timeOfModification: 'string'
        });
        try {
            const usernameCheck = yield req.app.locals.db.collection("users").findOne({ username: updatedUser.username });
            const mailCheck = yield req.app.locals.db.collection("users").findOne({ mail: updatedUser.mail });
            if (usernameCheck !== null && String(usernameCheck._id) !== params.id) {
                (0, utils_1.sendErrorResponse)(req, res, 400, `Server error: Username is already taken`);
                return;
            }
            if (mailCheck !== null && String(mailCheck._id) !== params.id) {
                (0, utils_1.sendErrorResponse)(req, res, 400, `Server error: E-mail is already taken`);
                return;
            }
            delete updatedUser.id;
            const { acknowledged, modifiedCount } = yield req.app.locals.db.collection('users').replaceOne({ _id: new mongodb_1.ObjectId(params.id) }, updatedUser);
            if (acknowledged && modifiedCount === 1) {
                res.json(updatedUser);
            }
            else {
                (0, utils_1.sendErrorResponse)(req, res, 500, `Unable to update User: ${updatedUser.id}: ${updatedUser.title}`);
                return;
            }
        }
        catch (err) {
            console.error(err);
            (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
        }
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    try {
        const deleteUser = yield req.app.locals.db.collection('users').findOneAndDelete({ _id: new mongodb_1.ObjectId(params.id) });
        if (!deleteUser.ok) {
            (0, utils_1.sendErrorResponse)(req, res, 500, `Error deleting the document in Mongodb`);
            return;
        }
        if (deleteUser.lastErrorObject.n === 0) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `User with ID=${req.params.id} does not exist`);
            return;
        }
        res.status(200).json(deleteUser.value);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid User data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
exports.default = router;
//# sourceMappingURL=users-Router.js.map