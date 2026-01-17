import { getProjectionsAction } from '../projections';
import { getServerSession } from 'next-auth';
import { getProjectionService } from '@/services/serviceFactory';
import { ProjectionService } from '@/services/projections/ProjectionService';

jest.mock('next-auth');
jest.mock('@/services/serviceFactory');

describe('getProjectionsAction', () => {
  let mockProjectionService: jest.Mocked<ProjectionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectionService = {
      getProjections: jest.fn(),
    } as any;
    (getProjectionService as jest.Mock).mockReturnValue(mockProjectionService);
  });

  it('should throw error if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    await expect(getProjectionsAction('power')).rejects.toThrow('User not authenticated');
  });

  it('should return projections from service for authenticated user', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' }
    });
    
    const mockResult = {
      currentMonth: { actual: 100, projected: 50, estimatedTotal: 150, estimatedCost: 15, daysRemaining: 15 },
      year: { actualToDate: 1000, projectedRemainder: 500, estimatedTotal: 1500, estimatedCost: 150 }
    };
    
    mockProjectionService.getProjections.mockResolvedValue(mockResult);

    const result = await getProjectionsAction('power');
    
    expect(result).toEqual(mockResult);
    expect(mockProjectionService.getProjections).toHaveBeenCalledWith('user-1', 'power');
  });
});
