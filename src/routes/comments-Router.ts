import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { HOSTNAME, PORT } from '../server';
const router = express.Router();

const commentsDB = 'commentsDB.json';

// ****************************************** 
// Direct access from the API - http://localhost:8000/api
// ****************************************** 
router.get('/', async (req, res) => {
   try {
      const commentsData = await promises.readFile(commentsDB)
      const comments = JSON.parse(commentsData.toString());
      res.json(comments);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/:id', async (req, res) => {
   const params = req.params;
   try {
      await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      // await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
      //   const currComment = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
      const commentsData = await promises.readFile(commentsDB)
      const comments = JSON.parse(commentsData.toString());
      const currComment = comments.find(c => c.id === params.id)
      if (!currComment) {
         sendErrorResponse(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
         return;
      }
      res.json(currComment);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.post('/', async function (req, res) {
   console.log("Request body:");
   console.log(JSON.stringify(req.body))
   const newComment = req.body;
   try {
      await indicative.validator.validate(newComment, {
         // id: 'required|regex:^[0-9a-f]{24}',
         creatorId: 'required',
         discussionId: 'required',
         isClub: 'required|boolean',
         content: 'required|string|min:1|max:1000',
         timeOfCreation: 'string',
         // SKIP timeOfModification no null type NEED -> null or string
         // timeOfModification:,
         // imageUrl: 'url',
         // categories: 'array',
         // 'categories.*': 'string',
         // keywords: 'array',
         // 'keywords.*': 'string'
      });
      const commentsData = await promises.readFile(commentsDB)
      const comments = JSON.parse(commentsData.toString());
      newComment.id = uuidv4();
      comments.push(newComment);
      try {
         await promises.writeFile(commentsDB, JSON.stringify(comments));
         res.status(201)
         .location(`http://${HOSTNAME}:${PORT}/api/${newComment.id }`)
         .json(newComment);
      } catch (err) {
         console.error(`Unable to create Comment: ${newComment.id}: ${newComment.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


// router.put('/:id', verifyToken, verifyRole(['Author','Admin']), async (req, res) => {
router.put('/:id', async (req, res) => {
   //  const old = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
   const params = req.params;
   const commentsData = await promises.readFile(commentsDB)
   const comments = JSON.parse(commentsData.toString());
   console.log(params)
   const currComment = comments.find(c => c.id === params.id)
   if (!currComment) {
      sendErrorResponse(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
      return;
   }
   const updatedCommentData = req.body;
   // if (currComment._id.toString() !== post.id) {
   if (currComment.id.toString() !== updatedCommentData.id) {
      sendErrorResponse(req, res, 400, `Comment ID=${updatedCommentData.id} does not match URL ID=${req.params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedCommentData, {
         // id:'required|regex:^[0-9a-f]{24}$',
         creatorId: 'required',
         discussionId: 'required',
         isClub: 'required|boolean',
         content: 'required|string|min:1|max:1000',
         timeOfCreation: 'string',
      });
      try {
         const updatedComment = { ...req.body, id: params.id }
         const updatedCommentsDB = comments.map(c => {
            if (c.id === updatedComment.id) {
               return updatedComment;
            }
            return c;
         })
         await promises.writeFile(commentsDB, JSON.stringify(updatedCommentsDB));
         res.json(updatedComment);

         // r = await req.app.locals.db.collection('posts').updateOne({ _id: new ObjectID(req.params.id) }, { $set: post });
         // if (r.result.ok) {
         //    console.log(`Updated post: ${JSON.stringify(post)}`);
         //    if (r.modifiedCount === 0) {
         //       console.log(`The old and the new posts are the same.`);
         //    }
         //    res.json(post);
         // } else {
         //    sendErrorResponse(req, res, 500, `Unable to update post: ${post.id}: ${post.title}`);
         // }
      } catch (err) {
         console.log(`Unable to update post: ${updatedCommentData.id}: ${updatedCommentData.title}`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

router.delete('/:id', async (req, res) => {
   const params = req.params;
   try {
      await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      const commentsData = await promises.readFile(commentsDB);
      const comments = JSON.parse(commentsData.toString());
      const currComment = comments.find(c => c.id === params.id)
      if (!currComment) {
         sendErrorResponse(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
         return;
      }
      else {
         const updatedComments = comments.filter(c => c.id !== params.id)
         await promises.writeFile(commentsDB, JSON.stringify(updatedComments));
         res.json({ message: `Comment ID:${params.id} was deleted.` });
      }
      //   const old = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
      //   if (!old) {
      //       sendErrorResponse(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
      //       return;
      //   }
      //   replace_id(old)
      //   const r = await req.app.locals.db.collection('posts').deleteOne({ _id: new ObjectID(req.params.id) });
      //   if(r.result.ok && r.deletedCount === 1) {
      //       console.log(`Deleted post: ${old.id}: ${old.title}`);
      //       res.json(old);
      //   } else {
      //       console.log(`Unable to delete post: ${post.id}: ${post.title}`);
      //       sendErrorResponse(req, res, 500, `Unable to delete post: ${old.id}: ${old.title}`);
      //   }


   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;