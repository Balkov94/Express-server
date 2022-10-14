import * as express from 'express';
import { replaceUnderscoreId, sendErrorResponse, URLIdValidation } from '../utils';
import * as indicative from 'indicative';
import { HOSTNAME, PORT } from '../server';
import {ObjectId } from 'mongodb';
const router = express.Router();

router.get('/', async (req, res) => {
   try {
      const allBooks = await req.app.locals.db.collection("books").find().toArray();
      
      const result = replaceUnderscoreId(allBooks);
      res.status(200).json(result);
   } catch (err) {
      sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
   }
});

router.get('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const currBook = await req.app.locals.db.collection("books").findOne({ _id: new ObjectId(params.id) });
      
      if (!currBook) {
         sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
         return;
      }
      const result = replaceUnderscoreId(currBook);
      res.status(200).json(result);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Book data`, errors);
   }
});


router.post('/', async function (req, res) {
   const newBook = req.body;
   try {
      await indicative.validator.validate(newBook, {
         ownerId: 'required',
         title: 'required|string|min:2|max:100',
         bookPic: 'string',
      });
      try {
         delete newBook.id; //udefined by default from GB BookClass
         const { acknowledged, insertedId } = await req.app.locals.db.collection('books').insertOne(newBook);
         if (acknowledged) {
            
            res.status(201)
               .location(`http://${HOSTNAME}:${PORT}/api/ExchangePage/${insertedId}`)
               .json(newBook);
         }
      } catch (err) {
         console.error(`Unable to create Book: Title:${newBook.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      
      sendErrorResponse(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.put('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   const oldBook = await req.app.locals.db.collection('books').findOne({ _id: new ObjectId(params.id) });
   if (!oldBook) {
      sendErrorResponse(req, res, 404, `Book with ID=${params.id} does not exist`);
      return;
   }
   const updatedBookData = req.body;
   if (oldBook._id.toString() !== updatedBookData.id) {
      sendErrorResponse(req, res, 400, `Book ID=${updatedBookData.id} does not match URL ID=${params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedBookData, {
         id:'required|regex:^[0-9a-f]{24}$',
         ownerId: 'required',
         title: 'required|string|min:2|max:100',
         bookPic: 'string',
      });
      try {
         delete updatedBookData.id
         const { acknowledged, modifiedCount } = await req.app.locals.db.collection('books').replaceOne({ _id: new ObjectId(params.id) }, updatedBookData)
         if (acknowledged && modifiedCount === 1) {
           
            res.json(updatedBookData);
         } else {
            sendErrorResponse(req, res, 500, `Unable to update Book: ${updatedBookData.id}: ${updatedBookData.title}`);
            return;
         }
      } catch (err) {
         
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.delete('/:id', async (req, res) => {
   const params = req.params;
   URLIdValidation(req, res, params.id);
   try {
      const deletedBook = await req.app.locals.db.collection('books').findOneAndDelete({ _id: new ObjectId(params.id) });
      if (!deletedBook.ok) {
         sendErrorResponse(req, res, 500, `Error deleting the document in Mongodb`);
         return;
      }
      if (deletedBook.lastErrorObject.n === 0) {
         sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
         return;
      }
      res.status(200).json(deletedBook.value);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

export default router;