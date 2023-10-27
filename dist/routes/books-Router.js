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
        const allBooks = yield req.app.locals.db.collection("books").find().toArray();
        const result = (0, utils_1.replaceUnderscoreId)(allBooks);
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
        const currBook = yield req.app.locals.db.collection("books").findOne({ _id: new mongodb_1.ObjectId(params.id) });
        if (!currBook) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Book with ID=${req.params.id} does not exist`);
            return;
        }
        const result = (0, utils_1.replaceUnderscoreId)(currBook);
        res.status(200).json(result);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Book data`, errors);
    }
}));
router.post('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newBook = req.body;
        try {
            yield indicative.validator.validate(newBook, {
                ownerId: 'required',
                title: 'required|string|min:2|max:100',
                bookPic: 'string',
            });
            try {
                delete newBook.id; //udefined by default from GB BookClass
                const { acknowledged, insertedId } = yield req.app.locals.db.collection('books').insertOne(newBook);
                if (acknowledged) {
                    res.status(201)
                        .location(`http://${server_1.HOSTNAME}:${server_1.PORT}/api/ExchangePage/${insertedId}`)
                        .json(newBook);
                }
            }
            catch (err) {
                console.error(`Unable to create Book: Title:${newBook.title}.`);
                console.error(err);
                (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    const oldBook = yield req.app.locals.db.collection('books').findOne({ _id: new mongodb_1.ObjectId(params.id) });
    if (!oldBook) {
        (0, utils_1.sendErrorResponse)(req, res, 404, `Book with ID=${params.id} does not exist`);
        return;
    }
    const updatedBookData = req.body;
    if (oldBook._id.toString() !== updatedBookData.id) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Book ID=${updatedBookData.id} does not match URL ID=${params.id}`);
        return;
    }
    try {
        yield indicative.validator.validate(updatedBookData, {
            id: 'required|regex:^[0-9a-f]{24}$',
            ownerId: 'required',
            title: 'required|string|min:2|max:100',
            bookPic: 'string',
        });
        try {
            delete updatedBookData.id;
            const { acknowledged, modifiedCount } = yield req.app.locals.db.collection('books').replaceOne({ _id: new mongodb_1.ObjectId(params.id) }, updatedBookData);
            if (acknowledged && modifiedCount === 1) {
                res.json(updatedBookData);
            }
            else {
                (0, utils_1.sendErrorResponse)(req, res, 500, `Unable to update Book: ${updatedBookData.id}: ${updatedBookData.title}`);
                return;
            }
        }
        catch (err) {
            console.error(err);
            (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
        }
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.params;
    (0, utils_1.URLIdValidation)(req, res, params.id);
    try {
        const deletedBook = yield req.app.locals.db.collection('books').findOneAndDelete({ _id: new mongodb_1.ObjectId(params.id) });
        if (!deletedBook.ok) {
            (0, utils_1.sendErrorResponse)(req, res, 500, `Error deleting the document in Mongodb`);
            return;
        }
        if (deletedBook.lastErrorObject.n === 0) {
            (0, utils_1.sendErrorResponse)(req, res, 404, `Book with ID=${req.params.id} does not exist`);
            return;
        }
        res.status(200).json(deletedBook.value);
    }
    catch (errors) {
        (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
    }
}));
exports.default = router;
//# sourceMappingURL=books-Router.js.map