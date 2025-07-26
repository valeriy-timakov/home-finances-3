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

  @Get('select-items')
  @UseGuards(AuthGuard('bearer'))
  findSelectItems(@Req() req) {
    return this.accountsService.findSelectItems(req.user.agentId);
  }

  @Get('counterparties/select-items')
  @UseGuards(AuthGuard('bearer'))
  findCounterpartySelectItems(@Req() req) {
    return this.accountsService.findCounterpartySelectItems(req.user.agentId);
  }
}
