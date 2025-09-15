import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { Services } from 'src/utils/constants';
import { IAuthService } from '../auth';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: Services.AUTH,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
