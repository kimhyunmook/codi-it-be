import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { LikeStoreResponse, UserResponse } from './dto/response';
import { UserConFlictDto, UserNotFoundDto } from './dto/error-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SwaggerErrorExamples } from 'src/common/utils/swagger-error-response.util';
import { UserId } from 'src/types/common';
import { S3File, S3Upload } from 'src/common/decorators/s3.decorator';
import { S3UploadResult } from '../s3/s3.service';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: '회원가입' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: '회원 가입 성공한 유저의 값을 반환', type: UserResponse })
  @ApiConflictResponse({ description: '이미 존재하는 유저입니다.', type: UserConFlictDto })
  private async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.userService.create({ ...dto });
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiOkResponse({ description: '내 정보 조회 성공 및 유저 정보 반환', type: UserResponse })
  @ApiNotFoundResponse({ description: '유저 정보 없음', type: UserNotFoundDto })
  private async getMe(@CurrentUser('sub') userId: UserId['userId']): Promise<UserResponse> {
    return this.userService.findMe(userId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @S3Upload('image')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiOkResponse({ description: '내 정보 수정 성공 및 수정된 유저 정보 반환', type: UserResponse })
  @ApiNotFoundResponse({ description: '존재하지 않는 유저 입니다.', type: UserNotFoundDto })
  private async updateMe(
    @CurrentUser('sub') userId: UserId['userId'],
    @Body() dto: UpdateUserDto,
    @S3File() s3File: S3UploadResult,
  ): Promise<UserResponse> {
    return this.userService.updateMe({ ...dto, userId, image: s3File ? s3File.url : undefined });
  }

  @Get('me/likes')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관심 스토어 조회' })
  @ApiOkResponse({
    description: '내 관심 스토어 조회 성공 및 정보 반환',
    type: LikeStoreResponse,
    isArray: true,
  })
  @ApiNotFoundResponse({ description: '존재하지 않는 유저 입니다.', type: UserNotFoundDto })
  private async getLikedStores(
    @CurrentUser('sub') userId: UserId['userId'],
  ): Promise<LikeStoreResponse[]> {
    return this.userService.getLikedStores(userId);
  }

  @Delete('delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원 탈퇴',
    description: '현재 로그인한 사용자의 계정을 삭제합니다',
  })
  @ApiOkResponse({ description: '회원 탈퇴 성공', type: undefined })
  @ApiNotFoundResponse({ description: '존재하지 않는 유저 입니다.', type: UserNotFoundDto })
  @ApiOperation({ summary: '회원 탈퇴', description: '현재 로그인한 사용자의 계정을 삭제합니다' })
  @ApiUnauthorizedResponse({
    description: '인증 실패',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiNotFoundResponse({
    description: '사용자 없음',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  private async deleteUser(@CurrentUser('sub') userId: UserId['userId']): Promise<void> {
    await this.userService.deleteUser(userId);
  }
}
