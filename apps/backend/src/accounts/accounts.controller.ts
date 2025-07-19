import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  findAll(@Req() req) {
    return this.accountsService.findAll(req.user.agentId);
  }
}
