import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('sales')
@Auth()
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get('customers')
  listCustomers(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listCustomers(user.id, companyId);
  }

  @Post('customers')
  createCustomer(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createCustomer(user.id, companyId, body);
  }

  @Get('suppliers')
  listSuppliers(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listSuppliers(user.id, companyId);
  }

  @Post('suppliers')
  createSupplier(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createSupplier(user.id, companyId, body);
  }

  @Get('items')
  listItems(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listItems(user.id, companyId);
  }

  @Post('items')
  createItem(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createItem(user.id, companyId, body);
  }

  @Get('invoices')
  listInvoices(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listInvoices(user.id, companyId);
  }

  @Post('invoices')
  createInvoice(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Parameters<SalesService['createInvoice']>[2],
  ) {
    return this.service.createInvoice(user.id, companyId, body);
  }

  @Post('invoices/:id/allocate')
  allocatePayment(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.service.allocatePayment(user.id, companyId, id, amount);
  }

  @Get('bills')
  listBills(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listBills(user.id, companyId);
  }

  @Post('bills')
  createBill(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Parameters<SalesService['createBill']>[2],
  ) {
    return this.service.createBill(user.id, companyId, body);
  }

  @Post('bills/:id/allocate')
  allocateBillPayment(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.service.allocateBillPayment(user.id, companyId, id, amount);
  }
}
