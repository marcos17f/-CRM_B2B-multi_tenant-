import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PlansService } from './plans.service';

/** Catálogo público de planos (tela de preços) — não exige login. */
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Public()
  @Get()
  list() {
    return this.plans.listPlans();
  }
}
