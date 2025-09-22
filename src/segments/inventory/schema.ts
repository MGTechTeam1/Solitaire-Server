import * as z from 'zod';

const inventoryOperation = z.object({
    id: z.string(),
    operationType: z.enum(["Add", "Subtract"]),
    amount: z.number()
})

export const inventories =  z.object({
    entity: z.object({ // for development not production
        Id: z.string().nonempty(),
        Type: z.string().nonempty(),
    }),
    items: z.array(inventoryOperation)
})
