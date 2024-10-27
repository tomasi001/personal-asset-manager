import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user_id.decorator';
import { PortfolioService } from './portfolio.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Portfolio')
@ApiBearerAuth('JWT-auth')
@Controller('portfolio')
@UseGuards(AuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get portfolio value and PnL' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the portfolio value and PnL for the authenticated user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPortfolioValueAndPnL(@UserId() userId: string) {
    return this.portfolioService.getPortfolioValueAndPnL(userId);
  }
}
