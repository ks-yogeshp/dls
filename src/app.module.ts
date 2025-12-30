import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { MailService } from './common/mail/mail.service';
import { ImageModule } from './image/image.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [ScheduleModule.forRoot(), GraphQLModule.forRoot({
    driver: ApolloDriver,
    autoSchemaFile: join(process.cwd(),'src/schema.gql'),
    context: ({ req }) => ({ req }),

  }), CommonModule, ImageModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
