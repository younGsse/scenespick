import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as uuid from 'uuid';
import { Request } from 'express';
import { PostReq } from './dto/post.dto';
import { PostService } from './post.service';
import { multerOptions } from '../common/options';
import { AtGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { SharpPipe } from '../common/pipes/sharp.pipe';
import { GetUserInterceptor } from '../common/interceptors/get-user.interceptor';
import { UserEntity } from '../user/user.entity';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  async getPosts(@Query('page') p: string) {
    const page = Number(p) || 1;
    const [posts, pagination] = await this.postService.findAll(page);

    return { posts, pagination };
  }

  @Get(':postId')
  @UseInterceptors(GetUserInterceptor)
  async getPost(@Req() req: Request, @Param('postId') postId: string) {
    const userId = req.user && String(req.user);

    this.validatePostId(postId);

    const post = await this.postService.findPost(postId, userId);

    return { post };
  }

  @Post()
  @Roles('AUTHOR', 'ADMIN')
  @UseGuards(AtGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images', 4, multerOptions))
  async createPost(
    @UploadedFiles(SharpPipe) images: Array<string>,
    @Req() req: Request,
    @Body(ValidationPipe) dto: PostReq,
  ) {
    const user = req.user as UserEntity;

    const post = await this.postService.createPost(images, dto, user);

    return {
      id: post.id,
    };
  }

  @Patch(':postId')
  @Roles('AUTHOR', 'ADMIN')
  @UseGuards(AtGuard, RolesGuard)
  async updatePost(
    @Param('postId') postId: string,
    @Body(ValidationPipe) dto: PostReq,
  ) {
    // TODO: Patch by owner and ADMIN
    this.validatePostId(postId);
    await this.postService.updatePost(postId, dto);
    return {};
  }

  @Delete(':postId')
  @Roles('AUTHOR', 'ADMIN')
  @UseGuards(AtGuard, RolesGuard)
  async deletePost(@Param('postId') postId: string) {
    // TODO: DELETE by owner and ADMIN
    this.validatePostId(postId);
    await this.postService.deletePost(postId);
    return {};
  }

  private validatePostId(postId: string) {
    if (!uuid.validate(postId)) {
      throw new BadRequestException('존재하지 않는 글입니다.');
    }
  }
}
