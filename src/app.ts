import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { validateJWTConfig } from './utils/jwt';
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applicationRoutes';
import { openApiSpec } from './config/swagger';

// Validate JWT config
validateJWTConfig();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Swagger / OpenAPI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiSpec);
});

// Routes
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

app.use('/auth', authRoutes);
app.use('/applications', applicationRoutes);

app.use(errorHandler);

export default app;