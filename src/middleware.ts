import { Request, Response, NextFunction } from "express";
import PlayFabService, {IPlayFabTokenResponse} from "./library/playfab";
import RedisServices from "./library/redis";
import './types/interface'
import {PlayFabServer} from "playfab-sdk";

export const middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        /*const authHeader = req.headers["x-client-token"];
        if (!authHeader) {
            console.log("❌ No x-client-token header provided");
            return res.status(401).send("No token provided");
        }*/

        /*console.log(authHeader);
        // Jika formatnya "Bearer <token>", ambil tokennya
        const tokenParts = (Array.isArray(authHeader) ? authHeader[0] : authHeader).split(" ");
        const token = tokenParts.length === 2 ? tokenParts[1] : tokenParts[0];*/

        /*console.log("⚡ Validating client token:", token);

        const validateClientToken = await PlayFabService.validateTokenV2(token);

        if (!validateClientToken.data) {
            console.log(`❌ Client token validation failed: errorCode=${validateClientToken.errorCode}`);
            return res.status(401).send("Invalid or expired token");
        }

        if (!validateClientToken.data?.Entity) {
            console.log("❌ No entity data in token validation response");
            return res.status(401).send("Invalid token data");
        }

        // Assign entity ke request
        req.entity = {
            Id: validateClientToken.data.Entity.Id,
            Type: validateClientToken.data.Entity.Type!
        };*/
        /*req.entity = {
            Id: "ABC130B82A856382",//validateClientToken.data.Entity.Id,
            Type: "title_player_account",//validateClientToken.data.Entity.Type!
        };*/

        /*if (!req.entity.Id || !req.entity.Type) {
            console.log("❌ Entity Id or Type missing in token data");
            return res.status(401).send("Incomplete token entity");
        }

        console.log(`✅ Client token valid for Entity Id=${req.entity.Id}, Type=${req.entity.Type}`);*/

        console.log("⚡ Checking server token in Redis...");

        // Ambil server token dari Redis / refetch jika miss
        let serverToken = await RedisServices.getWithSwr<string>(
            "server-token",
            undefined,
            async () => {
                console.log("⚡ Server token missing → fetching new token...");
                const token = await PlayFabService.getToken();
                console.log(`✅ Got new server token: ${token.token}`);
                return token.token!;
            }
        );

        console.log("⚡ Validating server token...");
        let validate = await PlayFabService.validateToken(serverToken!);

        // Jika token expired
        if (validate.errorCode === 1335) {
            console.log("🔄 Server token expired → refreshing...");
            const newToken = await PlayFabService.getToken();
            serverToken = newToken.token!;
            await RedisServices.set("server-token", serverToken);
            console.log(`✅ Server token refreshed: ${serverToken}`);
        } else {
            console.log("✅ Server token valid");
        }

        const newToken = await PlayFabService.getToken();
        console.log(`✅ Server token refreshed: ${newToken}`);

        next();
    } catch (e: any) {
        console.error("❌ Middleware error:", e);
        res.status(500).send({ error: e.message });
    }
};

export const webhookMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("⚡ Checking server token in Redis...");

        // Ambil server token dari Redis / refetch jika miss
        let serverToken = await RedisServices.getWithSwr<string>(
            "server-token",
            undefined,
            async () => {
                console.log("⚡ Server token missing → fetching new token...");
                const token = await PlayFabService.getToken();
                console.log(`✅ Got new server token: ${token.token}`);
                return token.token!;
            }
        );

        console.log("⚡ Validating server token...");
        let validate = await PlayFabService.validateToken(serverToken!);

        // Jika token expired
        if (validate.errorCode === 1335) {
            console.log("🔄 Server token expired → refreshing...");
            const newToken = await PlayFabService.getToken();
            serverToken = newToken.token!;
            await RedisServices.set("server-token", serverToken);
            console.log(`✅ Server token refreshed: ${serverToken}`);
        } else {
            console.log("✅ Server token valid");
        }

        next();
    } catch (e: any) {
        console.error("❌ Middleware error:", e);
        res.status(500).send({ error: e.message });
    }
}