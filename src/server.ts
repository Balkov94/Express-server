import * as express from 'express';
import * as cors from 'cors';
import * as logger from 'morgan';
import { sendErrorResponse } from './utils';
import booksRouter from './routes/books-Router';
import commentsRouter from './routes/comments-Router';
import clubsRouter from './routes/clubs-Router';
import usersRouter from './routes/users-Router';
import questionsRouter from './routes/questions-Router';
import loginRouter from './routes/login-Router';
import registerRouter from './routes/register-Router';

import { MongoClient } from 'mongodb';
export const HOSTNAME = 'localhost';
export const PORT = 8000;
// const dbUrl = `mongodb://localhost:27017`;
//const dbUrl = `mongodb://localhost:27017`; NOT working need IP v6 / localhost!==IP v6
const dbUrl = `mongodb://127.0.0.1:27017`;
const database = 'GoodBook';

const app = express();
app.use(cors({
   origin: 'http://localhost:3000',
   methods: 'GET,POST,PUT,DELETE'
}))
app.use(logger('dev'))
app.use(express.json({ limit: '10mb' }))
app
   .use('/api/ReadingClubs', clubsRouter)
   .use('/api/AllUsers', usersRouter)
   .use('/api/QuestionRoom', questionsRouter)
   .use('/api/ExchangePage', booksRouter)
   .use('/api/Login', loginRouter)
   .use('/api/Register', registerRouter)
   .use('/api/', commentsRouter) 
   .use((req, res) => {
      sendErrorResponse(req, res, 404, `This is not the page you are looking for...`);
  });
  
app.use(function (err, req, res, next) {
   console.error(err.stack)
   sendErrorResponse(req, res, err.status || 500, `Server error: ${err.message}`, err);
});


(async () => {
   const con = await MongoClient.connect(dbUrl);
   const db = con.db(database);
   app.locals.db = db;
   app.listen(PORT, HOSTNAME, () => {
      console.log(`HTTP Server listening on: http://${HOSTNAME}:${PORT}`);
   })
})();


app.on('error', err => {
   console.log('Server error:', err);
});