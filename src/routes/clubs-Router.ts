import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const clubsDB = 'clubsDB.json';

// Posts API Feature
router.get('/', async (req, res) => {
   try {
      const clubsData = await promises.readFile(clubsDB)
      const clubs = JSON.parse(clubsData.toString());
      res.json(clubs);
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
      const clubsData = await promises.readFile(clubsDB)
      const clubs = JSON.parse(clubsData.toString());
      const currClub = await clubs.find(c => c.id === params.id)
      console.log(currClub);
      if (!currClub) {
         sendErrorResponse(req, res, 404, `Post with ID=${req.params.id} does not exist`);
         return;
      }
      res.json(currClub);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.post('/', async function (req, res) {
   const newClub = req.body;
   try {
      await indicative.validator.validate(newClub, {
         creatorId: 'required|string',
         name: 'required|string',
         interests: 'array|min:2|max:6',
         participants: 'array|min:1',
         banned: 'array'

      });
      const clubsData = await promises.readFile(clubsDB)
      const clubs = JSON.parse(clubsData.toString());
      newClub.id = uuidv4();
      clubs.push(newClub);
      try {
         await promises.writeFile(clubsDB, JSON.stringify(clubs));
         res.json(newClub);
      } catch (err) {
         console.error(`Unable to create post: ${newClub.id}: ${newClub.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});



router.put('/:id', async (req, res) => {
   const params = req.params;
   const clubsData = await promises.readFile(clubsDB)
   const clubs = JSON.parse(clubsData.toString());
   console.log(params)
   const currClub = await clubs.find(c => c.id === params.id)
   if (!currClub) {
      sendErrorResponse(req, res, 404, `Post with ID=${req.params.id} does not exist`);
      return;
   }
   const club = req.body;
   // if (currComment._id.toString() !== post.id) {
   if (currClub.id.toString() !== club.id) {
      sendErrorResponse(req, res, 400, `Post ID=${club.id} does not match URL ID=${req.params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(club, {
         // id:'required|regex:^[0-9a-f]{24}$',
         creatorId: 'required|string',
         discussionId: 'required|string',
         isClub: 'required|boolean',
         content: 'required|string|min:1|max:1000',
         timeOfCreation: 'string',
      });
      try {
         const updatedComment = { ...req.body, id: params.id }
         const updatedCommentsDB = clubs.map(c => {
            if (c.id === updatedComment.id) {
               return updatedComment;
            }
            return c;
         })
         await promises.writeFile(clubsDB, JSON.stringify(updatedCommentsDB));
         res.json(updatedComment);

      } catch (err) {
         console.log(`Unable to update post: ${club.id}: ${club.title}`);
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
      const commentsData = await promises.readFile(clubsDB);
      const comments = JSON.parse(commentsData.toString());
      const currComment = await comments.find(c => c.id = params.id)
      if (!currComment) {
         sendErrorResponse(req, res, 404, `Post with ID=${req.params.id} does not exist`);
         return;
      }
      else {
         const updatedComments = await comments.filter(c => c.id !== params.id)
         await promises.writeFile(clubsDB, JSON.stringify(updatedComments));
         res.json({ message: `Comment ID:${params.id} was deleted.` });
         res.json(currComment);
      }

   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid post data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;