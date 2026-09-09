import { applicationErrors } from "@/server/domain/errors";
import { readCategories } from "./categories";
import { readExpenses } from "./expenses";
import { encodeRecord, sessionRedisOperation } from "./repository-helpers";

export async function deleteCategory(
  sessionId: string,
  categoryId: string,
): Promise<void> {
  await sessionRedisOperation(sessionId, async ({ redis, keys }) => {
    const [categories, expenses] = await Promise.all([
      readCategories(redis, keys),
      readExpenses(redis, keys),
    ]);
    if (!categories.some(({ id }) => id === categoryId)) {
      throw applicationErrors.categoryNotFound();
    }

    const transaction = redis.multi();
    for (const expense of expenses) {
      if (expense.categoryId === categoryId) {
        transaction.hset(keys.expenses, {
          [expense.id]: encodeRecord({ ...expense, categoryId: null }),
        });
      }
    }
    transaction.hdel(keys.categories, categoryId);
    await transaction.exec();
  });
}
