import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Updateable } from 'kysely';
import type { ContactsTable } from '../../db/types';
import { isPgUniqueViolation } from '../common/db/pg-errors';
import { TenantDb } from '../database/tenant-db.service';
import type { CreateContactDto } from './dto/create-contact.dto';
import type { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly tenantDb: TenantDb) {}

  list(companyId?: string) {
    let query = this.tenantDb.db
      .selectFrom('contacts')
      .selectAll()
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('deletedAt', 'is', null);
    if (companyId) query = query.where('companyId', '=', companyId);
    return query.orderBy('createdAt', 'desc').execute();
  }

  async get(id: string) {
    const contact = await this.tenantDb.db
      .selectFrom('contacts')
      .selectAll()
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    if (!contact) throw new NotFoundException('Contato não encontrado.');
    return contact;
  }

  async create(dto: CreateContactDto) {
    try {
      return await this.tenantDb.db
        .insertInto('contacts')
        .values({
          workspaceId: this.tenantDb.workspaceId,
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          title: dto.title ?? null,
          companyId: dto.companyId ?? null,
          sourceCampaignId: dto.sourceCampaignId ?? null,
          ownerId: dto.ownerId ?? this.tenantDb.workspaceMemberId,
          customFields: dto.customFields ?? {},
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (err) {
      if (isPgUniqueViolation(err)) throw new ConflictException('Já existe um contato com esse e-mail neste workspace.');
      throw err;
    }
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.get(id);

    const values: Updateable<ContactsTable> = {};
    if (dto.firstName !== undefined) values.firstName = dto.firstName;
    if (dto.lastName !== undefined) values.lastName = dto.lastName;
    if (dto.email !== undefined) values.email = dto.email;
    if (dto.phone !== undefined) values.phone = dto.phone;
    if (dto.title !== undefined) values.title = dto.title;
    if (dto.companyId !== undefined) values.companyId = dto.companyId;
    if (dto.sourceCampaignId !== undefined) values.sourceCampaignId = dto.sourceCampaignId;
    if (dto.ownerId !== undefined) values.ownerId = dto.ownerId;
    if (dto.customFields !== undefined) values.customFields = dto.customFields;

    try {
      return await this.tenantDb.db
        .updateTable('contacts')
        .set(values)
        .where('id', '=', id)
        .where('workspaceId', '=', this.tenantDb.workspaceId)
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (err) {
      if (isPgUniqueViolation(err)) throw new ConflictException('Já existe um contato com esse e-mail neste workspace.');
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.tenantDb.db
      .updateTable('contacts')
      .set({ deletedAt: new Date() })
      .where('id', '=', id)
      .where('workspaceId', '=', this.tenantDb.workspaceId)
      .execute();
  }
}
