import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  var whitelist = [
    'http://167.99.76.86',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost',
  ];
  const httpsOptions = {
    // key: fs.readFileSync(join(__dirname, '../key.pem')),
    // cert: fs.readFileSync(join(__dirname, '../certificate.pem')),
  };

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: function (origin, callback) {
        let curdate = new Date();
        if (!origin || whitelist.indexOf(origin) !== -1) {
          // if (whitelist.indexOf(origin) !== -1) {

          console.log(
            'allowed cors for: ',
            origin + ' Date: ' + curdate.toString().substring(0, 24),
          );
          callback(null, true);
        } else {
          console.log(
            'blocked cors for: ',
            origin + ' Date: ' + curdate.toString().substring(0, 24),
          );
          callback(new Error('Not allowed by CORS'));
        }
      },
      allowedHeaders:
        'Origin, Authorization, X-Requested-With, X-HTTP-Method-Override,X-api-key, Content-Type, Accept, Observe',
      methods: 'GET,PUT,POST,PATCH,DELETE,UPDATE,OPTIONS',
      credentials: true,
    },
    // httpsOptions,
  });
  const config1 = new DocumentBuilder()
    .setTitle('HRMIS APIsss')
    .setDescription('hrmis backend')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Bearer',
    })
    .addTag('Devs')
    .build();
  const document1 = SwaggerModule.createDocument(app, config1);
  SwaggerModule.setup('api', app, document1);
  app.useGlobalPipes(new ValidationPipe());

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads', 'jewelry-items');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(3000);
  // await app.listen(process.env.NODE_ENV == 'development' ? 3000 : 3005);
}
bootstrap();
