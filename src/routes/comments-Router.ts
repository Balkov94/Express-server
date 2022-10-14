import * as express from 'express';
import { replaceUnderscoreId, sendErrorResponse, URLIdValidation } from '../utils';
import * as indicative from 'indicative';
import { HOSTNAME, PORT } from '../server';
import { ObjectId } from 'mongodb';
const router = express.Router();

router.get('/', async (req, res) => {
   try {
      const allComments = await req.app.locals.db.collection("comments").find().toArray();
     
      const result = replaceUnderscoreId(allComments);
      res.status(200).json(result);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const currComment = await req.app.locals.db.collection("comments").findOne({ _id: new ObjectId(params.id) });
      
      if (!currComment) {
         sendErrorResponse(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
         return;
      }
      const result = replaceUnderscoreId(currComment);
      res.status(200).json(result);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Comment data`, errors);
   }
});


router.post('/', async function (req, res) {
   const newComment = req.body;
   try {
      await indicative.validator.validate(newComment, {
         creatorId: 'required',
         discussionId: 'required',
         isClub: 'required|boolean',
         content: 'required|string|min:1|max:1000',
         timeOfCreation: 'required|string',
         timeOfModification:'string'
      });
      try {
         delete newComment.id;
         const { acknowledged, insertedId } = await req.app.locals.db.collection('comments').insertOne(newComment);
         if (acknowledged) {
           
            const result=replaceUnderscoreId(newComment);
            res.status(201)
               .location(`http://${HOSTNAME}:${PORT}/api/${insertedId}`)
               .json(result);
         }
      } catch (err) {
         console.error(`Unable to create Comment: Title:${newComment.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
     
      sendErrorResponse(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.put('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   const aldComment = await req.app.locals.db.collection('comments').findOne({ _id: new ObjectId(params.id) });
   if (!aldComment) {
      sendErrorResponse(req, res, 404, `Comment with ID=${params.id} does not exist`);
      return;
   }
   const updatedComment = req.body;
   if (aldComment._id.toString() !== updatedComment.id) {
      sendErrorResponse(req, res, 400, `Comment ID=${updatedComment.id} does not match URL ID=${params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedComment, {
         id:'required|regex:^[0-9a-f]{24}$',
         creatorId: 'required',
         discussionId: 'required',
         isClub: 'required|boolean',
         content: 'required|string|min:1|max:1000',
         timeOfCreation: 'required|string',
         timeOfModification:'string'
      });
      try {
         delete updatedComment.id
         const { acknowledged, modifiedCount } = await req.app.locals.db.collection('comments').replaceOne({ _id: new ObjectId(params.id) }, updatedComment)
         if (acknowledged && modifiedCount === 1) {
            
            res.json({...updatedComment,id:params.id});
         } else {
            sendErrorResponse(req, res, 500, `Unable to update Comment: ${updatedComment.id}: ${updatedComment.title}`);
            return;
         }
      } catch (err) {
         
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

router.delete('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const deletedComment = await req.app.locals.db.collection('comments').findOneAndDelete({ _id: new ObjectId(params.id) });
      if (!deletedComment.ok) {
         sendErrorResponse(req, res, 500, `Error deleting the document in Mongodb`);
         return;
      }
      if (deletedComment.lastErrorObject.n === 0) {
         sendErrorResponse(req, res, 404, `Comment with ID=${req.params.id} does not exist`);
         return;
      }
      res.status(200).json(deletedComment.value);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Comment data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;