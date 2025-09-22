import * as z from "zod";

const currency = z.object({
    id: z.string().nonempty(),
    amount: z.number()
})

const currencies = z.object({
    entity: z.object({ // for debugging no production
        Id: z.string().nonempty(),
        Type: z.string().nonempty(),
    }),
    currencies: z.array(currency).nonempty(), // minimal 1 currency
})

export type Currency = z.infer<typeof currency>;
export type Currencies = z.infer<typeof currencies>;

export default currencies;