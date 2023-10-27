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
        const allComments = yield req.app.locals.db.collection("comments").find().toArray();
        const result = (0, utils_1.replaceUnderscoreId)(allComments);
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
        const currComment = yield req.app.locals.db.collection("comments").findOne({ _id: new mongodb_1.ObjectId(params.id) });
        if (!currComment) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
            return;
        }
        const result = (0, utils_1.replaceUnderscoreId)(currComment);
        res.status(200).json(result);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Comment data`, errors);
    }
}));
router.post('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newComment = req.body;
        try {
            yield indicative.validator.validate(newComment, {
                creatorId: 'required',
                discussionId: 'required',
                isClub: 'required|boolean',
                content: 'required|string|min:1|max:1000',
                timeOfCreation: 'required|string',
                timeOfModification: 'string'
            });
            try {
                delete newComment.id;
                const { acknowledged, insertedId } = yield req.app.locals.db.collection('comments').insertOne(newComment);
                if (acknowledged) {
                    const result = (0, utils_1.replaceUnderscoreId)(newComment);
                    res.status(201)
                        .location(`http://${server_1.HOSTNAME}:${server_1.PORT}/api/${insertedId}`)
                        .json(result);
                }
            }
            catch (err) {
                console.error(`Unable to create Comment: Title:${newComment.title}.`);
                console.error(err);
                (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    const aldComment = yield req.app.locals.db.collection('comments').findOne({ _id: new mongodb_1.ObjectId(params.id) });
    if (!aldComment) {
        (0, utils_1.sendErrorResponse)(req, res, 404, `Comment with ID=${params.id} does not exist`);
        return;
    }
    const updatedComment = req.body;
    if (aldComment._id.toString() !== updatedComment.id) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Comment ID=${updatedComment.id} does not match URL ID=${params.id}`);
        return;
    }
    try {
        yield indicative.validator.validate(updatedComment, {
            id: 'required|regex:^[0-9a-f]{24}$',
            creatorId: 'required',
            discussionId: 'required',
            isClub: 'required|boolean',
            content: 'required|string|min:1|max:1000',
            timeOfCreation: 'required|string',
            timeOfModification: 'string'
        });
        try {
            delete updatedComment.id;
            const { acknowledged, modifiedCount } = yield req.app.locals.db.collection('comments').replaceOne({ _id: new mongodb_1.ObjectId(params.id) }, updatedComment);
            if (acknowledged && modifiedCount === 1) {
                res.json(Object.assign(Object.assign({}, updatedComment), { id: params.id }));
            }
            else {
                (0, utils_1.sendErrorResponse)(req, res, 500, `Unable to update Comment: ${updatedComment.id}: ${updatedComment.title}`);
                return;
            }
        }
        catch (err) {
            console.error(err);
            (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
        }
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    try {
        const deletedComment = yield req.app.locals.db.collection('comments').findOneAndDelete({ _id: new mongodb_1.ObjectId(params.id) });
        if (!deletedComment.ok) {
            (0, utils_1.sendErrorResponse)(req, res, 500, `Error deleting the document in Mongodb`);
            return;
        }
        if (deletedComment.lastErrorObject.n === 0) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
            return;
        }
        res.status(200).json(deletedComment.value);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
exports.default = router;
//# sourceMappingURL=comments-Router.js.map