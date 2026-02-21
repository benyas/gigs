import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { GigsService } from '../gigs/gigs.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';

describe('GigsService', () => {
  let service: GigsService;
  let prisma: Record<string, any>;
  let indexQueue: Record<string, any>;

  const mockGig = {
    id: 'gig-1',
    providerId: 'provider-1',
    categoryId: 'cat-1',
    title: 'Plombier Casablanca',
    slug: 'plombier-casablanca',
    description: 'Service de plomberie professionnel',
    basePrice: 200,
    cityId: 'city-1',
    status: 'active',
    provider: { profile: { name: 'Ahmed' } },
    category: { name: 'Plomberie', slug: 'plomberie' },
    city: { name: 'Casablanca' },
    media: [],
  };

  beforeEach(async () => {
    prisma = {
      gig: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      gigMedia: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    indexQueue = { add: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GigsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { uploadMultiple: jest.fn(), delete: jest.fn() } },
        { provide: MeilisearchService, useValue: { search: jest.fn() } },
        { provide: getQueueToken('gig-indexing'), useValue: indexQueue },
      ],
    }).compile();

    service = module.get<GigsService>(GigsService);
  });

  describe('findAll', () => {
    it('should return paginated gigs without search query', async () => {
      prisma.gig.findMany.mockResolvedValue([mockGig]);
      prisma.gig.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        perPage: 12,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.gig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });

    it('should filter by category and city', async () => {
      prisma.gig.findMany.mockResolvedValue([]);
      prisma.gig.count.mockResolvedValue(0);

      await service.findAll({
        categoryId: 'cat-1',
        cityId: 'city-1',
        page: 1,
        perPage: 12,
      });

      expect(prisma.gig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
            categoryId: 'cat-1',
            cityId: 'city-1',
          }),
        }),
      );
    });

    it('should filter by price range', async () => {
      prisma.gig.findMany.mockResolvedValue([]);
      prisma.gig.count.mockResolvedValue(0);

      await service.findAll({
        minPrice: 100,
        maxPrice: 500,
        page: 1,
        perPage: 12,
      });

      expect(prisma.gig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            basePrice: { gte: 100, lte: 500 },
          }),
        }),
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a gig with relations', async () => {
      prisma.gig.findUnique.mockResolvedValue(mockGig);

      const result = await service.findBySlug('plombier-casablanca');

      expect(result.title).toBe('Plombier Casablanca');
      expect(result.provider.profile?.name).toBe('Ahmed');
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      prisma.gig.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createData = {
      categoryId: 'cat-1',
      title: 'Electricien Rabat',
      description: 'Electricien professionnel',
      basePrice: 300,
      cityId: 'city-2',
    };

    it('should create a gig and queue indexing', async () => {
      prisma.gig.findUnique
        .mockResolvedValueOnce(null); // slug check — not taken
      prisma.gig.create.mockResolvedValue({
        id: 'new-gig',
        ...createData,
        slug: 'electricien-rabat',
        providerId: 'provider-1',
      });

      const result = await service.create('provider-1', createData);

      expect(result.id).toBe('new-gig');
      expect(indexQueue.add).toHaveBeenCalledWith('reindex-gig', { gigId: 'new-gig' });
    });

    it('should generate unique slug with counter if taken', async () => {
      prisma.gig.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // slug "electricien-rabat" taken
        .mockResolvedValueOnce(null); // slug "electricien-rabat-1" available
      prisma.gig.create.mockResolvedValue({
        id: 'new-gig',
        ...createData,
        slug: 'electricien-rabat-1',
      });

      await service.create('provider-1', createData);

      expect(prisma.gig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'electricien-rabat-1',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a gig owned by the provider', async () => {
      prisma.gig.findUnique.mockResolvedValue(mockGig);
      prisma.gig.update.mockResolvedValue({ ...mockGig, basePrice: 250 });

      const result = await service.update('gig-1', 'provider-1', { basePrice: 250 });

      expect(result.basePrice).toBe(250);
      expect(indexQueue.add).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not the owner', async () => {
      prisma.gig.findUnique.mockResolvedValue(mockGig);

      await expect(
        service.update('gig-1', 'other-provider', { basePrice: 250 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent gig', async () => {
      prisma.gig.findUnique.mockResolvedValue(null);

      await expect(
        service.update('fake-id', 'provider-1', { basePrice: 250 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('suggestions', () => {
    it('should return suggestions for valid query', async () => {
      prisma.gig.findMany.mockResolvedValue([
        { title: 'Plombier Pro', slug: 'plombier-pro', category: { name: 'Plomberie' }, city: { name: 'Casa' } },
      ]);

      const result = await service.suggestions('plom');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Plombier Pro');
    });

    it('should return empty array for short query', async () => {
      const result = await service.suggestions('p');
      expect(result).toEqual([]);
    });
  });
});
