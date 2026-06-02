import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { hashPassword } from 'src/auth/utils/bcrypt';
import {

  Notifications,
  Users,
  UserType,
} from 'src/entities';
import { Branch } from 'src/branches/entities/branch.entity';

import { UserTypeService } from 'src/user-type/user-type.service';
import { Brackets, DataSource, Repository } from 'typeorm';
import { CreateUserAuthDto } from './dto/create-user-auth.dto';
import { CreateUserDetailDto } from './dto/create-user-detail.dto';
import { UpdateUserAuthDto } from './dto/update-user-auth.dto';
import { UpdateUserCredential } from '../auth/dto/update-user-credential.dto';
import { UpdateUserDetailDto } from './dto/update-user-detail.dto';
import { UserDetail } from './entities/user-detail.entity';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreatePDSDto } from './dto/create-pds.dto';
import { create } from 'domain';
import e from 'express';
// import { ellipse } from 'pdfkit';
import { UpdatePDSDto } from './dto/update-pds.dto';
import { UpdateMyPDSDto } from './dto/update-my-pds.dto';
import { UpdateVerifiedUser } from './dto/update-verified-user.dto';
import { UserTypeRole } from './dto/update-user-type-role.dto';
import { isNotEmpty } from 'class-validator';
import { empty } from 'rxjs';
import {
  getCurrentDateTimeString,
  trimString,
} from 'src/shared/global-function';

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectRepository(UserDetail)
    private readonly userdetailsRepository: Repository<UserDetail>,
    private authService: AuthService,
    private usertypeService: UserTypeService,
    private dataSource: DataSource,
  ) {}



  async updateVerifiedUser(updateVU: UpdateVerifiedUser) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (updateVU.user_roleID == 5) {
        return {
          msg: 'Request cannot be granted! You cannot add new superadmin.',
          status: HttpStatus.BAD_REQUEST,
        };
      } else {
        await queryRunner.manager.update(Users, updateVU.userID, {
          isAdminApproved: true,
          usertypeID: updateVU.usertypeID,
          user_roleID: updateVU.user_roleID,
          assignedModuleID: updateVU.assignedModuleID,
        });

        // Update branchId in UserDetail if provided
        if (updateVU.branchId !== undefined) {
          await queryRunner.manager.update(
            UserDetail,
            { userID: updateVU.userID },
            { branchId: updateVU.branchId },
          );
        }

        // await queryRunner.manager.update(
        //   Employee,
        //   { user_detailID: updateVU.id },
        //   {
        //     empStatusID: updateVU.empStatusID,
        //     positionID: updateVU.positionID,
        //     designationID: updateVU.designationID,
        //     officeID: updateVU.officeID,
        //     empID: updateVU.empID,
        //     date_hired: updateVU.date_hired,
        //   },
        // );

        await queryRunner.commitTransaction();
        return {
          msg: updateVU.update_type == 1 ? 'User verified.' : 'User updated.',
          status: HttpStatus.OK,
        };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        msg: error,
        status: HttpStatus.BAD_REQUEST,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async createuser(createUserDetailDto: CreateUserDetailDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    // const user_type = await this.usertypeService.getUserType(createUserDetailDto.usertype);
    // const stat = await this.statusService.getStatus(createUserDetailDto.status);
    // const city = await this.cityService.getSpecificCity(createUserDetailDto.city)
    try {
      //  CREATING USER DETAILS
      const newUserDetail = queryRunner.manager.create(UserDetail, {
        fname: createUserDetailDto.fname,
        mname: createUserDetailDto.mname,
        lname: createUserDetailDto.lname,
        suffix: createUserDetailDto.suffix,
      });

      await queryRunner.manager.save(newUserDetail);

      await queryRunner.commitTransaction();

      return {
        status: HttpStatus.CREATED,
        msg: 'User successfully saved',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      const toReturn = {
        msg: err,
        status: HttpStatus.BAD_REQUEST,
      };

      return toReturn;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllUsersPDS(status: number) {
    return await this.userdetailsRepository
      .createQueryBuilder('userdetail')
      .select([
        'userdetail.*',
        "IF (!ISNULL(userdetail.mname) AND LOWER(userdetail.mname) != 'n/a', concat(userdetail.fname, ' ',SUBSTRING(userdetail.mname, 1, 1) ,'. ',userdetail.lname) ,concat(userdetail.fname, ' ', userdetail.lname)) as fullname",
      ])
      .leftJoin(Users, 'user', 'user.id = userdetail.userID')
      .where('user.isValidated = 1')
      .andWhere('user.isAdminApproved = 1')
      .andWhere('userdetail.id != 2') //security user
      .andWhere('userdetail.status = :status', { status })
      .getRawMany();
  }

  async getAllUsersToVerify() {
    let data = await this.dataSource.manager
      .createQueryBuilder(UserDetail, 'UD')
      .select([
        "IF (!ISNULL(UD.mname)  AND LOWER(UD.mname) != 'n/a', concat(UD.fname, ' ',SUBSTRING(UD.mname, 1, 1) ,'. ',UD.lname) ,concat(UD.fname, ' ', UD.lname)) as name",
        'UD.id as id',
        'UD.fname as fname',
        'UD.mname as mname',
        'UD.lname as lname',
      ])
      // .leftJoinAndMapOne(
      //   'userdetail.employee',
      //   Employee,
      //   'emp',
      //   'UD.id = emp.user_detailID',
      // )
      .leftJoinAndMapOne('UD.user', Users, 'user', 'UD.userID = user.id')

      .where('user.isValidated = 1')
      .andWhere('user.id != 2') //security user ID
      .andWhere('user.isAdminApproved = 0')
      .getRawMany();

    return data;
  }

  async getAllVerifiedUser() {
    let data = await this.dataSource.manager
      .createQueryBuilder(UserDetail, 'UD')
      .select([
        "IF (!ISNULL(UD.mname) AND LOWER(UD.mname) != 'n/a', concat(UD.fname, ' ',SUBSTRING(UD.mname, 1, 1) ,'. ',UD.lname) ,concat(UD.fname, ' ', UD.lname)) as name",
        'UD.id as id',
        'UD.fname as fname',
        'UD.mname as mname',
        'UD.lname as lname',
        'UD.branch_id as branchId',
      ])
      // .leftJoinAndMapOne(
      //   'userdetail.employee',
      //   Employee,
      //   'emp',
      //   'UD.id = emp.user_detailID',
      // )
      .leftJoinAndMapOne('UD.user', Users, 'user', 'UD.userID = user.id')

      .where('user.isValidated = 1')
      .andWhere('user.id != 2') //security user ID
      .andWhere('user.isAdminApproved = 1')
      .getRawMany();

    return data;
    // return await this.userdetailsRepository
    //   .createQueryBuilder('userdetail')
    //   .leftJoinAndMapOne(
    //     'userdetail.employee',
    //     Employee,
    //     'emp',
    //     'userdetail.id = emp.user_detailID',
    //   )
    //   .leftJoinAndMapOne(
    //     'userdetail.user',
    //     Users,
    //     'user',
    //     'userdetail.userID = user.id',
    //   )

    //   .where('user.isValidated = 1')
    //   .andWhere('user.id != 2') //security user ID
    //   .andWhere('user.isAdminApproved = 1')
    //   .getMany();
  }




  getAllUser() {
    return this.userdetailsRepository
      .createQueryBuilder('userdetail')
      .leftJoinAndMapOne(
        'userdetail.user',
        Users,
        'user',
        'userdetail.userID = user.id',
      )
      .leftJoinAndMapOne(
        'userdetail.usertype',
        UserType,
        'usertype',
        'user.usertypeID = usertype.id',
      )
      .getMany();
  }

  async getFinanceDir() {
    return await this.dataSource
      .createQueryBuilder(UserDetail, 'us')
      .leftJoin(Users, 'u', 'us.userID = u.id')
      .select([
        'us.id as userID',
        "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
      ])
      .where('u.user_roleID = 3')
      .getRawOne();
  }

  async getAccountantUser() {
    return await this.dataSource
      .createQueryBuilder(UserDetail, 'us')
      .leftJoin(Users, 'u', 'us.userID = u.id')
      .select([
        'us.id as userID',
        "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
      ])
      .where('u.user_roleID = 11')
      .getRawOne();
  }

  async getCollegePres() {
    return await this.dataSource
      .createQueryBuilder(UserDetail, 'us')
      .leftJoin(Users, 'u', 'us.userID = u.id')
      .select([
        'us.id as userID',
        "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
      ])
      .where('u.user_roleID = 4')
      .getRawOne();
  }

  async getVicePres() {
    return await this.dataSource
      .createQueryBuilder(UserDetail, 'us')
      .leftJoin(Users, 'u', 'us.userID = u.id')
      .select([
        'us.id as userID',
        "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
      ])
      .where('u.user_roleID = 6')
      .getRawMany();
  }

 

  // async getEmployeeStats() {
  //   const permanent = await this.dataSource
  //     .createQueryBuilder(Employee, 'e')
  //     .leftJoin(UserDetail, 'ud', 'e.user_detailID = ud.id')
  //     .leftJoin(Users, 'u', 'ud.userID = u.id')
  //     .where('e.isActive = :isActive', { isActive: true })
  //     .andWhere('e.empStatusID = 1')
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('ud.id != 2') //security userid
  //     .getCount();

  //   const temporary = await this.dataSource
  //     .createQueryBuilder(Employee, 'e')
  //     .leftJoin(UserDetail, 'ud', 'e.user_detailID = ud.id')
  //     .leftJoin(Users, 'u', 'ud.userID = u.id')
  //     .where('e.isActive = :isActive', { isActive: true })
  //     .andWhere('e.empStatusID = 2')
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('ud.id != 2') //security userid
  //     .getCount();

  //   const casual = await this.dataSource
  //     .createQueryBuilder(Employee, 'e')
  //     .leftJoin(UserDetail, 'ud', 'e.user_detailID = ud.id')
  //     .leftJoin(Users, 'u', 'ud.userID = u.id')
  //     .where('e.isActive = :isActive', { isActive: true })
  //     .andWhere('e.empStatusID = 3')
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('ud.id != 2') //security userid
  //     .getCount();

  //   const COS = await this.dataSource
  //     .createQueryBuilder(Employee, 'e')
  //     .leftJoin(UserDetail, 'ud', 'e.user_detailID = ud.id')
  //     .leftJoin(Users, 'u', 'ud.userID = u.id')
  //     .where('e.isActive = :isActive', { isActive: true })
  //     .andWhere('e.empStatusID = 4')
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('ud.id != 2') //security userid
  //     .getCount();

  //   const JO = await this.dataSource
  //     .createQueryBuilder(Employee, 'e')
  //     .leftJoin(UserDetail, 'ud', 'e.user_detailID = ud.id')
  //     .leftJoin(Users, 'u', 'ud.userID = u.id')
  //     .where('e.isActive = :isActive', { isActive: true })
  //     .andWhere('e.empStatusID = 5')
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('ud.id != 2') //security userid
  //     .getCount();

  //   const coterminous = await this.dataSource
  //     .createQueryBuilder(Employee, 'e')
  //     .leftJoin(UserDetail, 'ud', 'e.user_detailID = ud.id')
  //     .leftJoin(Users, 'u', 'ud.userID = u.id')
  //     .where('e.isActive = :isActive', { isActive: true })
  //     .andWhere('e.empStatusID = 6')
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('ud.id != 2') //security userid
  //     .getCount();

  //   const contractual = await this.dataSource
  //     .createQueryBuilder(Employee, 'e')
  //     .leftJoin(UserDetail, 'ud', 'e.user_detailID = ud.id')
  //     .leftJoin(Users, 'u', 'ud.userID = u.id')
  //     .where('e.isActive = :isActive', { isActive: true })
  //     .andWhere('e.empStatusID = 11')
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('ud.id != 2') //security userid
  //     .getCount();

  //   const total =
  //     permanent + temporary + casual + COS + JO + coterminous + contractual;

  //   return {
  //     permanent,
  //     temporary,
  //     casual,
  //     COS,
  //     JO,
  //     total,
  //     coterminous,
  //     contractual,
  //   };
  // }


  async getUpcomingBday() {
    var d = new Date();
    var mm = d.getMonth() + 1;

    const ret = await this.userdetailsRepository
      .createQueryBuilder('user')
      .select(['user.fname', 'user.lname', 'user.mname', 'user.bdate'])
      .where('MONTH(user.bdate) = :mm', { mm })
      .orderBy('DAY(user.bdate)', 'ASC')
      .getMany();
    return ret;
  }

  prependZero(num) {
    if (num < 10) {
      return '0' + num;
    } else {
      return num;
    }
  }

  getLastDay(y, m) {
    return new Date(y, m, 0).getDate();
  }

  // async getBdayToday() {
  //   var d = new Date();
  //   const mm = d.getMonth() + 1;
  //   const dd = d.getDate();
  //   const yy = d.getFullYear();
  //   let today = yy + '-' + this.prependZero(mm) + '-' + this.prependZero(dd);

  //   const lastday = this.getLastDay(yy, mm);
  //   let data = {};
  //   for (let i = 0; i < lastday; i++) {
  //     let date =
  //       yy + '-' + this.prependZero(mm) + '-' + this.prependZero(i + 1);
  //     Object.assign(data, { [date]: [] });
  //   }

  //   const ret = await this.userdetailsRepository
  //     .createQueryBuilder('user')
  //     .select(['user.fname', 'user.lname', 'user.mname', 'user.bdate'])
  //     .leftJoin(Users, 'u', 'user.userID = u.id')
  //     .leftJoin(Employee, 'e', 'e.user_detailID = user.id')
  //     .where('MONTH(user.bdate) = :mm', { mm })
  //     .andWhere('user.id != 2') //security id
  //     .andWhere('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('e.isActive = 1')
  //     // .andWhere("DAYOFMONTH(user.bdate) = :dd", { dd })
  //     .getMany();
  //   // console.log(ret)

  //   for (let j = 0; j < lastday; j++) {
  //     let date1 =
  //       yy + '-' + this.prependZero(mm) + '-' + this.prependZero(j + 1);
  //     for (let i = 0; i < ret.length; i++) {
  //       let el = ret[i];

  //       if (j + 1 == parseInt(el.bdate.substring(8, 10))) {
  //         data[date1].push({
  //           name:
  //             el.mname == '' ||
  //             el.mname == ' ' ||
  //             el.mname == null ||
  //             el.mname
  //               .toString()
  //               .replace(/\s/g, '')
  //               .replace(/\t/g, '')
  //               .toLowerCase() == 'n/a'
  //               ? el.fname + ' ' + el.lname
  //               : el.fname + ' ' + el.mname[0] + '. ' + el.lname,
  //           bdate: el.bdate,
  //         });
  //       }
  //     }
  //   }

  //   return {
  //     today,
  //     data,
  //   };
  // }

  async shiftCalendar(d1: string) {
    var d = new Date(d1);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const yy = d.getFullYear();
    let today = yy + '-' + this.prependZero(mm) + '-' + this.prependZero(dd);

    const lastday = this.getLastDay(yy, mm);
    let data = {};
    for (let i = 0; i < lastday; i++) {
      let date =
        yy + '-' + this.prependZero(mm) + '-' + this.prependZero(i + 1);
      Object.assign(data, { [date]: [] });
    }

    const ret = await this.userdetailsRepository
      .createQueryBuilder('user')
      .select(['user.fname', 'user.lname', 'user.mname', 'user.bdate'])
      .leftJoin(Users, 'u', 'user.userID = u.id')
      .where('MONTH(user.bdate) = :mm', { mm })
      .andWhere('user.id != 2') //security id
      .andWhere('u.isValidated = 1')
      .andWhere('u.isAdminApproved = 1')
      // .andWhere("DAYOFMONTH(user.bdate) = :dd", { dd })
      .getMany();
    // console.log(ret)

    for (let j = 0; j < lastday; j++) {
      let date1 =
        yy + '-' + this.prependZero(mm) + '-' + this.prependZero(j + 1);
      for (let i = 0; i < ret.length; i++) {
        let el = ret[i];

        if (j + 1 == parseInt(el.bdate.substring(8, 10))) {
          data[date1].push({
            name:
              el.mname == '' ||
              el.mname == ' ' ||
              el.mname == null ||
              el.mname
                .toString()
                .replace(/\s/g, '')
                .replace(/\t/g, '')
                .toLowerCase() == 'n/a'
                ? el.fname + ' ' + el.lname
                : el.fname + ' ' + el.mname[0] + '. ' + el.lname,
            bdate: el.bdate,
          });
        }
      }
    }

    return {
      today,
      data,
    };
  }

  searchUser(searchText: string) {
    return this.userdetailsRepository
      .createQueryBuilder('userdetail')

      .leftJoinAndMapOne(
        'userdetail.usertype',
        UserType,
        'usertype',
        'userdetail.usertypeID = usertype.id',
      )
      .leftJoinAndMapOne(
        'userdetail.user',
        Users,
        'user',
        'userdetail.userID = user.id',
      )

      .where("CONCAT( userdetail.fname,' ', userdetail.lname) like :fullname", {
        fullname: `%${searchText}%`,
      })
      .getMany();
  }

  async getUser(id: number) {
    return await this.userdetailsRepository
      .createQueryBuilder('userdetail')
      .select(['userdetail', 'user.id'])
      .leftJoinAndMapOne(
        'userdetail.user',
        Users,
        'user',
        'userdetail.userID = user.id',
      )
      .where('userdetail.id = :id', { id })
      .getOne();
  }

  async uploadProfileImg(filename: string, user: any) {
    try {
      const id = user?.userdetail?.id;
      console.log('[uploadProfileImg] filename:', filename, '| userdetail.id:', id);

      const record = await this.userdetailsRepository.findOne({ where: { id } });
      if (!record) {
        return { msg: 'User detail record not found', status: HttpStatus.BAD_REQUEST };
      }

      record.profile_img = filename;
      await this.userdetailsRepository.save(record);

      return { msg: 'Saving successful', status: HttpStatus.OK };
    } catch (error) {
      console.log('[uploadProfileImg] error:', error);
      return { msg: error, status: HttpStatus.BAD_REQUEST };
    }
  }

 async getPersonalInfo(user: any) {
    const id = user.userdetail.id;
    let data = await this.dataSource
      .createQueryBuilder(UserDetail, 'ud')
      .select([
        'ud.*',
        'u.email as email',
        'u.password as password',
      ])
      .leftJoin(Users, 'u', 'u.id = ud.userID')
      .where('ud.id = :id', { id })
      .getRawOne();
      console.log('[getPersonalInfo] profile_img from DB:', data?.profile_img);
      return data
  }

  async getUserProfileImg(curr_user: any) {
    const a = await this.userdetailsRepository
      .createQueryBuilder('ud')
      .select(['ud.profile_img as profile_img'])
      .where('ud.id = :id', { id: curr_user.userdetail.id })
      .getRawOne();

    if (a.profile_img != null) {
      return a;
    } else {
      return { profile_img: 'img_avatar.png' };
    }
  }

  async updateUserDetail(user: any, updateUserDetailDto: UpdateUserDetailDto) {
    try {
      const upd = await this.userdetailsRepository.update(user.userdetail.id, {
        fname: updateUserDetailDto.fname,
        mname: updateUserDetailDto.mname,
        lname: updateUserDetailDto.lname,
        suffix: updateUserDetailDto.suffix,
      });

      if (upd.affected == 1) {
        return {
          msg: 'Update successful.',
          status: HttpStatus.OK,
        };
      } else {
        return {
          msg: 'Update failed.',
          status: HttpStatus.BAD_REQUEST,
        };
      }
    } catch (error) {
      return {
        msg: error,
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }

  async updateEmployee(updateEmployeeDto: UpdateEmployeeDto) {
    try {
      const upd = await this.userdetailsRepository.update(
        updateEmployeeDto.id,
        {
          fname: updateEmployeeDto.fname,
          mname: updateEmployeeDto.mname,
          lname: updateEmployeeDto.lname,
          suffix: updateEmployeeDto.suffix,
        },
      );

      if (upd.affected == 1) {
        return {
          msg: 'Update successful.',
          status: HttpStatus.OK,
        };
      } else {
        return {
          msg: 'Update failed.',
          status: HttpStatus.BAD_REQUEST,
        };
      }
    } catch (error) {
      return {
        msg: error,
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }

  async updateUserInfo(userID:number,data:string,){
    let dataItem = JSON.parse(data)
        try {
        const upd = await this.userdetailsRepository.update(userID, {
        fname: dataItem.fname,
        mname: dataItem.mname,
        lname: dataItem.lname,
        });
              
        return {
          msg: 'Update successful.',
          status: HttpStatus.OK,
        };
      } catch (error) {
      return {
        msg: error,
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }

  // get for user management
  async getUsers() {
    const user = await this.dataSource
      .createQueryBuilder(Users, 'u')
      .select([
        'u.id as id',
        'u.usertypeID as usertypeID',
        'ut.description as usertype_desc',
        'ud.fname as fname',
        'ud.mname as mname',
        'ud.lname as lname',
        'u.user_roleID as user_roleID',
        'ud.branch_id as branchId',
        'b.branchName as branchName',
      ])
      .leftJoin(UserDetail, 'ud', 'u.id = ud.userID')
      .leftJoin(UserType, 'ut', 'u.usertypeID = ut.id')
      .leftJoin(Branch, 'b', 'ud.branch_id = b.id')
      .where('u.isValidated = 1')
      .andWhere('u.isAdminApproved = 1')
      .andWhere('ud.id != 2')
      .getRawMany();
    return user;
  }

  // get for allow pds update
  async getAllUserDetail() {
    const users = await this.dataSource
      .createQueryBuilder(UserDetail, 'us')
      .select([
        'us.id as id',
        "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
      ])
      .leftJoin(Users, 'u', 'u.id = us.userID')
      .where('u.isValidated = 1')
      .andWhere('u.isAdminApproved = 1')
      .andWhere('us.id != 2')
      .getRawMany();
    return users;
  }

  // async getAllPlantillaUserDetail() {
  //   const users = await this.dataSource
  //     .createQueryBuilder(UserDetail, 'us')
  //     .select([
  //       'us.id as id',
  //       "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
  //     ])
  //     .leftJoin(Users, 'u', 'u.id = us.userID')
  //     .leftJoin(Employee, 'e', 'us.id = e.user_detailID')
  //     .where('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('e.empStatusID = 1')
  //     .andWhere('us.id != 2')
  //     .getRawMany();
  //   return users;
  // }

  // async getDeanDirAboveUsers() {
  //   const users = await this.dataSource
  //     .createQueryBuilder(UserDetail, 'us')
  //     .select([
  //       'us.id as id',
  //       "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
  //     ])
  //     .leftJoin(Users, 'u', 'u.id = us.userID')
  //     .leftJoin(Employee, 'e', 'us.id = e.user_detailID')
  //     .where('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('e.empStatusID IN (1,6)')
  //     .andWhere('u.user_roleID IN (3, 4, 6, 7, 8,11)')
  //     .andWhere('us.id != 2')
  //     .getRawMany();
  //   return users;
  // }

  // async getUsersHeadProgChairAbove_Office() {
  //   const users = await this.dataSource
  //     .createQueryBuilder(UserDetail, 'us')
  //     .select([
  //       'us.id as usID',
  //       "IF(!ISNULL(us.mname) AND LOWER(us.mname) != 'n/a'  AND LOWER(us.mname) != 'na', concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
  //       'o.name as office',
  //       'e.officeID as officeID',
  //       'u.user_roleID as roleID',
  //       'o.office_underID as office_underID',
  //     ])
  //     .leftJoin(Users, 'u', 'u.id = us.userID')
  //     .leftJoin(Employee, 'e', 'us.id = e.user_detailID')
  //     .leftJoin(Office, 'o', 'o.id = e.officeID')

  //     .where('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('e.isActive = 1')
  //     .andWhere('e.empStatusID IN (1,2,6)')
  //     .andWhere('u.user_roleID IN (1,2,3, 4,5, 6, 7, 8, 9,11,12)')
  //     .andWhere('us.id != 2')
  //     .getRawMany();
  //   return users;
  // }

  // async getCPMTEmployee(year:number, tab:number) {
     
  //   const users = await this.dataSource
  //     .createQueryBuilder(UserDetail, 'us')
  //     .select([
  //       'us.id as usID',
  //       "IF(!ISNULL(us.mname) AND LOWER(us.mname) != 'n/a'  AND LOWER(us.mname) != 'na', concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
  //       'o.name as office',
  //       'e.officeID as officeID',
  //       'u.user_roleID as roleID',
  //       'o.office_underID as office_underID',
  //     ])
  //     .leftJoin(Users, 'u', 'u.id = us.userID')
  //     .leftJoin(Employee, 'e', 'us.id = e.user_detailID')
  //     .leftJoin(Office, 'o', 'o.id = e.officeID')
  //     .where('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('e.isActive = 1')
  //     .andWhere('e.empStatusID IN (1,2,6)')
  //     .andWhere('u.user_roleID IN (1,2,3, 4,5, 6, 7, 8, 9,11,12)')
  //     .andWhere('us.id != 2')
  //     .getRawMany();
      
  //   const selectedUsers = await this.dataSource
  //   .createQueryBuilder(CpmtUtil, 'cu')
  //   .select(['cu.*'])
  //   .where('cu.year = :year', { year })
  //   .andWhere('cu.composition = :tab', { tab })
  //   .getRawMany();

  //   const selectedIds = new Set(
  //   selectedUsers.map(u => String(u.user_detailID))
  //   );
  //   const newArr = users.filter(
  //     u => !selectedIds.has(u.usID)
  //   );
  //   return newArr;
  // }

  //  async getCollegeCommittee(year:number,tab:number, bureau:number) {
  //   const users = await this.dataSource
  //     .createQueryBuilder(UserDetail, 'us')
  //     .select([
  //       'us.id as usID',
  //       "IF(!ISNULL(us.mname) AND LOWER(us.mname) != 'n/a'  AND LOWER(us.mname) != 'na', concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
  //       'o.name as office',
  //       'e.officeID as officeID',
  //       'u.user_roleID as roleID',
  //       'o.office_underID as office_underID',
  //     ])
  //     .leftJoin(Users, 'u', 'u.id = us.userID')
  //     .leftJoin(Employee, 'e', 'us.id = e.user_detailID')
  //     .leftJoin(Office, 'o', 'o.id = e.officeID')

  //     .where('u.isValidated = 1')
  //     .andWhere('u.isAdminApproved = 1')
  //     .andWhere('e.isActive = 1')
  //     .andWhere('e.empStatusID IN (1,2,6)')
  //     .andWhere('us.id != 2')
  //     .orderBy('us.fname', 'ASC')
  //     .getRawMany();

  //   const selectedUsers = await this.dataSource
  //     .createQueryBuilder(EvaluationReviewCommittee, 'er')
  //     .select([
  //       'er.*'
  //     ])
  //     .where('er.year = :year', { year })
  //     .andWhere('er.composition = :tab', { tab })
  //     .andWhere('er.bureau = :bureau', { bureau })
  //     .getRawMany()

  //      const selectedIds = new Set(
  //       selectedUsers.map(u => String(u.user_detailID))
  //       );
  //       const newArr = users.filter(
  //         u => !selectedIds.has(u.usID)
  //       );
  //   return newArr;
  // }


  async getBdateBplace(id: number) {
    var data = await this.dataSource.manager
      .createQueryBuilder(UserDetail, 'us')
      .select(['us.bdate as bdate', 'us.birth_place as bplace'])
      .where('us.id = :id', { id })
      .getRawOne();
    return data;
  }

  // async getDeclarantData(user: any) {
  //   const declarant = await this.dataSource
  //     .createQueryBuilder(UserDetail, 'us')
  //     .select([
  //       // "IF (!ISNULL(us.mname), concat(us.lname,' ',us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ') ,concat(us.lname, ' ', us.fname)) as name",
  //       'us.fname as fname',
  //       'us.lname as lname',
  //       'us.mname as mname',
  //       'us.suffix as suffix',
  //       'us.permanent_house_no as residential_house_no',
  //       'us.permanent_street as residential_street',
  //       'us.permanent_subd as residential_subd',
  //       'us.permanent_brgy as residential_brgy',
  //       'us.permanent_city as residential_city',
  //       'p.description as position',
  //       'o.name as office',
  //     ])
  //     .leftJoin(Employee, 'e', 'e.user_detailID = us.id')
  //     .leftJoin(Office, 'o', 'o.id = e.officeID')
  //     .leftJoin(Position, 'p', 'p.id = e.positionID')
  //     .where('us.id = :id', { id: user.userdetail.id })
  //     .getRawOne();
  //   return declarant;
  // }

  // getSpecificDeclarantData(id: number) {
  //   return this.dataSource
  //     .createQueryBuilder(UserDetail, 'us')
  //     .select([
  //       // "IF (!ISNULL(us.mname), concat(us.lname,' ',us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ') ,concat(us.lname, ' ', us.fname)) as name",
  //       'us.fname as fname',
  //       'us.lname as lname',
  //       'us.mname as mname',
  //       'us.suffix as suffix',
  //       'us.permanent_house_no as residential_house_no',
  //       'us.permanent_street as residential_street',
  //       'us.permanent_subd as residential_subd',
  //       'us.permanent_brgy as residential_brgy',
  //       'us.permanent_city as residential_city',
  //       'p.description as position',
  //       'o.name as office',
  //     ])
  //     .leftJoin(Employee, 'e', 'e.user_detailID = us.id')
  //     .leftJoin(Office, 'o', 'o.id = e.officeID')
  //     .leftJoin(Position, 'p', 'p.id = e.positionID')
  //     .where('us.id = :id', { id })
  //     .getRawOne();
  // }

  // async getDeclarantPositionAsOf(user: any, dateOf: string) {
  //   // console.log(dateOf);
  //   const data = await this.dataSource
  //     .createQueryBuilder(WorkExperience, 'wx')
  //     .select(['wx.*'])
  //     .where('wx.user_detailID = :id', { id: user.userdetail.id })
  //     .andWhere('YEAR(wx.date_from) = :dateOf', { dateOf })
  //     .andWhere("LOWER(wx.company) LIKE '%davao del norte state college%'")
  //     .andWhere(
  //       "LOWER(wx.appointment_status) NOT IN ('contract of service', 'job order')",
  //     )
  //     .getRawMany();

  //   if (data.length > 0) {
  //     return data[0];
  //   } else {
  //     let d = new Date();
  //     if (parseInt(dateOf) != d.getFullYear()) {
  //       let loop = true;
  //       let data;
  //       let dOf = parseInt(dateOf);
  //       let ctr = 0;
  //       do {
  //         data = await this.dataSource
  //           .createQueryBuilder(WorkExperience, 'wx')
  //           .select(['wx.*'])
  //           .where('wx.user_detailID = :id', { id: user.userdetail.id })
  //           .andWhere('YEAR(wx.date_from) = :dateOf1', {
  //             dateOf1: dOf,
  //           })
  //           .andWhere(
  //             "LOWER(wx.company) LIKE '%davao del norte state college%'",
  //           )
  //           .andWhere(
  //             "LOWER(wx.appointment_status) NOT IN ('contract of service', 'job order')",
  //           )
  //           .getRawMany();

  //         if (data.length > 0) {
  //           loop = false;
  //         } else {
  //           if (ctr <= 2) {
  //             dOf -= 1;
  //           } else {
  //             if (ctr == 3) {
  //               dOf = parseInt(dateOf);
  //             } else {
  //               dOf += 1;
  //             }
  //           }
  //         }

  //         ctr++;
  //       } while (loop);

  //       return data[0];
  //     } else {
  //       let data = await this.dataSource
  //         .createQueryBuilder(WorkExperience, 'wx')
  //         .select(['wx.*'])
  //         .where('wx.user_detailID = :id', { id: user.userdetail.id })
  //         .andWhere('YEAR(wx.date_from) = :dateOf1', {
  //           dateOf1: parseInt(dateOf) - 1,
  //         })
  //         .andWhere("LOWER(wx.company) LIKE '%davao del norte state college%'")
  //         .andWhere(
  //           "LOWER(wx.appointment_status) NOT IN ('contract of service', 'job order')",
  //         )
  //         .getRawMany();
  //       return data[0];
  //     }
  //   }
  // }

  // async getSpecificDeclarantPositionAsOf(userID: string, dateOf: string) {
  //   // console.log(dateOf);
  //   const data = await this.dataSource
  //     .createQueryBuilder(WorkExperience, 'wx')
  //     .select(['wx.*'])
  //     .where('wx.user_detailID = :id', { id: userID })
  //     .andWhere('YEAR(wx.date_from) = :dateOf', { dateOf })
  //     .andWhere("LOWER(wx.company) LIKE '%davao del norte state college%'")
  //     .andWhere(
  //       "LOWER(wx.appointment_status) NOT IN ('contract of service', 'job order')",
  //     )
  //     .getRawMany();

  //   if (data.length > 0) {
  //     return data[0];
  //   } else {
  //     let d = new Date();
  //     if (parseInt(dateOf) != d.getFullYear()) {
  //       let loop = true;
  //       let data;
  //       let dOf = parseInt(dateOf);
  //       let ctr = 0;
  //       do {
  //         data = await this.dataSource
  //           .createQueryBuilder(WorkExperience, 'wx')
  //           .select(['wx.*'])
  //           .where('wx.user_detailID = :id', { id: userID })
  //           .andWhere('YEAR(wx.date_from) = :dateOf1', {
  //             dateOf1: dOf,
  //           })
  //           .andWhere(
  //             "LOWER(wx.company) LIKE '%davao del norte state college%'",
  //           )
  //           .andWhere(
  //             "LOWER(wx.appointment_status) NOT IN ('contract of service', 'job order')",
  //           )
  //           .getRawMany();

  //         if (data.length > 0) {
  //           loop = false;
  //         } else {
  //           if (ctr <= 2) {
  //             dOf -= 1;
  //           } else {
  //             if (ctr == 3) {
  //               dOf = parseInt(dateOf);
  //             } else {
  //               dOf += 1;
  //             }
  //           }
  //         }

  //         ctr++;
  //       } while (loop);

  //       return data[0];
  //     } else {
  //       let data = await this.dataSource
  //         .createQueryBuilder(WorkExperience, 'wx')
  //         .select(['wx.*'])
  //         .where('wx.user_detailID = :id', { id: userID })
  //         .andWhere('YEAR(wx.date_from) = :dateOf1', {
  //           dateOf1: parseInt(dateOf) - 1,
  //         })
  //         .andWhere("LOWER(wx.company) LIKE '%davao del norte state college%'")
  //         .andWhere(
  //           "LOWER(wx.appointment_status) NOT IN ('contract of service', 'job order')",
  //         )
  //         .getRawMany();
  //       return data[0];
  //     }
  //   }
  // }



  async getAllUserExceptCurrentUser(id: number) {
    const users = await this.dataSource
      .createQueryBuilder(UserDetail, 'us')
      .select([
        'us.id as id',
        "IF (!ISNULL(us.mname), concat(us.fname, ' ',SUBSTRING(us.mname, 1, 1) ,'. ',us.lname) ,concat(us.fname, ' ', us.lname)) as name",
      ])
      .leftJoin(Users, 'u', 'u.id = us.userID')
      .where('u.isValidated = 1')
      .andWhere('u.isAdminApproved = 1')
      .andWhere('us.id != :id', { id })
      .andWhere('us.id != 2')
      .getRawMany();
    return users;
  }

  async updateUserTypeRole(userTypeRole: UserTypeRole) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(Users, userTypeRole.id, {
        user_roleID: userTypeRole.user_roleID,
        usertypeID: userTypeRole.usertypeID,
      });

      // Update branchId in UserDetail if provided
      if (userTypeRole.branchId !== undefined) {
        await queryRunner.manager.update(
          UserDetail,
          { userID: userTypeRole.id },
          { branchId: userTypeRole.branchId },
        );
      }

      await queryRunner.commitTransaction();
      return {
        msg: 'User updated. ',
        status: HttpStatus.OK,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        msg: error,
        status: HttpStatus.BAD_REQUEST,
      };
    } finally {
      await queryRunner.release();
    }
  }



  // async updateUser(id: number, updateUserAuthDto: UpdateUserAuthDto) {

  //   const userdetail = await this.getUser(id);

  //   // const city = await this.cityService.getSpecificCity(updateUserAuthDto.city)
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   // const user_type = await this.usertypeService.getUserType(updateUserAuthDto.usertype);

  //   try {
  //     // update user details for admin
  //     await this.userdetailsRepository.update(id, {

  //       fname: updateUserAuthDto.fname,
  //       mname: updateUserAuthDto.mname,
  //       lname: updateUserAuthDto.lname,
  //       suffix: updateUserAuthDto.suffix,
  //       address: updateUserAuthDto.address,
  //       position: updateUserAuthDto.position,
  //       designation: updateUserAuthDto.designation,
  //       dsh_email: updateUserAuthDto.dsh_email,
  //       personal_email: updateUserAuthDto.personal_email,
  //       contact_no: updateUserAuthDto.contact_no,
  //       usertypeID: updateUserAuthDto.usertypeID,
  //       cityID: updateUserAuthDto.cityID

  //     });

  //     await this.authService.update(userdetail.userID, {
  //       password: hashPassword(updateUserAuthDto.password)
  //     });

  //     await queryRunner.commitTransaction();

  //     return {
  //       status: HttpStatus.OK,
  //       msg: "Update successfully saved."
  //     }

  //   } catch (err) {
  //     await queryRunner.rollbackTransaction();
  //     const toReturn = {
  //       status: HttpStatus.BAD_REQUEST

  //     };

  //     return toReturn;

  //   }
  //   finally {
  //     await queryRunner.release();
  //   }

  // }

async remove(id: number) {
  await this.dataSource.query(
    `
    DELETE users, user_detail
    FROM users
    INNER JOIN user_detail
      ON users.id = user_detail.userID
    WHERE user_detail.id = ?
    `,
    [id]
  );

  return {
    msg: 'Deleted successfully!',
    status: HttpStatus.OK,
  };
}


}
