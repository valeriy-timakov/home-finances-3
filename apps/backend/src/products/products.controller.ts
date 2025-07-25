import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('select-items')
  @UseGuards(AuthGuard('bearer'))
  findSelectItems(@Req() req) {
    return this.productsService.findSelectItems(req.user.agentId);
  }
}
