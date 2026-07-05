/**
 * QuestXLM Oracle Service
 * 
 * Production-ready oracle service for verifying quiz answers and managing
 * the learn-to-earn protocol security. Features Byzantine fault tolerance,
 * comprehensive monitoring, and advanced anti-cheat mechanisms.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import winston from 'winston';
import { register } from 'prometheus-client';

// Import services
import { AnswerVerificationService } from './services/AnswerVerificationService.js';
import { AntiCheatEngine } from './services/AntiCheatEngine.js';
import { MetricsService } from './services/MetricsService.js';
import { ContractService } from './services/ContractService.js';
import { CacheService } from './services/CacheService.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { validationMiddleware } from './middleware/validation.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import answerRoutes from './routes/answers.js';
import leaderboardRoutes from './routes/leaderboard.js';
import healthRoutes from './routes/health.js';
import metricsRoutes from './routes/metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'questxlm-oracle' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class OracleServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.logger = logger;
    
    // Initialize services
    this.initializeServices();
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup routes
    this.setupRoutes();
    
    // Setup error handling
    this.setupErrorHandling();
  }

  initializeServices() {
    try {
      this.metricsService = new MetricsService();
      this.cacheService = new CacheService();
      this.contractService = new ContractService();
      this.answerVerificationService = new AnswerVerificationService(
        this.contractService,
        this.cacheService
      );
      this.antiCheatEngine = new AntiCheatEngine();
      
      this.logger.info('All services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
        
        // Update metrics
        this.metricsService.recordHttpRequest(
          req.method,
          req.route?.path || req.url,
          res.statusCode,
          duration
        );
      });
      
      next();
    });

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  setupRoutes() {
    // Health check (no auth required)
    this.app.use('/health', healthRoutes);
    
    // Metrics endpoint (no auth required, but can be restricted)
    this.app.use('/metrics', metricsRoutes);

    // API routes (with authentication)
    this.app.use('/api/answers', authMiddleware, answerRoutes);
    this.app.use('/api/leaderboard', leaderboardRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'QuestXLM Oracle Service',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          answers: '/api/answers',
          leaderboard: '/api/leaderboard'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);

    // Global exception handlers
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('SIGTERM');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('SIGTERM');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  async start() {
    try {
      // Initialize database connections, cache, etc.
      await this.initializeConnections();
      
      this.server = this.app.listen(this.port, () => {
        this.logger.info(`QuestXLM Oracle Server started on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version
        });
      });

      // Setup keep-alive
      this.server.keepAliveTimeout = 65000; // 65 seconds
      this.server.headersTimeout = 66000; // 66 seconds

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async initializeConnections() {
    try {
      // Initialize contract connection
      await this.contractService.initialize();
      
      // Warm up cache
      await this.cacheService.warmUp();
      
      this.logger.info('All connections initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize connections:', error);
      throw error;
    }
  }

  async gracefulShutdown(signal) {
    this.logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new requests
    if (this.server) {
      this.server.close(() => {
        this.logger.info('HTTP server closed');
      });
    }

    try {
      // Close database connections, cache, etc.
      await this.cacheService.close();
      
      this.logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new OracleServer();
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default OracleServer;