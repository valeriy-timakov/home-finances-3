import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '@nestjs/passport';
import { CategoryDto } from '../dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  findAll(@Req() req) {
    return this.categoriesService.findAllTree(req.user.agentId);
  }

  @Get('select-items')
  @UseGuards(AuthGuard('bearer'))
  findSelectItems(@Req() req) {
    return this.categoriesService.findSelectItems(req.user.agentId);
  }

  @Post()
  @UseGuards(AuthGuard('bearer'))
  create(@Body() categoryDto: CategoryDto, @Req() req) {
    return this.categoriesService.create(categoryDto, req.user.agentId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('bearer'))
  update(@Param('id') id: string, @Body() categoryDto: CategoryDto, @Req() req) {
    return this.categoriesService.update(+id, categoryDto, req.user.agentId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('bearer'))
  remove(@Param('id') id: string, @Req() req) {
    return this.categoriesService.remove(+id, req.user.agentId);
  }
}
