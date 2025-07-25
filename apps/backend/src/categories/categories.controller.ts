import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '@nestjs/passport';

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
}
