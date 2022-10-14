import * as express from 'express';
import { replaceUnderscoreId, sendErrorResponse, URLIdValidation } from '../utils';
import * as indicative from 'indicative';
import { HOSTNAME, PORT } from '../server';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/', async (req, res) => {
   try {
      const allClubs = await req.app.locals.db.collection("clubs").find().toArray();
     
      const result = replaceUnderscoreId(allClubs);
      res.status(200).json(result);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/club:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const currClub = await req.app.locals.db.collection("clubs").findOne({ _id: new ObjectId(params.id) });
     
      if (!currClub) {
         sendErrorResponse(req, res, 404, `Club with ID=${req.params.id} does not exist`);
         return;
      }
      const result = replaceUnderscoreId(currClub);
      res.status(200).json(result);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Club data`, errors);
   }
});


router.post('/', async function (req, res) {
   const newClub = req.body;
   try {
      await indicative.validator.validate(newClub, {
         creatorId: 'required',
         name: 'required|string|min:2|max:22',
         interests: 'array|min:2|max:6',
         participants: 'array|min:1',
         banned: 'array'

      });
      try {
         delete newClub.id;
         const { acknowledged, insertedId } = await req.app.locals.db.collection('clubs').insertOne(newClub);
         if (acknowledged) {
            
            res.status(201)
               .location(`http://${HOSTNAME}:${PORT}/api/ReadingClubs/club${insertedId}`)
               .json(newClub);
         }
      } catch (err) {
         console.error(`Unable to create Club: Name:${newClub.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      
      sendErrorResponse(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});



router.put('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   const oldClub = await req.app.locals.db.collection('clubs').findOne({ _id: new ObjectId(params.id) });
   if (!oldClub) {
      sendErrorResponse(req, res, 404, `Club with ID=${params.id} does not exist`);
      return;
   }
   const updatedClubData = req.body;
   if (oldClub._id.toString() !== updatedClubData.id) {
      sendErrorResponse(req, res, 400, `Club ID=${updatedClubData.id} does not match URL ID=${params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedClubData, {
         id:'required|regex:^[0-9a-f]{24}$',
         creatorId: 'required',
         name: 'required|string|min:2|max:22',
         interests: 'array|min:2|max:6',
         participants: 'array|min:1',
         banned: 'array'
      });
      try {
         delete updatedClubData.id
         const { acknowledged, modifiedCount } = await req.app.locals.db.collection('clubs').replaceOne({ _id: new ObjectId(params.id) }, updatedClubData)
         if (acknowledged && modifiedCount === 1) {
            
            res.json(updatedClubData);
         } else {
            sendErrorResponse(req, res, 500, `Unable to update Club: ${updatedClubData.id}: ${updatedClubData.title}`);
            return;
         }
      } catch (err) {
         
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.delete('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const deletedClub = await req.app.locals.db.collection('clubs').findOneAndDelete({ _id: new ObjectId(params.id) });
      if (!deletedClub.ok) {
         sendErrorResponse(req, res, 500, `Error deleting the document in Mongodb`);
         return;
      }
      if (deletedClub.lastErrorObject.n === 0) {
         sendErrorResponse(req, res, 404, `Club with ID=${req.params.id} does not exist`);
         return;
      }
      res.status(200).json(deletedClub.value);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Club data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;