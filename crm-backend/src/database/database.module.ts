import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createKysely } from '../../db/kysely';
import { KYSELY_RAW } from './database.constants';
import { TenantDb } from './tenant-db.service';

@Global()
@Module({
  providers: [
    {
      provide: KYSELY_RAW,
      useFactory: (config: ConfigService) => createKysely(config.getOrThrow<string>('DATABASE_URL')),
      inject: [ConfigService],
    },
    TenantDb,
  ],
  exports: [KYSELY_RAW, TenantDb],
})
export class DatabaseModule {}
