import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentService } from './equipment.service';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  @RequirePermission(PERMISSIONS.EQUIPMENT_READ)
  list(@Query('companyId') companyId?: string) {
    return this.equipment.list(companyId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.EQUIPMENT_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipment.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.EQUIPMENT_WRITE)
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipment.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.EQUIPMENT_WRITE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipment.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.EQUIPMENT_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipment.remove(id);
  }
}
