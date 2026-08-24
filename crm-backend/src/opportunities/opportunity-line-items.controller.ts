import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { AddLineItemDto } from './dto/add-line-item.dto';
import { OpportunityLineItemsService } from './opportunity-line-items.service';

@Controller('opportunities/:opportunityId/line-items')
export class OpportunityLineItemsController {
  constructor(private readonly lineItems: OpportunityLineItemsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_READ)
  list(@Param('opportunityId', ParseUUIDPipe) opportunityId: string) {
    return this.lineItems.list(opportunityId);
  }

  @Post()
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_WRITE)
  add(@Param('opportunityId', ParseUUIDPipe) opportunityId: string, @Body() dto: AddLineItemDto) {
    return this.lineItems.add(opportunityId, dto);
  }

  @Delete(':lineItemId')
  @RequirePermission(PERMISSIONS.OPPORTUNITIES_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('opportunityId', ParseUUIDPipe) opportunityId: string, @Param('lineItemId', ParseUUIDPipe) lineItemId: string) {
    return this.lineItems.remove(opportunityId, lineItemId);
  }
}
