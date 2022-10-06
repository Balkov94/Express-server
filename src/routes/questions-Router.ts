import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const questionsDB = 'questionsDB.json';

// questions - (QuestionRoom) API Feature
router.get('/', async (req, res) => {
   try {
      const questionsData = await promises.readFile(questionsDB)
      const questions = JSON.parse(questionsData.toString());
      res.json(questions);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/:id', async (req, res) => {
   const params = req.params;
   try {
      // await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      // await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
      //   const currComment = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
      const questionsData = await promises.readFile(questionsDB)
      const questions = JSON.parse(questionsData.toString());
      const currQuestion = questions.find(c => c.id === params.id)
      console.log(currQuestion);
      if (!currQuestion) {
         sendErrorResponse(req, res, 404, `Question with ID=${req.params.id} does not exist`);
         return;
      }
      res.json(currQuestion);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.post('/', async function (req, res) {
   const newQuestion = req.body;
   try {
      await indicative.validator.validate(newQuestion, {
         creatorId: 'required',
         title: 'required|string|min:2',
         content: 'required|string|min:2',
         // questionPic: 'url',
         timeOfCreation: 'string|required',
         timeOfModification: 'string',
      });
      const questionsData = await promises.readFile(questionsDB)
      const questions = JSON.parse(questionsData.toString());
      newQuestion.id = uuidv4();
      questions.push(newQuestion);
      try {
         await promises.writeFile(questionsDB, JSON.stringify(questions));
         res.status(201).json(newQuestion);
      } catch (err) {
         console.error(`Unable to create Question: ${newQuestion.id}: ${newQuestion.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});



// router.put('/question:id/edit', async (req, res) => {
router.put('/question:id', async (req, res) => {
   const params = req.params;
   const questionsData = await promises.readFile(questionsDB)
   const questions = JSON.parse(questionsData.toString());
   console.log(params)
   const currQuestion = questions.find(c => c.id === params.id)
   if (!currQuestion) {
      sendErrorResponse(req, res, 404, `Question with ID=${req.params.id} does not exist`);
      return;
   }
   const updatedQuestionData = req.body;
   if (currQuestion.id.toString() !== updatedQuestionData.id) {
      sendErrorResponse(req, res, 400, `Question ID=${updatedQuestionData.id} does not match URL ID=${req.params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedQuestionData, {
         // id:'required|regex:^[0-9a-f]{24}$',
         creatorId: 'required',
         title: 'required|string|min:2',
         content: 'required|string|min:2',
         // questionPic: 'url',
         // timeOfCreation: 'string|required',
         // timeOfModification: 'string',
      });
      try {
         const updatedQuestion = { ...req.body, id: params.id }
         const updatedQuestionsDB = questions.map(c => {
            if (c.id === updatedQuestion.id) {
               return updatedQuestion;
            }
            return c;
         })
         await promises.writeFile(questionsDB, JSON.stringify(updatedQuestionsDB));
         res.json(updatedQuestion);

      } catch (err) {
         console.log(`Unable to update Question: ${currQuestion.id}: ${currQuestion.title}`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

router.delete('/:id', async (req, res) => {
   const params = req.params;
   try {
      await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      const questionsData = await promises.readFile(questionsDB);
      const questions = JSON.parse(questionsData.toString());
      const currQuestion = questions.find(c => c.id === params.id)
      if (!currQuestion) {
         sendErrorResponse(req, res, 404, `Question with ID=${req.params.id} does not exist`);
         return;
      }
      else {
         const updatedQuestionsDB = questions.filter(c => c.id !== params.id)
         await promises.writeFile(questionsDB, JSON.stringify(updatedQuestionsDB));
         res.json({ message: `Question ID:${params.id} was deleted.` });
      }

   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Question data: ${errors.map(e => e.message).join(', ')}`, errors);

   }
});

export default router;