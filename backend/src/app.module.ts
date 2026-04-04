import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserDetailsModule } from './user-details/user-details.module';
import { UserTypeModule } from './user-type/user-type.module';

// import config from '../ormconfig';
import entities from './entities';
// import { PDFModule } from '@t00nday/nestjs-pdf';
import { PdfGeneratorModule } from './pdf-generator/pdf-generator.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UserRoleModule } from './user-role/user-role.module';
import { SysModulesModule } from './sys-modules/sys-modules.module';
import { AssignedModulesModule } from './assigned-modules/assigned-modules.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port:  parseInt(process.env.DATABASE_PORT || '3306'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: entities,
      synchronize: true, //for production this is set to be false
    }),
    // PDFModule.register({
    //   isGlobal: true,
    //   view: {
    //     root: '',
    //     engine: 'htmling',
    //   },
    // }),
    AuthModule,
    UserDetailsModule,
    UserTypeModule,
    PdfGeneratorModule,
    MailModule,
    NotificationsModule,
    UserRoleModule,
    SysModulesModule,
    AssignedModulesModule,
    SmsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // constructor(private dataSource: DataSource) { }
}
