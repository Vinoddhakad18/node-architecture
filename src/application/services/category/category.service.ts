'use strict';

import { logger } from '@config/logger';
import Category, {
CategoryCreationAttributes,
} from '@models/category.model';
import categoryRepository from '@repositories/category.repository';

import { Transaction } from 'sequelize';

interface CategoryQueryOptions {
page?: number;
limit?: number;
search?: string;
status?: 'active' | 'inactive';
sortBy?: string;
sortOrder?: 'ASC' | 'DESC';
}

interface PaginatedResult<T> {
data: T[];
pagination: {
total: number;
page: number;
limit: number;
totalPages: number;
};
}

/**

* Category Service
  */
  class CategoryService {
  async create(
  data: CategoryCreationAttributes,
  userId?: number
  ): Promise<Category> {
  try {
  const result = await categoryRepository.withTransaction(
  async (transaction: Transaction) => {
  return categoryRepository.create(
  {
  ...data,
  created_by: userId || null,
  updated_by: userId || null,
  },
  { transaction }
  );
  }
  );

  logger.info('Category created successfully');
  return result;
  } catch (error) {
  logger.error('Error creating category:', error);
  throw error;
  }
  }

async findAll(
options: CategoryQueryOptions = {}
): Promise<PaginatedResult<Category>> {
try {
const {
page = 1,
limit = 10,
search,
status,
sortBy = 'id',
sortOrder = 'DESC',
} = options;

```
  const { rows, count } =
    await categoryRepository.findWithFilters(
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder
    );

  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
} catch (error) {
  logger.error(
    'Error fetching category list:',
    error
  );
  throw error;
}
```

}

async findById(
id: number
): Promise<Category | null> {
try {
return categoryRepository.findById(id);
} catch (error) {
logger.error(
`Error fetching category with id ${id}:`,
error
);
throw error;
}
}

async update(
id: number,
data: Partial<CategoryCreationAttributes>,
userId?: number
): Promise<Category | null> {
try {
const entity =
await categoryRepository.findById(id);

```
  if (!entity) {
    return null;
  }

  const updatedEntity =
    await categoryRepository.withTransaction(
      async (transaction: Transaction) => {
        await entity.update(
          {
            ...data,
            updated_by: userId || entity.updated_by,
          },
          { transaction }
        );

        return entity;
      }
    );

  logger.info(
    'Category updated successfully'
  );

  return updatedEntity;
} catch (error) {
  logger.error(
    `Error updating category with id ${id}:`,
    error
  );
  throw error;
}
```

}

async delete(
id: number,
userId?: number
): Promise<boolean> {
try {
const entity =
await categoryRepository.findById(id);

```
  if (!entity) {
    return false;
  }

  const result =
    await categoryRepository.softDelete(
      id,
      userId
    );

  if (result) {
    logger.info(
      'Category deleted successfully'
    );
  }

  return result;
} catch (error) {
  logger.error(
    `Error deleting category with id ${id}:`,
    error
  );
  throw error;
}
```

}

async findAllActive(): Promise<Category[]> {
try {
return categoryRepository.findAllActive();
} catch (error) {
logger.error(
'Error fetching active category:',
error
);
throw error;
}
}
}

export default new CategoryService();
