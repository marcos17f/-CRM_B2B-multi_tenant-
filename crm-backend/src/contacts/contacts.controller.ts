import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CONTACTS_READ)
  list(@Query('companyId') companyId?: string) {
    return this.contacts.list(companyId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.CONTACTS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.contacts.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CONTACTS_WRITE)
  create(@Body() dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.CONTACTS_WRITE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.CONTACTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contacts.remove(id);
  }
}
