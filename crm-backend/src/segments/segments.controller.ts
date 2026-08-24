import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/permissions/catalog';
import { AddSegmentMemberDto } from './dto/add-segment-member.dto';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { SegmentsService } from './segments.service';

@Controller('segments')
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SEGMENTS_READ)
  list() {
    return this.segments.list();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.SEGMENTS_READ)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.segments.get(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.SEGMENTS_WRITE)
  create(@Body() dto: CreateSegmentDto) {
    return this.segments.create(dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.SEGMENTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.segments.remove(id);
  }

  @Get(':id/members')
  @RequirePermission(PERMISSIONS.SEGMENTS_READ)
  listMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.segments.listMembers(id);
  }

  @Post(':id/members')
  @RequirePermission(PERMISSIONS.SEGMENTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddSegmentMemberDto) {
    return this.segments.addMember(id, dto);
  }

  @Delete(':id/members/:companyId')
  @RequirePermission(PERMISSIONS.SEGMENTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.segments.removeMember(id, companyId);
  }

  @Post(':id/recompute')
  @RequirePermission(PERMISSIONS.SEGMENTS_WRITE)
  recompute(@Param('id', ParseUUIDPipe) id: string) {
    return this.segments.recomputeSmartSegment(id);
  }
}
