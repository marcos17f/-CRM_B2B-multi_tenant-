import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';

// status NÃO está aqui de propósito — transições passam por /start, /complete, /cancel
// (ver ServiceOrdersService), que aplicam as regras de negócio de cada uma.
export class UpdateServiceOrderDto extends PartialType(OmitType(CreateServiceOrderDto, ['companyId'] as const)) {}
