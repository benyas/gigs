import { UnauthorizedException } from '@nestjs/common';
import { CmiProvider } from '../payments/cmi.provider';

describe('CmiProvider', () => {
  let cmi: CmiProvider;

  beforeEach(() => {
    // Set a store key so hash generation works
    process.env.CMI_STORE_KEY = 'test-store-key';
    cmi = new CmiProvider();
  });

  afterEach(() => {
    delete process.env.CMI_STORE_KEY;
  });

  describe('parseCallback — signature verification', () => {
    it('should throw UnauthorizedException when hash does not match', () => {
      const body: Record<string, string> = {
        oid: 'GIG-booking1-123',
        ProcReturnCode: '00',
        mdStatus: '1',
        amount: '100.00',
        HASH: 'INVALID_HASH_VALUE',
        clientid: 'merchant',
      };

      expect(() => cmi.parseCallback(body)).toThrow(UnauthorizedException);
    });

    it('should accept callback with valid hash', () => {
      // Build a valid body and compute hash
      const body: Record<string, string> = {
        oid: 'GIG-booking1-123',
        ProcReturnCode: '00',
        mdStatus: '1',
        amount: '100.00',
        clientid: 'merchant',
      };

      // Generate the correct hash using the same algorithm
      const crypto = require('crypto');
      const sortedKeys = Object.keys(body)
        .filter((k) => k !== 'hash' && k !== 'HASH' && k !== 'encoding')
        .sort();
      const hashInput = sortedKeys.map((k) => body[k]).join('|');
      const validHash = crypto
        .createHmac('sha512', 'test-store-key')
        .update(hashInput)
        .digest('base64');

      body.HASH = validHash;

      const result = cmi.parseCallback(body);
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('GIG-booking1-123');
      expect(result.amount).toBe(100);
    });

    it('should return success=false for failed payment codes', () => {
      const body: Record<string, string> = {
        oid: 'GIG-booking2-456',
        ProcReturnCode: '05', // declined
        mdStatus: '0',
        amount: '200.00',
      };

      const result = cmi.parseCallback(body);
      expect(result.success).toBe(false);
    });
  });

  describe('refund', () => {
    it('should return success=false (manual processing required)', async () => {
      const result = await cmi.refund('GIG-booking1-123', 100);
      expect(result.success).toBe(false);
      expect(result.refundId).toContain('PENDING-REFUND-');
    });
  });
});

describe('PaymentsService — amount validation', () => {
  // We test the amount validation logic that was added to handleCallback
  it('should reject callback when amount differs from stored transaction', async () => {
    const { Test } = require('@nestjs/testing');
    const { PaymentsService } = require('../payments/payments.service');
    const { PrismaService } = require('../prisma/prisma.service');
    const { CmiProvider } = require('../payments/cmi.provider');
    const { getQueueToken } = require('@nestjs/bullmq');

    const mockQueue = { add: jest.fn() };
    const mockCmi = {
      parseCallback: jest.fn().mockReturnValue({
        orderId: 'GIG-b1-123',
        success: true,
        amount: 999.99, // mismatch: callback says 999.99
        rawData: {},
      }),
    };
    const mockPrisma = {
      transaction: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'tx-1',
          cmiOrderId: 'GIG-b1-123',
          amount: 100, // stored amount is 100
          status: 'pending',
          booking: { gig: { providerId: 'p1' } },
        }),
        update: jest.fn(),
        create: jest.fn(),
      },
      booking: { update: jest.fn() },
      wallet: { upsert: jest.fn() },
      $transaction: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CmiProvider, useValue: mockCmi },
        { provide: getQueueToken('notifications'), useValue: mockQueue },
      ],
    }).compile();

    const service = module.get(PaymentsService);
    const result = await service.handleCallback({ amount: '999.99' });

    expect(result.status).toBe('amount_mismatch');
    // Should NOT have updated the transaction to completed
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
