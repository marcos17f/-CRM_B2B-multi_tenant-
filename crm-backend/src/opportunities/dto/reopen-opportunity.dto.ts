import { IsUUID } from 'class-validator';

export class ReopenOpportunityDto {
  /** Precisa ser um estágio do tipo "open" do mesmo pipeline da oportunidade. */
  @IsUUID()
  stageId!: string;
}
