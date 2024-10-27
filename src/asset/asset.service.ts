import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { DatabaseService } from '../database/database.service';
import { NewAsset, NewUserAsset } from '../database/types';

@Injectable()
export class AssetService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createAssetDto: CreateAssetDto, userId: string) {
    const db = this.databaseService.getDb();

    const newAsset: NewAsset = {
      name: createAssetDto.name,
      asset_type: createAssetDto.asset_type,
      description: createAssetDto.description,
      contract_address: createAssetDto.contract_address,
      chain: createAssetDto.chain,
      token_id: createAssetDto.token_id,
    };

    const [insertedAsset] = await db
      .insertInto('assets')
      .values(newAsset)
      .returning('id')
      .execute();

    const newUserAsset: NewUserAsset = {
      user_id: userId,
      asset_id: insertedAsset.id,
      quantity:
        createAssetDto.asset_type === 'ERC-20'
          ? createAssetDto.quantity
          : undefined,
    };

    await db.insertInto('user_assets').values(newUserAsset).execute();

    return { message: 'Asset added successfully', assetId: insertedAsset.id };
  }

  async findAll(userId: string) {
    const db = this.databaseService.getDb();
    return db
      .selectFrom('assets')
      .innerJoin('user_assets', 'assets.id', 'user_assets.asset_id')
      .where('user_assets.user_id', '=', userId)
      .selectAll('assets')
      .select(['user_assets.quantity'])
      .execute();
  }

  async findOne(id: string, userId: string) {
    const db = this.databaseService.getDb();
    return db
      .selectFrom('assets')
      .innerJoin('user_assets', 'assets.id', 'user_assets.asset_id')
      .where('assets.id', '=', id)
      .where('user_assets.user_id', '=', userId)
      .selectAll('assets')
      .select(['user_assets.quantity'])
      .executeTakeFirst();
  }

  async remove(id: string, userId: string) {
    const db = this.databaseService.getDb();
    await db
      .deleteFrom('user_assets')
      .where('asset_id', '=', id)
      .where('user_id', '=', userId)
      .execute();

    // Optionally, remove the asset from the assets table if it's not associated with any other users
    const assetStillInUse = await db
      .selectFrom('user_assets')
      .where('asset_id', '=', id)
      .executeTakeFirst();

    if (!assetStillInUse) {
      await db.deleteFrom('assets').where('id', '=', id).execute();
    }

    return { message: 'Asset removed successfully' };
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, userId: string) {
    const db = this.databaseService.getDb();

    // First, check if the asset belongs to the user
    const userAsset = await db
      .selectFrom('user_assets')
      .where('asset_id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!userAsset) {
      throw new NotFoundException(
        'Asset not found or does not belong to the user',
      );
    }

    // Update the asset
    await db
      .updateTable('assets')
      .set(updateAssetDto)
      .where('id', '=', id)
      .execute();

    // If quantity is provided, update the user_assets table
    if (updateAssetDto.quantity !== undefined) {
      await db
        .updateTable('user_assets')
        .set({ quantity: updateAssetDto.quantity })
        .where('asset_id', '=', id)
        .where('user_id', '=', userId)
        .execute();
    }

    return { message: 'Asset updated successfully' };
  }
}