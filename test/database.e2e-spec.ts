import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Database Status (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  it('/database/status (GET)', async () => {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    const token = jwtService.sign(
      { userId: 'test-user-id' },
      { secret: jwtSecret },
    );

    const response = await request(app.getHttpServer())
      .get('/database/status')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.text).toBe('Database connection is healthy!');
  });

  afterAll(async () => {
    await app.close();
  });
});
