import { IContractRepository } from '../interfaces/IContractRepository';
import { ContractType, EnergyOptions } from '@/app/types';
import { connectDB } from '@/lib/mongodb';
import Contract from '@/models/Contract';

export class MongoContractRepository implements IContractRepository {
  async findAll(userId: string): Promise<ContractType[]> {
    await connectDB();
    return await Contract.find()
      .where({ userId })
      .sort({ startDate: -1 })
      .exec();
  }

  async findActive(userId: string, type: EnergyOptions, date: Date = new Date()): Promise<ContractType | null> {
    await connectDB();
    
    // Find contract that started before or on date, and either hasn't ended or ends after date
    return await Contract.findOne({
      userId,
      type,
      startDate: { $lte: date },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: date } }
      ]
    })
    .sort({ startDate: -1 }) // Get most recent if multiple match
    .exec();
  }

  async create(contract: Omit<ContractType, '_id'>): Promise<ContractType> {
    await connectDB();
    const newContract = new Contract(contract);
    return await newContract.save();
  }

  async update(id: string, userId: string, data: Partial<Omit<ContractType, '_id' | 'userId'>>): Promise<ContractType | null> {
    await connectDB();
    return await Contract.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }
    ).exec();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    await connectDB();
    const result = await Contract.deleteOne({ _id: id, userId }).exec();
    return result.deletedCount > 0;
  }
}
