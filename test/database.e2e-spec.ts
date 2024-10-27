// test/database.e2e-spec.ts
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Database Status (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/database/status (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/database/status');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Database connection is healthy!');
  });

  afterAll(async () => {
    await app.close();
  });
});
