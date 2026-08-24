import { Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { RecomputeRfmDto } from './dto/recompute-rfm.dto';
import { ListRfmFilters, RfmService } from './rfm.service';
import { SeasonalityService } from './seasonality.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly rfm: RfmService,
    private readonly seasonality: SeasonalityService,
  ) {}

  @Get('rfm')
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  listRfm(
    @Query('segment') segment?: string,
    @Query('sortBy') sortBy?: ListRfmFilters['sortBy'],
    @Query('order') order?: ListRfmFilters['order'],
  ) {
    return this.rfm.listLatest({ segment, sortBy, order });
  }

  @Post('rfm/recompute')
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  recomputeRfm(@Body() dto: RecomputeRfmDto) {
    return this.rfm.recompute(dto.periodMonths);
  }

  @Get('top-customers')
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  topCustomers(@Query('limit', new ParseIntPipe({ optional: true })) limit = 20, @Query('lifetime') lifetime?: string) {
    return this.rfm.topCustomers(limit, lifetime === 'true');
  }

  @Get('seasonality')
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  seasonalityReport() {
    return this.seasonality.bySeason();
  }
}
