import { Request, Response } from "express";
import currencies from "./schema";
import ExecuteInventoryOperationsRequest = PlayFabEconomyModels.ExecuteInventoryOperationsRequest;
import {PlayFabEconomy} from "playfab-sdk";

export const updateCurrency = async (req: Request, res: Response) => {
    try {
        const data = currencies.parse(req.body);

        const request: ExecuteInventoryOperationsRequest = {
            Entity: data.entity,
            Operations: data.currencies.map(currency => ({
                Add: {
                    Item: { Id: currency.id },
                    Amount: currency.amount,
                }
            }))
        }

        PlayFabEconomy.ExecuteInventoryOperations(request, (error, result) => {
            if(error) {
                return res.status(error.code).send(error)
            }

            return res.status(200).send(result)
        })
    } catch (e: any) {
        res.status(500).send(e.message);
    }
}