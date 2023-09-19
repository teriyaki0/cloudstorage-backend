import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Get,
  UseGuards,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileStorage } from './storage';

import { FileType } from './entities/file.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guards';
import { UserId } from 'src/decorators/user-id.decorators';

@Controller('files')
@ApiTags('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  findAll(
    @UserId() userId: number,
    @Query('type') fileType: FileType,
    @Query('sortOrder') sortOrder?: 'oldest' | 'newest',
  ) {
    return this.filesService.findAll(userId, fileType, sortOrder);
  }

  @Get('/:id')
  async findFile(@Param('id') id: number, @UserId() userId: number) {
    return this.filesService.findFile(id, userId);
  }

  @Get('/search/:keyword')
  async searchFile(
    @Query('keyword') keyword: string,
    @UserId() userId: number,
  ) {
    return this.filesService.searchFile(keyword, userId);
  }

  @Post('/favorites')
  toggleFavorites(
    @UserId() userId: number,
    favorites: boolean,
    @Query('id') id: number,
  ) {
    return this.filesService.toggleFavorites(userId, favorites, id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    file: Express.Multer.File,
    @UserId() userId: number,
  ) {
    return this.filesService.create(file, userId);
  }

  @Delete()
  remove(@UserId() userId: number, @Query('id') id: number) {
    return this.filesService.remove(userId, id);
  }
}
