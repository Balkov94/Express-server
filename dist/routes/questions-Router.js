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
        const allQuestions = yield req.app.locals.db.collection("questions").find().toArray();
        const result = (0, utils_1.replaceUnderscoreId)(allQuestions);
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
        const currQuestion = yield req.app.locals.db.collection("questions").findOne({ _id: new mongodb_1.ObjectId(params.id) });
        if (!currQuestion) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Question with ID=${req.params.id} does not exist`);
            return;
        }
        const result = (0, utils_1.replaceUnderscoreId)(currQuestion);
        res.status(200).json(result);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Question data`, errors);
    }
}));
router.post('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newQuestion = req.body;
        try {
            yield indicative.validator.validate(newQuestion, {
                creatorId: 'required',
                title: 'required|string|min:2|max:100',
                content: 'required|string|min:2',
                timeOfCreation: 'string|required',
                timeOfModification: 'string',
            });
            try {
                delete newQuestion.id;
                const { acknowledged, insertedId } = yield req.app.locals.db.collection('questions').insertOne(newQuestion);
                if (acknowledged) {
                    const result = (0, utils_1.replaceUnderscoreId)(newQuestion);
                    res.status(201)
                        .location(`http://${server_1.HOSTNAME}:${server_1.PORT}/api/QuestionRoom/${insertedId}`)
                        .json(result);
                }
            }
            catch (err) {
                console.error(`Unable to create Question: Title:${newQuestion.title}.`);
                console.error(err);
                (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
router.put('/question:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    const oldQuestion = yield req.app.locals.db.collection('questions').findOne({ _id: new mongodb_1.ObjectId(params.id) });
    if (!oldQuestion) {
        (0, utils_1.sendErrorResponse)(req, res, 404, `Question with ID=${params.id} does not exist`);
        return;
    }
    const updatedQuestion = req.body;
    if (oldQuestion._id.toString() !== updatedQuestion.id) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Question ID=${updatedQuestion.id} does not match URL ID=${params.id}`);
        return;
    }
    try {
        yield indicative.validator.validate(updatedQuestion, {
            id: 'required|regex:^[0-9a-f]{24}$',
            creatorId: 'required',
            title: 'required|string|min:2|max:100',
            content: 'required|string|min:2|max:512',
            timeOfCreation: 'string|required',
            timeOfModification: 'string',
        });
        try {
            delete updatedQuestion.id;
            const { acknowledged, modifiedCount } = yield req.app.locals.db.collection('questions').replaceOne({ _id: new mongodb_1.ObjectId(params.id) }, updatedQuestion);
            if (acknowledged && modifiedCount === 1) {
                res.json(Object.assign(Object.assign({}, updatedQuestion), { id: params.id }));
            }
            else {
                (0, utils_1.sendErrorResponse)(req, res, 500, `Unable to update Question: ${updatedQuestion.id}: ${updatedQuestion.title}`);
                return;
            }
        }
        catch (err) {
            console.error(err);
            (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
        }
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    try {
        const deletedQuestion = yield req.app.locals.db.collection('questions').findOneAndDelete({ _id: new mongodb_1.ObjectId(params.id) });
        if (!deletedQuestion.ok) {
            (0, utils_1.sendErrorResponse)(req, res, 500, `Error deleting the document in Mongodb`);
            return;
        }
        if (deletedQuestion.lastErrorObject.n === 0) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Question with ID=${req.params.id} does not exist`);
            return;
        }
        res.status(200).json(deletedQuestion.value);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
exports.default = router;
//# sourceMappingURL=questions-Router.js.map