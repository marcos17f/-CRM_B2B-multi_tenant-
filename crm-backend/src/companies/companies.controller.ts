import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { EquipmentService } from '../equipment/equipment.service';
import { RfmService } from '../reports/rfm.service';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companies: CompaniesService,
    private readonly rfm: RfmService,
    private readonly equipment: EquipmentService,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.COMPANIES_READ)
  list() {
    return this.companies.list();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.COMPANIES_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.companies.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.COMPANIES_WRITE)
  create(@Body() dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.COMPANIES_WRITE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto) {
    return this.companies.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.COMPANIES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.companies.remove(id);
  }

  /** Histórico de snapshots RFM da company (ver guia RFM seção 1.5) — evolução do segmento ao longo do tempo. */
  @Get(':id/rfm')
  @RequirePermission(PERMISSIONS.REPORTS_READ)
  rfmHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.rfm.getCompanyHistory(id);
  }

  /** Máquinas/equipamentos que essa company possui (guia agro — cadastro de equipamento). */
  @Get(':id/equipment')
  @RequirePermission(PERMISSIONS.EQUIPMENT_READ)
  equipmentList(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipment.list(id);
  }
}
