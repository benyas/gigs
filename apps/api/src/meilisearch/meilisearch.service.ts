import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

export interface GigDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  status: string;
  categoryId: string;
  categoryName: string;
  cityId: string;
  cityName: string;
  providerName: string;
  createdAt: number;
}

const GIGS_INDEX = 'gigs';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;
  private readonly logger = new Logger(MeilisearchService.name);

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY || 'gigs_master_key',
    });
  }

  async onModuleInit() {
    try {
      await this.setupIndex();
    } catch (error) {
      this.logger.warn('Meilisearch not available, search will be limited');
    }
  }

  async setupIndex() {
    const index = this.client.index(GIGS_INDEX);

    await index.updateSettings({
      searchableAttributes: ['title', 'description', 'categoryName', 'cityName', 'providerName'],
      filterableAttributes: ['categoryId', 'cityId', 'basePrice', 'status'],
      sortableAttributes: ['basePrice', 'createdAt'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    });

    this.logger.log('Meilisearch gigs index configured');
  }

  async indexGig(doc: GigDocument) {
    const index = this.client.index(GIGS_INDEX);
    await index.addDocuments([doc]);
  }

  async indexGigs(docs: GigDocument[]) {
    const index = this.client.index(GIGS_INDEX);
    await index.addDocuments(docs);
  }

  async search(query: string, options?: {
    filter?: string[];
    sort?: string[];
    limit?: number;
    offset?: number;
  }) {
    const index = this.client.index(GIGS_INDEX);
    return index.search(query, {
      filter: options?.filter,
      sort: options?.sort,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });
  }

  async deleteGig(gigId: string) {
    const index = this.client.index(GIGS_INDEX);
    await index.deleteDocument(gigId);
  }

  getClient() {
    return this.client;
  }
}
