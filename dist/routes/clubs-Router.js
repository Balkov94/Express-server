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
        const allClubs = yield req.app.locals.db.collection("clubs").find().toArray();
        const result = (0, utils_1.replaceUnderscoreId)(allClubs);
        res.status(200).json(result);
    }
    catch (err) {
        (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
    }
}));
router.get('/club:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    try {
        const currClub = yield req.app.locals.db.collection("clubs").findOne({ _id: new mongodb_1.ObjectId(params.id) });
        if (!currClub) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Club with ID=${req.params.id} does not exist`);
            return;
        }
        const result = (0, utils_1.replaceUnderscoreId)(currClub);
        res.status(200).json(result);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Club data`, errors);
    }
}));
router.post('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newClub = req.body;
        try {
            yield indicative.validator.validate(newClub, {
                creatorId: 'required',
                name: 'required|string|min:2|max:22',
                interests: 'array|min:2|max:6',
                participants: 'array|min:1',
                banned: 'array'
            });
            try {
                delete newClub.id;
                const { acknowledged, insertedId } = yield req.app.locals.db.collection('clubs').insertOne(newClub);
                if (acknowledged) {
                    res.status(201)
                        .location(`http://${server_1.HOSTNAME}:${server_1.PORT}/api/ReadingClubs/club${insertedId}`)
                        .json(newClub);
                }
            }
            catch (err) {
                console.error(`Unable to create Club: Name:${newClub.title}.`);
                console.error(err);
                (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    const oldClub = yield req.app.locals.db.collection('clubs').findOne({ _id: new mongodb_1.ObjectId(params.id) });
    if (!oldClub) {
        (0, utils_1.sendErrorResponse)(req, res, 404, `Club with ID=${params.id} does not exist`);
        return;
    }
    const updatedClubData = req.body;
    if (oldClub._id.toString() !== updatedClubData.id) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Club ID=${updatedClubData.id} does not match URL ID=${params.id}`);
        return;
    }
    try {
        yield indicative.validator.validate(updatedClubData, {
            id: 'required|regex:^[0-9a-f]{24}$',
            creatorId: 'required',
            name: 'required|string|min:2|max:22',
            interests: 'array|min:2|max:6',
            participants: 'array|min:1',
            banned: 'array'
        });
        try {
            delete updatedClubData.id;
            const { acknowledged, modifiedCount } = yield req.app.locals.db.collection('clubs').replaceOne({ _id: new mongodb_1.ObjectId(params.id) }, updatedClubData);
            if (acknowledged && modifiedCount === 1) {
                res.json(updatedClubData);
            }
            else {
                (0, utils_1.sendErrorResponse)(req, res, 500, `Unable to update Club: ${updatedClubData.id}: ${updatedClubData.title}`);
                return;
            }
        }
        catch (err) {
            console.error(err);
            (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
        }
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    try {
        const deletedClub = yield req.app.locals.db.collection('clubs').findOneAndDelete({ _id: new mongodb_1.ObjectId(params.id) });
        if (!deletedClub.ok) {
            (0, utils_1.sendErrorResponse)(req, res, 500, `Error deleting the document in Mongodb`);
            return;
        }
        if (deletedClub.lastErrorObject.n === 0) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Club with ID=${req.params.id} does not exist`);
            return;
        }
        res.status(200).json(deletedClub.value);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
exports.default = router;
//# sourceMappingURL=clubs-Router.js.map