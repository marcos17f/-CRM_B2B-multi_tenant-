import { OmitType, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateEquipmentDto } from './create-equipment.dto';

export class UpdateEquipmentDto extends PartialType(OmitType(CreateEquipmentDto, ['companyId'] as const)) {
  @IsOptional()
  @IsIn(['active', 'inactive', 'sold'])
  status?: string;
}
