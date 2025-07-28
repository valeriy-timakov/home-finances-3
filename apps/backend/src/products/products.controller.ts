import { Controller, Get, Post, Query, UseGuards, Request, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(AuthGuard('bearer'))
  @Get()
  findAll(@Request() req) {
    return this.productsService.findSelectItems(req.user.agentId);
  }

  @UseGuards(AuthGuard('bearer'))
  @Get('select-items')
  findSelectItems(@Request() req) {
    return this.productsService.findSelectItems(req.user.agentId);
  }

  @UseGuards(AuthGuard('bearer'))
  @Get('by-category')
  findProductsByCategory(@Request() req, @Query('categoryId') categoryId: string) {
    return this.productsService.findProductsByCategory(req.user.agentId, Number(categoryId));
  }

  @UseGuards(AuthGuard('bearer'))
  @Get('not-in-category')
  findProductsNotInCategory(@Request() req, @Query('categoryId') categoryId: string) {
    return this.productsService.findProductsNotInCategory(req.user.agentId, Number(categoryId));
  }

  @UseGuards(AuthGuard('bearer'))
  @Post('move-category')
  moveProductsToCategory(
    @Request() req,
    @Body() body: { sourceCategoryId: number; targetCategoryId: number | null }
  ) {
    return this.productsService.moveProductsToCategory(
      req.user.agentId,
      Number(body.sourceCategoryId),
      body.targetCategoryId !== null ? Number(body.targetCategoryId) : null
    );
  }

  @UseGuards(AuthGuard('bearer'))
  @Post('update-category')
  updateProductCategory(
    @Request() req,
    @Body() body: { productId: number; categoryId: number | null }
  ) {
    return this.productsService.updateProductCategory(
      req.user.agentId,
      Number(body.productId),
      body.categoryId !== null ? Number(body.categoryId) : null
    );
  }
}
