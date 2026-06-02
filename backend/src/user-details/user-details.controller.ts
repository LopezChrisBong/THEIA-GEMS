import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Headers,
  StreamableFile,
  Header,
  BadRequestException,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { UserDetailsService } from './user-details.service';
import { CreateUserDetailDto } from './dto/create-user-detail.dto';
import { UpdateUserDetailDto } from './dto/update-user-detail.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserAuthDto } from './dto/create-user-auth.dto';
import { JWTAuthGuard } from 'src/auth/utils/jwt-auth-guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Helper } from 'src/shared/helper';
import { JwtService } from '@nestjs/jwt';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { fileMimetypeFilter } from './validation/file-mimetype-filters';
import { ParseFile } from './validation/parse-file.pipe';
import { SearchUserDetailDto } from './dto/search-userdetail.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreatePDSDto } from './dto/create-pds.dto';
import { UpdatePDSDto } from './dto/update-pds.dto';
import { UpdateMyPDSDto } from './dto/update-my-pds.dto';
import { UpdateVerifiedUser } from './dto/update-verified-user.dto';
import { UserTypeRole } from './dto/update-user-type-role.dto';
import { currentUser } from 'src/shared/jwtDecode';
import type { Response } from 'express';
@ApiTags('User Details')
@Controller('user-details')
export class UserDetailsController {
  constructor(
    private readonly userDetailsService: UserDetailsService,
    private jwtService: JwtService,
  ) {}

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('createauth')
  createUser(@Body() createUserAuthDto: CreateUserAuthDto, @Request() req) {
    // return this.userDetailsService.createauth(createUserAuthDto, req.body);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  // CREATE USER_DETAIL ONLY
  @Post('addEmployee')
  create(@Body() createUserDetailDto: CreateUserDetailDto) {
    return this.userDetailsService.createuser(createUserDetailDto);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('uploadimage')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: Helper.filePath,
        filename: Helper.customFileName,
      }),
    }),
  )
  async uploadImage(@UploadedFile(ParseFile) file, @Headers() headers) {
    var head_str = headers.authorization;

    const curr_user = currentUser(head_str);

    const user = await this.userDetailsService.getPersonalInfo(curr_user);

    if (user.profile_img != 'img_avatar') {
      fs.unlink(
        join(process.cwd(), `/../upload_img/${user.profile_img}`),
        async (err) => {
          if (err) {
            console.log(err);
          }
        },
      );
    }

    console.log('[uploadImage] file.filename:', file?.filename);
    console.log('[uploadImage] curr_user.userdetail.id:', curr_user?.userdetail?.id);

    return this.userDetailsService.uploadProfileImg(
      file.filename,
      curr_user,
    );
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getPersonalInfo')
  getPersonalInfo(@Headers() headers) {
    var head_str = headers.authorization;
    const curr_user = currentUser(head_str);
    return this.userDetailsService.getPersonalInfo(curr_user);
  }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getMaleFemaleCount')
  // getMaleFemaleCount(@Headers() headers) {
  //   return this.userDetailsService.getMaleFemaleCount();
  // }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getEmployeeStats')
  // getEmployeeStats(@Headers() headers) {
  //   return this.userDetailsService.getEmployeeStats();
  // }





  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Post('createPDS')
  // createPDS(@Body() createPDS: CreatePDSDto) {
  //   return this.userDetailsService.createPDS(createPDS);
  // }


  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('updateVerifiedUser')
  updateVerifiedUser(@Body() updateVU: UpdateVerifiedUser) {
    return this.userDetailsService.updateVerifiedUser(updateVU);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get()
  getAllUserDetail() {
    return this.userDetailsService.getAllUser();
  }


  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getAllUsersPDS/:status')
  getAllUsersPDS(@Param('status') status: string) {
    return this.userDetailsService.getAllUsersPDS(+status);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getAllUsersToVerify')
  getAllUsersToVerify() {
    return this.userDetailsService.getAllUsersToVerify();
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getAllVerifiedUser')
  getAllVerifiedUser() {
    return this.userDetailsService.getAllVerifiedUser();
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getUpcomingBday')
  getUpcomingBday() {
    return this.userDetailsService.getUpcomingBday();
  }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getBdayToday')
  // getBdayToday() {
  //   return this.userDetailsService.getBdayToday();
  // }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('shiftCalendar/:d')
  shiftCalendar(@Param('d') d: string) {
    return this.userDetailsService.shiftCalendar(d);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('search-user')
  searchUser(@Body() searchUser: SearchUserDetailDto) {
    return this.userDetailsService.searchUser(searchUser.fullname);
  }

  // @Get('getProfileImg/:filename')
  // getProfileImg(
  //   @Param('filename') filename: string,
  //   @Response({ passthrough: true }) res,
  // ): StreamableFile {
  //   try {
  //     let file;
  //     file = createReadStream(join(process.cwd(), '/upload_img/' + filename));

  //     res.set({
  //       'Content-Type': 'image/png',
  //     });

  //     file.on('error', (err) => {
  //       console.error('errored', err);
  //       return;
  //     });

  //     return new StreamableFile(file);
  //   } catch (error) {
  //     console.log(error);
  //     return null;
  //   }
  // }

  @Get('getProfileImg/:filename')
  getProfileImg(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const filePath = join(process.cwd(), '../upload_img', filename);
    console.log('[getProfileImg] Looking for file at:', filePath);
    console.log('[getProfileImg] File exists:', existsSync(filePath));

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const ext = (filename.split('.').pop() ?? 'jpeg').toLowerCase();
    const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    const file = createReadStream(filePath);
    res.set({ 'Content-Type': contentType });

    return new StreamableFile(file);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getSpecificUser/:id')
  getSpecificUser(@Param('id') id: number) {
    return this.userDetailsService.getUser(id);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getUserProfileImg')
  getUserProfileImg(@Headers() headers) {
    var head_str = headers.authorization;
    // var arr = head_str.split(' ');
    // var token_string = arr[1].toString();

    // var curr_user = this.jwtService.decode(token_string);
    const curr_user = currentUser(head_str);
    return this.userDetailsService.getUserProfileImg(curr_user);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getUsers')
  getUsers() {
    return this.userDetailsService.getUsers();
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getAllUserDetail')
  getAllUserDetail1() {
    return this.userDetailsService.getAllUserDetail();
  }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getAllPlantillaUserDetail')
  // getAllPlantillaUserDetail() {
  //   return this.userDetailsService.getAllPlantillaUserDetail();
  // }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getDeanDirAboveUsers')
  // getDeanDirAboveUsers() {
  //   return this.userDetailsService.getDeanDirAboveUsers();
  // }







  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('updateUserTypeRole')
  updateUserTypeRole(@Body() userTypeRole: UserTypeRole) {
    return this.userDetailsService.updateUserTypeRole(userTypeRole);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getFinanceDir')
  getFinanceDir() {
    //// return user is accountant role
    //// return this.userDetailsService.getAccountantUser();
    // return user is finance director
    return this.userDetailsService.getFinanceDir();
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getAccountantUser')
  getAccountantUser() {
    return this.userDetailsService.getAccountantUser();
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getCollegePres')
  getCollegePres() {
    return this.userDetailsService.getCollegePres();
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getVicePres')
  getVicePres() {
    return this.userDetailsService.getVicePres();
  }

  // @Patch('updateUserAuth')
  // updateUser(@Headers() headers, @Body() updateUserDetailDto: UpdateUserDetailDto) {

  //   var head_str = headers.authorization;
  //   var arr = head_str.split(" ");
  //   var token_string = arr[1].toString();

  //   var curr_user = this.jwtService.decode(token_string);

  //   return this.userDetailsService.update(curr_user, updateUserDetailDto);
  // }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('updateUser')
  updateUserDetail(
    @Headers() headers,
    @Body() updateUserDetailDto: UpdateUserDetailDto,
  ) {
    var head_str = headers.authorization;
    // var arr = head_str.split(' ');
    // var token_string = arr[1].toString();

    // var curr_user = this.jwtService.decode(token_string);
    const curr_user = currentUser(head_str);
    return this.userDetailsService.updateUserDetail(
      curr_user,
      updateUserDetailDto,
    );
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getUser')
  getUser(@Headers() headers) {
    var head_str = headers.authorization;
    // var arr = head_str.split(' ');
    // var token_string = arr[1].toString();

    // const data = this.jwtService.decode(token_string);
    // const d1 = JSON.stringify(data);
    // const d2 = JSON.parse(d1);
    const curr_user = currentUser(head_str);
    return curr_user.userdetail.id;
    // return this.jwtService.decode(token_string);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getBdateBplace/:id')
  getBdateBplace(@Param('id') id: string) {
    return this.userDetailsService.getBdateBplace(+id);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('getAllUserExceptCurrentUser')
  getAllUserExceptCurrentUser(@Headers() headers) {
    var head_str = headers.authorization;

    const curr_user = currentUser(head_str);
    return this.userDetailsService.getAllUserExceptCurrentUser(
      curr_user.userdetail.id,
    );
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('updateEmployee')
  updateEmployee(
    @Headers() headers,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    // console.log(updateEmployeeDto);
    return this.userDetailsService.updateEmployee(updateEmployeeDto);
  }

  @Post('updateUserInfo/:id/:data')
  updateUserInfo(@Param('id') id: number,@Param('data') data: string) {
  return this.userDetailsService.updateUserInfo(+id,data );
  }


  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getDeclarantData')
  // getDeclarantData(@Headers() headers) {
  //   var head_str = headers.authorization;

  //   const curr_user = currentUser(head_str);
  //   return this.userDetailsService.getDeclarantData(curr_user);
  // }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getSpecificDeclarantData/:id')
  // getSpecificDeclarantData(@Param('id') id: string) {
  //   return this.userDetailsService.getSpecificDeclarantData(+id);
  // }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getDeclarantPositionAsOf/:dateOf')
  // getDeclarantPositionAsOf(
  //   @Headers() headers,
  //   @Param('dateOf') dateOf: string,
  // ) {
  //   var head_str = headers.authorization;

  //   const curr_user = currentUser(head_str);
  //   return this.userDetailsService.getDeclarantPositionAsOf(curr_user, dateOf);
  // }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Get('getSpecificDeclarantPositionAsOf/:userID/:dateOf')
  // getSpecificDeclarantPositionAsOf(
  //   @Param('userID') userID: string,
  //   @Param('dateOf') dateOf: string,
  // ) {
  //   return this.userDetailsService.getSpecificDeclarantPositionAsOf(
  //     userID,
  //     dateOf,
  //   );
  // }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userDetailsService.remove(+id);
  }
}
