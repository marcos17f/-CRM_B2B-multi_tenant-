import { Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { RecomputeRfmDto } from './dto/recompute-rfm.dto';
import { MessagingMetricsService } from './messaging-metrics.service';
import { ListRfmFilters, RfmService } from './rfm.service';
import { SeasonalityService } from './seasonality.service';

const DEFAULT_WINDOW_DAYS = 30;

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly rfm: RfmService,
    private readonly seasonality: SeasonalityService,
    private readonly messagingMetrics: MessagingMetricsService,
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

  /** Métricas de WhatsApp (FRT, taxa de resposta, distribuição humano/automação) pra um período — usado pela Visão Geral e por Relatórios de Performance. */
  @Get('messaging')
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  messaging(@Query() query: DateRangeQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return this.messagingMetrics.getMetrics(from, to);
  }
}
