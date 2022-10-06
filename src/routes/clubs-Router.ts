import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const clubsDB = 'clubsDB.json';

// Clubs - (ReadingClubs) API Feature
router.get('/', async (req, res) => {
   try {
      const clubsData = await promises.readFile(clubsDB)
      const clubs = JSON.parse(clubsData.toString());
      res.json(clubs);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/club:id', async (req, res) => {
   const params = req.params;
   try {
      await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      // await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
      //   const currComment = await req.app.locals.db.collection('posts').findOne({ _id: new ObjectID(req.params.id) });
      const clubsData = await promises.readFile(clubsDB)
      const clubs = JSON.parse(clubsData.toString());
      const currClub = clubs.find(c => c.id === params.id)
      if (!currClub) {
         sendErrorResponse(req, res, 404, `Club with ID=${req.params.id} does not exist`);
         return;
      }
      res.json(currClub);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.post('/', async function (req, res) {
   const newClub = req.body;
   try {
      await indicative.validator.validate(newClub, {
         creatorId: 'required',
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
         res.status(201).json(newClub);
      } catch (err) {
         console.error(`Unable to create Club: ${newClub.id}: ${newClub.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});



router.put('/:id', async (req, res) => {
   const params = req.params;
   const clubsData = await promises.readFile(clubsDB)
   const clubs = JSON.parse(clubsData.toString());
   console.log(params)
   const currClub = clubs.find(c => c.id === params.id)
   if (!currClub) {
      sendErrorResponse(req, res, 404, `Club with ID=${req.params.id} does not exist`);
      return;
   }
   const newClubData = req.body;
   if (currClub.id.toString() !== newClubData.id) {
      sendErrorResponse(req, res, 400, `Club ID=${newClubData.id} does not match URL ID=${req.params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(newClubData, {
         // id:'required|regex:^[0-9a-f]{24}$',
         creatorId: 'required',
         name: 'required|string',
         interests: 'array|min:2|max:6',
         participants: 'array|min:1',
         banned: 'array'
      });
      try {
         const updatedClub = { ...req.body, id: params.id }
         const updatedClubsDB = clubs.map(c => {
            if (c.id === updatedClub.id) {
               return updatedClub;
            }
            return c;
         })
         await promises.writeFile(clubsDB, JSON.stringify(updatedClubsDB));
         res.json(updatedClub);

      } catch (err) {
         console.log(`Unable to update Club: ${newClubData.id}: ${newClubData.title}`);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.delete('/:id', async (req, res) => {
   const params = req.params;
   try {
      await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      const clubsData = await promises.readFile(clubsDB);
      const clubs = JSON.parse(clubsData.toString());
      const currClub = clubs.find(c => c.id === params.id)
      if (!currClub) {
         sendErrorResponse(req, res, 404, `Club with ID=${req.params.id} does not exist`);
         return;
      }
      else {
         const updatedClubsData = clubs.filter(c => c.id !== params.id)
         await promises.writeFile(clubsDB, JSON.stringify(updatedClubsData));
         res.json({ message: `Club ID:${params.id} was deleted.` });
      }

   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;