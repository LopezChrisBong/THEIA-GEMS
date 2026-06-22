import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { DataSource, Repository } from 'typeorm';
import { Notifications } from './entities/notification.entity';
import { UserDetail, Users, UserType } from 'src/entities';

@Injectable()
export class NotificationsService {
  constructor(private dataSource: DataSource, @InjectRepository(Notifications)
  private readonly Notifications: Repository<Notifications>,) { }
  getMyNotifs(user: any) {
    return this.dataSource.manager
      .createQueryBuilder(Notifications, 'notif')
      .select([
        'notif.*',
        "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as notif_from_name",
      ])
      .leftJoin(UserDetail, 'us', 'notif.user_detailID_from = us.id')
      .where('notif.user_detailID_to = :id', { id: user.userdetail.id })
      .orderBy('notif.created_at', 'DESC')
      // .addOrderBy('notif.isOpenned', 'ASC')
      .getRawMany();
  }

  getMyNewNotifsCount(user: any) {
    return this.dataSource.manager
      .createQueryBuilder(Notifications, 'notif')
      .where('notif.user_detailID_to = :id', { id: user.userdetail.id })
      .andWhere('notif.isOpenned = 0')
      .getCount();
  }

  async getMyNotifAccess(user: any): Promise<boolean> {
    const userId = user?.userdetail?.user?.id;
    if (!userId) return false;

    // Admin and superadmin always have access — the toggle only governs employees.
    if (user.userdetail.user.usertypeID === 1 || user.userdetail.user.user_roleID === 5) {
      return true;
    }

    const row = await this.dataSource.manager.findOne(Users, {
      where: { id: userId },
    });
    return !!row?.canAccessNotifications;
  }

  getAssignableUsers() {
    return this.dataSource
      .createQueryBuilder(Users, 'u')
      .select([
        'u.id as id',
        'u.email as email',
        'u.usertypeID as usertypeID',
        'u.user_roleID as user_roleID',
        'u.canAccessNotifications as canAccessNotifications',
        'ut.description as usertype_desc',
        "IF (!ISNULL(ud.mname), concat(ud.fname, ' ', SUBSTRING(ud.mname, 1, 1), '. ', ud.lname), concat(ud.fname, ' ', ud.lname)) as fullName",
      ])
      .leftJoin(UserDetail, 'ud', 'ud.userID = u.id')
      .leftJoin(UserType, 'ut', 'ut.id = u.usertypeID')
      .where('u.isValidated = 1')
      .andWhere('u.isAdminApproved = 1')
      .orderBy('fullName', 'ASC')
      .getRawMany();
  }

  async setUserNotifAccess(userId: number, canAccessNotifications: boolean) {
    await this.dataSource.manager.update(Users, userId, {
      canAccessNotifications,
    });
    return {
      msg: 'Updated successfully.',
      status: HttpStatus.OK,
    };
  }

  markAllAsReadFunc(data: any) {
    try {
      for (var i = 0; i < data.length; i++) {
        this.Notifications.update(data[i].id, {
          isOpenned: true,
        });
      }

      return {
        msg: 'Saved successfully.',
        status: HttpStatus.OK,
      };
    } catch (error) {
      return {
        msg: 'Something went wrong.',
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }

  markOneAsRead(data: any) {
    try {
      this.Notifications.update(data.id, {
        isOpenned: true,
      });

      return {
        msg: 'Saved successfully.',
        status: HttpStatus.OK,
      };
    } catch (error) {
      return {
        msg: 'Something went wrong.',
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }

  findAll() {
    return `This action returns all notifications`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
