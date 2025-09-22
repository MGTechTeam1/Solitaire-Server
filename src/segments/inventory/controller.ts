import { Request, Response } from 'express'
import {inventories} from "./schema";
import ExecuteInventoryOperationsRequest = PlayFabEconomyModels.ExecuteInventoryOperationsRequest;
import {PlayFabEconomy} from "playfab-sdk";

export const updateInventory = async (req: Request, res: Response) => {
    try {
        const data = inventories.parse(req.body);

        const request: ExecuteInventoryOperationsRequest = {
            Entity: data.entity,
            Operations: data.items.map(item => ({
                [item.operationType]: {
                    Item: { Id: item.id },
                    Amount: item.amount,
                    ...(item.operationType === 'Subtract' ? { DeleteEmptyStacks: true } : {})
                }
            }))
        }

        PlayFabEconomy.ExecuteInventoryOperations(request, (error, result) => {
            if (error) {
                return res.status(error.code).send(error)
            }

            return res.status(200).send(result)
        })
    } catch (e: any) {
        res.status(500).send(e.message);
    }
}