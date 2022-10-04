import * as express from 'express';
import * as cors from 'cors';
import * as logger from 'morgan';
import { sendErrorResponse } from './utils';
import commentsRouter from './routes/comments-Router';
import clubsRouter from './routes/clubs-Router';

const HOSTNAME = 'localhost';
const PORT = 4000;

const app = express();
// CORS, logger (morgan), JSON limit -> config_____________
app.use(cors({
   origin: 'http://localhost:3000',
   methods: 'GET,POST'
}))
app.use(logger('dev'))
app.use(express.json({ limit: '10mb' }))
//____________app_ROUTERS______(users,comments,questions,clubs,books)

app
   .use('/api/comments', commentsRouter)
   .use('/api/clubs', clubsRouter);


//  
app.use(function (err, req, res, next) {
   console.error(err.stack)
   sendErrorResponse(req, res, err.status || 500, `Server error: ${err.message}`, err);
})
app.listen(PORT, HOSTNAME, () => {
   console.log(`HTTP Server listening on: http://${HOSTNAME}:${PORT}`);
})
app.on('error', err => {
   console.log('Server error:', err);
});