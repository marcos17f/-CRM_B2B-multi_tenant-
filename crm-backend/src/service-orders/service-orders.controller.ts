import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { AddServiceOrderPartDto } from './dto/add-service-order-part.dto';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { ServiceOrdersService } from './service-orders.service';

@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrders: ServiceOrdersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_READ)
  list(@Query('companyId') companyId?: string, @Query('status') status?: string, @Query('technicianId') technicianId?: string) {
    return this.serviceOrders.list({ companyId, status, technicianId });
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceOrders.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_WRITE)
  create(@Body() dto: CreateServiceOrderDto) {
    return this.serviceOrders.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_WRITE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceOrderDto) {
    return this.serviceOrders.update(id, dto);
  }

  @Post(':id/start')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_WRITE)
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceOrders.start(id);
  }

  @Post(':id/complete')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_WRITE)
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceOrders.complete(id);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_WRITE)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceOrders.cancel(id);
  }

  @Get(':id/parts')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_READ)
  listParts(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceOrders.listParts(id);
  }

  @Post(':id/parts')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_WRITE)
  addPart(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddServiceOrderPartDto) {
    return this.serviceOrders.addPart(id, dto);
  }

  @Delete(':id/parts/:partId')
  @RequirePermission(PERMISSIONS.SERVICE_ORDERS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removePart(@Param('id', ParseUUIDPipe) id: string, @Param('partId', ParseUUIDPipe) partId: string) {
    return this.serviceOrders.removePart(id, partId);
  }
}
