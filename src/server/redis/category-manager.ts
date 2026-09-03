import type { Redis } from "@upstash/redis";
import type { CategoriesResponse, CategoryDto } from "@/contracts/session-api";
import type { ServerConfig } from "@/server/config";
import {
  createCategoryRecord,
  toCategoriesResponse,
  type StoredCategory,
} from "@/server/domain/category-rules";
import { applicationErrors } from "@/server/domain/errors";
import { createId, parseId } from "@/server/ids";
import {
  encodeRecord,
  readCategories,
  readExpenses,
  repositoryOperation,
} from "./repository-helpers";

export class CategoryManager {
  constructor(
    private readonly redis: Redis,
    private readonly config: ServerConfig,
  ) {}

  async getCategories(sessionId: string): Promise<CategoriesResponse> {
    return repositoryOperation(this.config, sessionId, async (keys) => {
      const [categories, expenses] = await Promise.all([
        readCategories(this.redis, keys),
        readExpenses(this.redis, keys),
      ]);
      return toCategoriesResponse(categories, expenses);
    });
  }

  async createCategory(sessionId: string, name: string): Promise<CategoryDto> {
    return repositoryOperation(this.config, sessionId, async (keys) => {
      const category = createCategoryRecord(
        await readCategories(this.redis, keys),
        name,
        createId(),
      );
      await this.redis
        .multi()
        .hset(keys.categories, { [category.id]: encodeRecord(category) })
        .expire(keys.categories, this.config.sessionTtlSeconds)
        .exec();
      return { ...category, totalMinor: 0 };
    });
  }

  async replaceCategoriesForSeed(
    sessionId: string,
    fixture: ReadonlyArray<StoredCategory>,
  ): Promise<void> {
    await repositoryOperation(this.config, sessionId, async (keys) => {
      const validated = fixture.reduce<StoredCategory[]>((categories, item) => {
        const category = createCategoryRecord(
          categories,
          item.name,
          parseId(item.id),
        );
        if (category.color !== item.color)
          throw new Error("Invalid seed category color");
        return [...categories, category];
      }, []);
      await this.redis.del(keys.categories);
      if (validated.length === 0) return;
      const transaction = this.redis.multi();
      for (const category of validated) {
        transaction.hset(keys.categories, {
          [category.id]: encodeRecord(category),
        });
      }
      transaction.expire(keys.categories, this.config.sessionTtlSeconds);
      await transaction.exec();
    });
  }

  async deleteCategory(
    sessionId: string,
    unsafeCategoryId: string,
  ): Promise<void> {
    await repositoryOperation(this.config, sessionId, async (keys) => {
      const categoryId = parseId(unsafeCategoryId);
      const [categories, expenses] = await Promise.all([
        readCategories(this.redis, keys),
        readExpenses(this.redis, keys),
      ]);
      if (!categories.some(({ id }) => id === categoryId)) {
        throw applicationErrors.categoryNotFound();
      }

      const transaction = this.redis.multi();
      for (const expense of expenses) {
        if (expense.categoryId === categoryId) {
          transaction.hset(keys.expenses, {
            [expense.id]: encodeRecord({ ...expense, categoryId: null }),
          });
        }
      }
      transaction.hdel(keys.categories, categoryId);
      transaction.expire(keys.categories, this.config.sessionTtlSeconds);
      transaction.expire(keys.expenses, this.config.sessionTtlSeconds);
      await transaction.exec();
    });
  }
}
