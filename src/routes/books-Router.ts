import * as express from 'express';
import { sendErrorResponse } from '../utils';
import * as indicative from 'indicative';
import { promises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { HOSTNAME, PORT } from '../server';

const router = express.Router();
const booksDB = 'booksDB.json';

// Books - (ExchangerPage) API Feature
router.get('/', async (req, res) => {
   try {
      const booksData = await promises.readFile(booksDB)
      const books = JSON.parse(booksData.toString());
      res.json(books);
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
      const booksData = await promises.readFile(booksDB)
      const books = JSON.parse(booksData.toString());
      const currBook = books.find(c => c.id === params.id)
      console.log(currBook);
      if (!currBook) {
         sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
         return;
      }
      res.json(currBook);
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});


router.post('/', async function (req, res) {
   const newBook = req.body;
   try {
      await indicative.validator.validate(newBook, {
         // id: 'required|string',
         ownerId: 'required',
         title: 'required|string|min:2',
         bookPic: 'string',
      });
      const booksData = await promises.readFile(booksDB)
      const books = JSON.parse(booksData.toString());
      newBook.id = uuidv4();
      books.push(newBook);
      try {
         await promises.writeFile(booksDB, JSON.stringify(books));
         res.status(201)
         .location(`http://${HOSTNAME}:${PORT}/api/ExchangePage/${newBook.id }`)
         .json(newBook);
      } catch (err) {
         console.error(`Unable to create Book: ${newBook.id}: ${newBook.title}.`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      console.log(errors)
      sendErrorResponse(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});



router.put('/:id', async (req, res) => {
   const params = req.params;
   const booksData = await promises.readFile(booksDB)
   const books = JSON.parse(booksData.toString());
   console.log(params)
   const currBook = books.find(c => c.id === params.id)
   if (!currBook) {
      sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
      return;
   }
   const updatedBookData = req.body;
   if (currBook.id.toString() !== updatedBookData.id) {
      sendErrorResponse(req, res, 400, `Book ID=${updatedBookData.id} does not match URL ID=${req.params.id}`);
      return;
   }
   try {
      await indicative.validator.validate(updatedBookData, {
         // id:'required|regex:^[0-9a-f]{24}$',
         id: 'required',
         ownerId: 'required|string',
         title: 'required|string|min:2',
         bookPic: 'string',
      });
      try {
         const updatedBook = { ...req.body, id: params.id }
         const updatedBooksDB = books.map(c => {
            if (c.id === updatedBook.id) {
               return updatedBook;
            }
            return c;
         })
         await promises.writeFile(booksDB, JSON.stringify(updatedBooksDB));
         res.json(updatedBook);

      } catch (err) {
         console.log(`Unable to update Book: ${currBook.id}: ${currBook.title}`);
         console.error(err);
         sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
      }
   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);
   }
});

router.delete('/:id', async (req, res) => {
   const params = req.params;
   try {
      await indicative.validator.validate(params.id, { id: 'required|regex:^[0-9a-f]{24}$' });
      const booksData = await promises.readFile(booksDB);
      const books = JSON.parse(booksData.toString());
      const currBook = books.find(c => c.id === params.id)
      if (!currBook) {
         sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
         return;
      }
      else {
         const updatedBooksDB = books.filter(c => c.id !== params.id)
         await promises.writeFile(booksDB, JSON.stringify(updatedBooksDB));
         res.json({ message: `Book ID:${params.id} was deleted.` });
      }

   } catch (errors) {
      sendErrorResponse(req, res, 400, `Invalid Book data: ${errors.map(e => e.message).join(', ')}`, errors);

   }
});

export default router;