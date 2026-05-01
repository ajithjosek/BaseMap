import { Test, TestingModule } from '@nestjs/testing';
import { CapabilitiesController } from './capabilities.controller';

describe('CapabilitiesController', () => {
  let controller: CapabilitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CapabilitiesController],
    }).compile();

    controller = module.get<CapabilitiesController>(CapabilitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
