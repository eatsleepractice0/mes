import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  }),
);
app.use(express.json());

app.use('/api/v1', healthRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`mes-api listening on http://localhost:${port}`);
});
