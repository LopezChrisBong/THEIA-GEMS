import {
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { LoginDto } from './dto/login.dto';
import { Users } from './entities/auth.entity';
import { comparePassword, hashPassword } from './utils/bcrypt';
import { DataSource, Repository } from 'typeorm';
import { UserDetail, UserType } from 'src/entities';
import { UpdateUserCredential } from 'src/auth/dto/update-user-credential.dto';
import { ChangePasswordDto } from './dto/change-pass.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from 'src/mail/mail.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfirmOTPDto } from './dto/confirm-otp.dto';
import { isValidPasswordHash } from 'src/shared/global-function';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private jwtService: JwtService,
    private dataSource: DataSource,
    private mailService: MailService,
  ) {}

  async sendMail() {
    const dataForEmail = {
      name: 'Jan Florenz D. Igcasama',
      email: 'janflorenz.igcasama@dnsc.edu.ph',
      OTP: '123456',
    };

    await this.mailService.sendOTP(dataForEmail);
  }

  async create(registerUser: RegisterUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const otp = Math.floor(100000 + Math.random() * 9000);
      const hashOtp = hashPassword(otp.toString());

      // CREATING NEW USER
      const newUser = queryRunner.manager.create(Users, {
        email: registerUser.email,
        otp: hashOtp,
        usertypeID: 2,
        password: hashPassword(registerUser.password),
      });

      const newUserSaved = await queryRunner.manager.save(newUser);

      const newUserDetail = queryRunner.manager.create(UserDetail, {
        fname: registerUser.fname,
        mname: registerUser.mname,
        lname: registerUser.lname,
        suffix: registerUser.suffix,
        userID: newUserSaved.id,
      });

      await queryRunner.manager.save(newUserDetail);

      const name = registerUser.fname + ' ' + registerUser.lname;

      const dataForEmail = {
        name,
        email: registerUser.email,
        OTP: otp.toString(),
      };

      await this.mailService.sendOTP(dataForEmail);

      await queryRunner.commitTransaction();

      return {
        status: HttpStatus.CREATED,
        msg: 'User saved.',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();

      const toReturn = {
        msg: err,
        status: HttpStatus.BAD_REQUEST,
      };

      return toReturn;
      // console.log(err)
    } finally {
      await queryRunner.release();
    }
  }

  async addAccount(registerUser: RegisterUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const otp = Math.floor(100000 + Math.random() * 9000);
      const hashOtp = hashPassword(otp.toString());

      // CREATING NEW USER
      const newUser = queryRunner.manager.create(Users, {
        email: registerUser.email,
        otp: hashOtp,
        isAdminApproved: true,
        isValidated: true,
        user_roleID: registerUser.user_roleID,
        usertypeID: 2,
        assignedModuleID: registerUser.assignedModuleID ?? 2,
        password: hashPassword(registerUser.password),
      });

      const newUserSaved = await queryRunner.manager.save(newUser);

      const newUserDetail = queryRunner.manager.create(UserDetail, {
        fname: registerUser.fname,
        mname: registerUser.mname,
        lname: registerUser.lname,
        suffix: registerUser.suffix,
        userID: newUserSaved.id,
        branchId: registerUser.branchId ?? undefined,
      });

      await queryRunner.manager.save(newUserDetail);

      await queryRunner.commitTransaction();

      return {
        status: HttpStatus.CREATED,
        msg: 'User account created successfully.',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log('[addAccount] error:', err);
      return {
        msg: err?.message || 'Something went wrong. Please try again.',
        status: HttpStatus.BAD_REQUEST,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async changePassID(id: number, changPassDto: ChangePasswordDto) {
    console.log(id)
    let user_details = await this.dataSource.query(
      'SELECT * FROM user_detail WHERE id = ' + id,
    );
    let activeUser = await this.dataSource.query(
      'SELECT * FROM users WHERE id = ' + user_details[0].userID,
    );
    console.log(activeUser)
    try {
        let pass = hashPassword(changPassDto.new_password);
        await this.usersRepository.update(activeUser[0].id, { password: pass });
        return {
          msg: 'New password saved.',
          status: HttpStatus.OK,
        };
   
    } catch (error) {
      return {
        msg: error,
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }

  async login(loginUser: LoginDto) {
    const res_user = await this.findUser(loginUser.email.toString());
    // console.log(res_user);

    if (res_user) {
      // comparing hashed password in the database with the user's password
      const isMatch = comparePassword(
        loginUser.password.toString(),
        res_user.password,
      );
      if (res_user.isValidated && res_user.isAdminApproved) {
        if (isMatch) {
          const userdetail = await this.dataSource
            .getRepository(UserDetail)
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
            .where('userdetail.userID = :userid', { userid: res_user.id })
            .getOne();

        if (!userdetail) {
            throw new HttpException(
              'User details not found',
              HttpStatus.NOT_FOUND,
            );
          }

          const {
            bdate,
            birth_place,
            sex,
            civil_status,
            height,
            weight,
            blood_type,
            GSIS,
            PAGIBIG,
            PHILHEALTH,
            SSS,
            TIN,
            agency_employee_num,
            is_dual_citizen,
            citizenship,
            citizenship_type,
            country,
            tel_no,
            mobile_no,
            residential_brgy,
            residential_city,
            residential_house_no,
            residential_prov,
            residential_street,
            residential_subd,
            residential_zip,
            permanent_brgy,
            permanent_city,
            permanent_house_no,
            permanent_prov,
            permanent_street,
            permanent_subd,
            permanent_zip,
            ...rest
          } = userdetail;

          // include email correctly
          const payload = {
            userdetail: {...rest,
            },
          };

          return {
            status: HttpStatus.OK,
            user:payload,
            token: this.jwtService.sign(payload),
          };
        } else {
          return new HttpException(
            'Password do not match.',
            HttpStatus.NOT_FOUND,
          );
        }
      } else {
        return new HttpException(
          'You are not yet verified!',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    return new HttpException(
      'Invalid email or password.',
      HttpStatus.NOT_FOUND,
    );
  }



  async checkEmail(email: string) {
    const isExist = await this.usersRepository.findOneBy({ email });
    return isExist ? true : false;
  }

async confirmOTP(conOTP: ConfirmOTPDto) {
  try {
    const user = await this.usersRepository.findOneBy({
      email: conOTP.email,
    });

    if (!user) {
      return {
        msg: 'User not found.',
        status: HttpStatus.NOT_FOUND,
      };
    }

    if (!user.otp) {
      return {
        msg: 'OTP expired or not set.',
        status: HttpStatus.BAD_REQUEST,
      };
    }

    const isMatch = await comparePassword(conOTP.otp, user.otp);

    if (!isMatch) {
      return {
        msg: 'OTP does not match.',
        status: HttpStatus.BAD_REQUEST,
      };
    }

    const result = await this.usersRepository.update(user.id, {
      isValidated: true,
    });

    if (result.affected === 1) {
      await this.mailService.sendConfirmation({
        email: conOTP.email,
      });

      return {
        msg: 'OTP matched.',
        status: HttpStatus.OK,
      };
    }

    return {
      msg: 'Failed to validate user.',
      status: HttpStatus.BAD_REQUEST,
    };

  } catch (error) {
    return {
      msg: 'OTP confirmation failed.',
      error: error.message,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}


  getDecoded(token: string) {
    // const decodedJwtAccessToken = this.jwtService.decode(signedJwtAccessToken);
    return this.jwtService.decode(token);
  }

  async findUser(email: string) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // UPDATE THE USERS PASSWORD ONLY
  async updateUserCred(user: any, updateUserCred: UpdateUserCredential) {
    const upd = await this.usersRepository.update(
      user.user.user.id,
      updateUserCred,
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
  }

  async changePassword(user: any, changePassDto: ChangePasswordDto) {
    // compare if input old password match the saved password
    const res_user = await this.findUser(user.user.user.email);
    if (res_user) {
      // comparing hashed password in the database with the user's password
      const isMatch = comparePassword(
        changePassDto.old_password,
        res_user.password,
      );
      if (isMatch) {
        const updateCred = await this.usersRepository.update(
          user.user.user.id,
          {
            password: hashPassword(changePassDto.new_password),
          },
        );

        if (updateCred.affected == 1) {
          return {
            msg: 'Password updated.',
            status: HttpStatus.OK,
          };
        } else {
          return {
            msg: 'Password update failed.',
            status: HttpStatus.BAD_REQUEST,
          };
        }
      } else {
        return {
          msg: 'Password not match.',
          status: HttpStatus.BAD_REQUEST,
        };
      }
    }
  }

  async resetPassword(resetPassDto: ResetPasswordDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let data = await queryRunner.manager
        .createQueryBuilder(Users, 'u')
        .where('u.email = :email', { email: resetPassDto.email })
        .getOne();

      if (data) {
        let hashPass = hashPassword(resetPassDto.password);
        await queryRunner.manager.update(Users, data.id, {
          password: hashPass,
        });
        await queryRunner.commitTransaction();
        return {
          msg: 'Reset successful.',
          status: HttpStatus.OK,
        };
      } else {
        await queryRunner.rollbackTransaction();
        return {
          msg: 'Data not found.',
          status: HttpStatus.NOT_FOUND,
        };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        msg: 'Reset failed.',
        status: HttpStatus.BAD_REQUEST,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async sendOTP(email: string) {
    let queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let user = await this.dataSource.manager
        .createQueryBuilder(Users, 'u')
        .where('u.email = :email', { email })
        .getOne();
      if (user) {
        const token = Math.floor(100000 + Math.random() * 9000);
        const emailUser = { email: email, OTP: token.toString() };
        const hashToken = hashPassword(token.toString());
        if (user.isAdminApproved && user.isValidated) {
          await queryRunner.manager.update(Users, user.id, { otp: hashToken });
          await this.mailService.sendOTP(emailUser);
        }
        await queryRunner.commitTransaction();
        return {
          msg: 'Email sent successfully!',
          status: HttpStatus.OK,
        };
      } else {
        await queryRunner.rollbackTransaction();
        return {
          msg: 'Email not registered',
          status: HttpStatus.NOT_FOUND,
        };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        msg: 'Something went wrong!',
        status: HttpStatus.BAD_REQUEST,
      };
    } finally {
      await queryRunner.release();
    }

  }

  // async generateRandomText() {
  //   // const pattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
  //   let dumpArr = [
  //     {
  //       id: 1,
  //       val: null,
  //     },
  //     {
  //       id: 2,
  //       val: null,
  //     },
  //     {
  //       id: 3,
  //       val: null,
  //     },
  //     {
  //       id: 4,
  //       val: null,
  //     },
  //   ];
  //   for (let i = 0; i < 4; i++) {
  //     dumpArr[i].val = Math.floor(Math.random() * 10) + 1;
  //   }

  //   dumpArr.sort((a, b) => a.val - b.val);

  //   let text = '';
  //   let upper_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  //   let lower_chars = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*';
  //   let num_chars = '0123456789';
  //   let special_chars = '!@#$%^&*';
  //   for (let j = 0; j < dumpArr.length; j++) {
  //     if (dumpArr[j].id == 1) {
  //       //upper case in random
  //       for (let i = 1; i <= dumpArr[j].val; i++) {
  //         let random = Math.floor(Math.random() * upper_chars.length);
  //         text += upper_chars.charAt(random);
  //       }
  //     } else if (dumpArr[j].id == 2) {
  //       //lower case in random
  //       for (let i = 2; i <= dumpArr[j].val; i++) {
  //         let random = Math.floor(Math.random() * lower_chars.length);
  //         text += lower_chars.charAt(random);
  //       }
  //     } else if (dumpArr[j].id == 3) {
  //       //number case in random
  //       for (let i = 1; i <= dumpArr[j].val; i++) {
  //         let random = Math.floor(Math.random() * num_chars.length);
  //         text += num_chars.charAt(random);
  //       }
  //     } else if (dumpArr[j].id == 4) {
  //       //special chars in random
  //       for (let i = 1; i <= dumpArr[j].val; i++) {
  //         let random = Math.floor(Math.random() * special_chars.length);
  //         text += special_chars.charAt(random);
  //       }
  //     }
  //   }

  //   if (text != '') {
  //     return text;
  //   }
  // }
  async generateRandomText(length = 8): Promise<string> {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  let result = '';

  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars[index];
  }

  return result;
}


  // async compareOTP(data: any) {
  //   const pattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     let user = await queryRunner.manager
  //       .createQueryBuilder(Users, 'u')
  //       .where('u.email =:email', { email: data.email })
  //       .getOne();

  //     let isMatch = comparePassword(data.otp, user.otp);

  //     if (isMatch) {
  //       // let dataForMail = {
  //       //   email: user.email,
  //       //   new_password: temp_pass,
  //       // };
  //       // await this.mailService.sendTempPassword(dataForMail);
  //       await queryRunner.commitTransaction();
  //       return {
  //         msg: 'OTP Verified.',
  //         status: HttpStatus.OK,
  //       };
  //     } else {
  //       await queryRunner.rollbackTransaction();
  //       return {
  //         msg: 'OTP do not match!',
  //         status: HttpStatus.BAD_REQUEST,
  //       };
  //     }
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     return {
  //       msg: 'Something went wrong!' + error,
  //       status: HttpStatus.BAD_REQUEST,
  //     };
  //   } finally {
  //     await queryRunner.release();
  //   }

  // }

  async compareOTP(data: any) {
  try {
    const user = await this.usersRepository.findOne({
      where: { email: data.email },
    });

    if (!user) {
      return {
        msg: 'User not found.',
        status: HttpStatus.NOT_FOUND,
      };
    }

    if (!user.otp) {
      return {
        msg: 'OTP expired or not set.',
        status: HttpStatus.BAD_REQUEST,
      };
    }

    const isMatch = await comparePassword(data.otp, user.otp);

    if (!isMatch) {
      return {
        msg: 'OTP does not match!',
        status: HttpStatus.BAD_REQUEST,
      };
    }

    return {
      msg: 'OTP verified.',
      status: HttpStatus.OK,
    };

  } catch (error) {
    return {
      msg: 'Something went wrong.',
      error: error.message,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}


  async changePass(user: any, changPassDto: ChangePasswordDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    let activeUser = await queryRunner.query(
      'SELECT * FROM users WHERE id = ' + user.userdetail.userID,
    );
    await queryRunner.release();

    const ismatch = comparePassword(
      changPassDto.old_password,
      activeUser[0].password,
    );
    try {
      if (ismatch) {
        let pass = hashPassword(changPassDto.new_password);
        await this.usersRepository.update(activeUser[0].id, { password: pass });
        return {
          msg: 'New password saved.',
          status: HttpStatus.OK,
        };
      } else {
        return {
          msg: 'Invalid password.',
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

  async remove(id: number) {
    try {
      const res = await this.usersRepository.delete(id);
      return {
        msg: 'User deleted.',
        status: HttpStatus.OK,
      };
    } catch (error) {
      return {
        msg: 'User cannot be deleted.',
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }

  /** Returns live UserDetail from the DB so branchId and role are always current.
   *  Uses the same joins as login() so the shape matches what the frontend expects. */
  async getFreshUserDetail(id: number): Promise<UserDetail | null> {
    return this.dataSource
      .getRepository(UserDetail)
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
      .where('userdetail.id = :id', { id })
      .getOne();
  }
}
