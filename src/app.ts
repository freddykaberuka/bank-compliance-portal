import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { validateJWTConfig } from './utils/jwt';
import authRoutes from './routes/auth';

// Validate JWT config
validateJWTConfig();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Routes
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

app.use('/auth', authRoutes);


app.use(errorHandler);

export default app;