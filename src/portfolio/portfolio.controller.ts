import { Controller, Get, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user_id.decorator';
import { PortfolioService } from './portfolio.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PortfolioValueAndPnLDto } from './dto/ portfolio-value-and-pnl.dto';
import { getErrorMessage } from '../utils';

/**
 * @class PortfolioController
 * @description Controller responsible for handling portfolio-related operations
 */
@ApiTags('Portfolio')
@ApiBearerAuth('JWT-auth')
@Controller('portfolio')
@UseGuards(AuthGuard)
export class PortfolioController {
  private readonly logger = new Logger(PortfolioController.name);

  /**
   * @constructor
   * @param {PortfolioService} portfolioService - The portfolio service instance
   */
  constructor(private readonly portfolioService: PortfolioService) {}

  /**
   * @method getPortfolioValueAndPnL
   * @description Retrieves the portfolio value and Profit and Loss (PnL) for the authenticated user
   * @param {string} userId - The ID of the authenticated user
   * @returns {Promise<any>} The portfolio value and PnL data
   * @throws {UnauthorizedException} If the user is not authenticated
   */
  @Get()
  @ApiOperation({ summary: 'Get portfolio value and PnL' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns the portfolio value and PnL for the authenticated user.',
    type: PortfolioValueAndPnLDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPortfolioValueAndPnL(@UserId() userId: string) {
    try {
      return await this.portfolioService.getPortfolioValueAndPnL(userId);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Error getting portfolio value and PnL for user ${userId}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
