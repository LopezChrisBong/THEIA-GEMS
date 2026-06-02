import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Headers,
  UseInterceptors,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-pass.dto';
import { ConfirmOTPDto } from './dto/confirm-otp.dto';
import { LoginDto } from './dto/login.dto';
import { PassTokenDto } from './dto/pass-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserCredential } from './dto/update-user-credential.dto';
import { JWTAuthGuard } from './utils/jwt-auth-guard';
import { currentUser } from 'src/shared/jwtDecode';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
  ) {}

  // @ApiBearerAuth()
  // @UsePipes(ValidationPipe)
  @Post('registerUser')
  create(@Body() registerUser: RegisterUserDto) {
    return this.authService.create(registerUser);
  }

  @Post('addAccount')
  addAccount(@Body() registerUser: RegisterUserDto) {
    return this.authService.addAccount(registerUser);
  }

  @Post('changePassIDCred/:id')
  changePassID(@Param('id') id: number, @Body() changPassDto: ChangePasswordDto) {
    return this.authService.changePassID(id, changPassDto);
  }

  @Get('sendMail')
  sendMail() {
    return this.authService.sendMail();
  }

  @Post('login')
  login(@Body() loginUser: LoginDto) {
    return this.authService.login(loginUser);
  }

  @Get('checkEmailIfExist/:email')
  checkEmail(@Param('email') email: string) {
    return this.authService.checkEmail(email);
  }

  @Post('confirmOtp')
  confirmOTP(@Body() conOTP: ConfirmOTPDto) {
    return this.authService.confirmOTP(conOTP);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('current_user')
  async getCurrentUser(@Headers() headers) {
    const token = headers.authorization?.split(' ')[1];
    const decoded: any = this.jwtService.decode(token);
    const id: number = decoded?.userdetail?.id;

    if (id) {
      const fresh = await this.authService.getFreshUserDetail(id);
      if (fresh) return { userdetail: fresh };
    }

    // fallback: return JWT-decoded data if DB lookup fails
    return decoded;
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Get('findEmail/:email')
  findEmail(@Param('email') email: string) {
    return this.authService.findUser(email);
  }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  @Get('sendOTP/:email')
  sendOTP(@Param('email') email: string) {
    return this.authService.sendOTP(email);
  }

  @Post('compareOTP')
  compareOTP(@Body() data: any) {
    return this.authService.compareOTP(data);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Post('changePass')
  changePass(@Headers() headers, @Body() changPassDto: ChangePasswordDto) {
    var head_str = headers.authorization;
    // var arr = head_str.split(" ");
    // var token_string = arr[1].toString();

    // var curr_user = this.jwtService.decode(token_string);
    const curr_user = currentUser(head_str);
    return this.authService.changePass(curr_user, changPassDto);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Patch('updateUserCredential')
  updateUserCredential(
    @Headers() headers,
    @Body() updateUserCred: UpdateUserCredential,
  ) {
    var head_str = headers.authorization;
    // var arr = head_str.split(' ');
    // var token_string = arr[1].toString();

    // var curr_user = this.jwtService.decode(token_string);
    const curr_user = currentUser(head_str);

    return this.authService.updateUserCred(curr_user, updateUserCred);
  }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Patch('changePassword')
  changePassword(@Headers() headers, @Body() changePassDto: ChangePasswordDto) {
    var head_str = headers.authorization;
    // var arr = head_str.split(' ');
    // var token_string = arr[1].toString();

    // var curr_user = this.jwtService.decode(token_string);
    const curr_user = currentUser(head_str);

    return this.authService.changePassword(curr_user, changePassDto);
  }

  @Post('resetPassword')
  resetPassword(@Body() resetPassDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPassDto);
  }

  // @UseGuards(JWTAuthGuard)
  // @ApiBearerAuth()
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  @UseGuards(JWTAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
