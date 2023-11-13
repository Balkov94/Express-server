import * as express from 'express';
import { replaceUnderscoreId, sendErrorResponse, URLIdValidation } from '../utils';
import * as indicative from 'indicative';
import { HOSTNAME, PORT } from '../server';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/', async (req, res) => {
   try {
      const allQuestions = await req.app.locals.db.collection("questions").find().toArray();
      const result = replaceUnderscoreId(allQuestions);
      res.status(200).json(result);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const currQuestion = await req.app.locals.db.collection("questions").findOne({ _id: new ObjectId(params.id) });
     
      if (!currQuestion) {
         sendErrorResponse(req, res, 404, `Question with ID=${req.params.id} does not exist`);
         return;
      }
      const result = replaceUnderscoreId(currQuestion);
      res.status(200).json(result);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Question data`, errors);
   }
});


router.post('/', async function (req, res) {
   const newQuestion = req.body;
   try {
      await indicative.validator.validate(newQuestion, {
         creatorId: 'required',
         title: 'required|string|min:2|max:100',
         content: 'required|string|min:2',
         timeOfCreation: 'string|required',
         timeOfModification: 'string',
      });
      try {
         delete newQuestion.id;
         const { acknowledged, insertedId } = await req.app.locals.db.collection('questions').insertOne(newQuestion);
         if (acknowledged) {
            

            const result=replaceUnderscoreId(newQuestion);
            res.status(201)
               .location(`http://${HOSTNAME}:${PORT}/api/QuestionRoom/${insertedId}`)
               .json(result);
         }
      } catch (err) {
         console.error(`Unable to create Question: Title:${newQuestion.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      
      sendErrorResponse(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


//router.put('/question:id', async (req, res) => {
router.put('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   const oldQuestion = await req.app.locals.db.collection('questions').findOne({ _id: new ObjectId(params.id) });
   if (!oldQuestion) {
      sendErrorResponse(req, res, 404, `Question with ID=${params.id} does not exist`);
      return;
   }
   const updatedQuestion = req.body;
   if (oldQuestion._id.toString() !== updatedQuestion.id) {
      sendErrorResponse(req, res, 400, `Question ID=${updatedQuestion.id} does not match URL ID=${params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedQuestion, {
         id:'required|regex:^[0-9a-f]{24}$',
         creatorId: 'required',
         title: 'required|string|min:2|max:100',
         content: 'required|string|min:2|max:512',
         timeOfCreation: 'string|required',
         timeOfModification: 'string',
      });
      try {
         delete updatedQuestion.id
         const { acknowledged, modifiedCount } = await req.app.locals.db.collection('questions').replaceOne({ _id: new ObjectId(params.id) }, updatedQuestion)
         if (acknowledged && modifiedCount === 1) {
            res.json({...updatedQuestion,id:params.id});
         } else {
            sendErrorResponse(req, res, 500, `Unable to update Question: ${updatedQuestion.id}: ${updatedQuestion.title}`);
            return;
         }
      } catch (err) {
         
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.delete('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const deletedQuestion = await req.app.locals.db.collection('questions').findOneAndDelete({ _id: new ObjectId(params.id) });
      const copy = {...deletedQuestion};
      if (deletedQuestion) {
         res.json(deletedQuestion);
         return;
      }
      if (!deletedQuestion) {
         sendErrorResponse(req, res, 404, `Question with ID=${req.params.id} does not exist`);
         return;
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Question data: ${errors.message}`, errors);
   }
});

export default router;