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
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const router = express.Router();
const commentsDB = 'commentsDB.json';
// Posts API Feature
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const commentsData = yield fs_1.promises.readFile(commentsDB);
        const comments = JSON.parse(commentsData.toString());
        res.json(comments);
    }
    catch (err) {
        (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
    }
}));
// router.get('/:id', async (req, res) => {
//     const params = req.params;
//     try {
//         await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
//         const post = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
//         if (!post) {
//             sendErrorResponse(req, res, 404, `Post with ID=${req.params.id} does not exist`);
//             return;
//         }
//         res.json(post);
//     } catch (errors) {
//         sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
//     }
// });
router.post('/', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const newComment = req.body;
        try {
            yield indicative.validator.validate(newComment, {
                // id: 'required|regex:^[0-9a-f]{24}',
                creatorId: 'required|string|number|min:1|max:20',
                discussionId: 'required|string|number|min:1|max:20',
                isClub: 'required|boolean',
                content: 'required|string|min:1|max:1000',
                timeOfCreation: 'string',
                timeOfModification: 'string|null',
                // imageUrl: 'url',
                // categories: 'array',
                // 'categories.*': 'string',
                // keywords: 'array',
                // 'keywords.*': 'string'
            });
            const commentsData = yield fs_1.promises.readFile(commentsDB);
            const comments = JSON.parse(commentsData.toString());
            newComment.id = (0, uuid_1.v4)();
            comments.push(newComment);
            try {
                fs_1.promises.writeFile(commentsDB, JSON.stringify(comments));
                res.json(newComment);
            }
            catch (err) {
                console.error(`Unable to create post: ${newComment.id}: ${newComment.title}.`);
                console.error(err);
                (0, utils_1.sendErrorResponse)(req, res, 500, `Server error: ${err.message}`, err);
            }
        }
        catch (errors) {
            (0, utils_1.sendErrorResponse)(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
        }
    });
});
// router.put('/:id', verifyToken, verifyRole(['Author','Admin']), async (req, res) => {
//     const old = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
//     if (!old) {
//         sendErrorResponse(req, res, 404, `Post with ID=${req.params.id} does not exist`);
//         return;
//     }
//     const post = req.body;
//     if (old._id.toString() !== post.id) {
//         sendErrorResponse(req, res, 400, `Post ID=${post.id} does not match URL ID=${req.params.id}`);
//         return;
//     }
//     try {
//         await indicative.validator.validate(post, {
//             id: 'required|regex:^[0-9a-f]{24}',
//             title: 'required|string|min:3|max:60',
//             text: 'string|max:120',
//             authorId: 'required|regex:^[0-9a-f]{24}',
//             content: 'string',
//             imageUrl: 'url',
//             categories: 'array',
//             'categories.*': 'string',
//             keywords: 'array',
//             'keywords.*': 'string'
//         });
//         try {
//             r = await req.app.locals.db.collection('posts').updateOne({ _id: new ObjectID(req.params.id) }, { $set: post });
//             if (r.result.ok) {
//                 console.log(`Updated post: ${JSON.stringify(post)}`);
//                 if (r.modifiedCount === 0) {
//                     console.log(`The old and the new posts are the same.`);
//                 }
//                 res.json(post);
//             } else {
//                 sendErrorResponse(req, res, 500, `Unable to update post: ${post.id}: ${post.title}`);
//             }
//         } catch (err) {
//             console.log(`Unable to update post: ${post.id}: ${post.title}`);
//             console.error(err);
//             sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
//         }
//     } catch (errors) {
//         sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
//     }
// });
// router.delete('/:id', async (req, res) => {
//     const params = req.params;
//     try {
//         await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
//         const old = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
//         if (!old) {
//             sendErrorResponse(req, res, 404, `Post with ID=${req.params.id} does not exist`);
//             return;
//         }
//         replace_id(old)
//         const r = await req.app.locals.db.collection('posts').deleteOne({ _id: new ObjectID(req.params.id) });
//         if(r.result.ok && r.deletedCount === 1) {
//             console.log(`Deleted post: ${old.id}: ${old.title}`);
//             res.json(old);
//         } else {
//             console.log(`Unable to delete post: ${post.id}: ${post.title}`);
//             sendErrorResponse(req, res, 500, `Unable to delete post: ${old.id}: ${old.title}`);
//         }
//     } catch (errors) {
//         sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
//     }
// });
exports.default = router;
//# sourceMappingURL=comments-Router.js.map