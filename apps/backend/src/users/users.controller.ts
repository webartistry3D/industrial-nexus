import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateMyProfileDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.usersService.create(createUserDto, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findAll(@Query() filterDto: UserFilterDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get('me')
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.usersService.findOne(user.userId);
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(user.userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only JPG, PNG, and WEBP files are allowed'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @HttpCode(HttpStatus.OK)
  async uploadAvatar(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const { url: profileImageUrl } = await this.storageService.upload(file, 'avatars');
    return this.usersService.updateMyProfile(user.userId, { profileImageUrl });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.usersService.update(id, updateUserDto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.usersService.deactivate(id, user.userId);
  }
}
