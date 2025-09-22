import { Request, Response } from "express";
import {PlayFab, PlayFabClient, PlayFabProgression, PlayFabServer} from "playfab-sdk";
import IncrementStatisticVersionRequest = PlayFabProgressionModels.IncrementStatisticVersionRequest;
import {leaderboardReset, leaderboardUpdateEntity} from "./schema";
import RedisServices from "../../library/redis";
import DeleteStatisticsRequest = PlayFabProgressionModels.DeleteStatisticsRequest;
import UpdateStatisticsRequest = PlayFabProgressionModels.UpdateStatisticsRequest;
import GetStatisticsRequest = PlayFabProgressionModels.GetStatisticsRequest;
import {getRank} from "./functions";

//webhook
export const resetLeaderboard = async (req: Request, res: Response) => {
    try {
        //const data = leaderboardReset.parse(req.body);
        const data = {
            statistics: [
                "Bronze_1",
                "Bronze_2",
                "Bronze_3",
                "Bronze_4",

                "Silver_1",
                "Silver_2",
                "Silver_3",
                "Silver_4",

                "Gold_1",
                "Gold_2",
                "Gold_3",
                "Gold_4"
            ]
        }

        // Helper function untuk mengubah callback menjadi Promise
        const incrementStat = (statName: string) =>
            new Promise((resolve, reject) => {
                const request: IncrementStatisticVersionRequest = { Name: statName };
                PlayFabProgression.IncrementStatisticVersion(request, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
            });

        for (const stat of data.statistics) {
            await incrementStat(stat);
            console.log(`✅ Statistic version incremented: ${stat}`);
        }

        await RedisServices.set("statistic-reset-delay", 60 * 1000);

        res.status(200).send({ message: "All leaderboards reset successfully." });
    } catch (err: any) {
        console.error("❌ Failed to reset leaderboard:", err);
        res.status(500).send({ error: err.message || "Unknown error" });
    }
}

type League = {
    version: number;
    rankName: string;
    point: number;
}

export const updateLeaderboard = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { point, entity } = req.body;

        console.log("request: ", req.body);

        PlayFabServer.GetUserData({
            PlayFabId: id,
            Keys: ["League"]
        }, async (error, result) => {
            if (error) {
                return res.status(400).send(error);
            }

            const defaultLeague: League = {
                version: 0,
                rankName: getRank(0),
                point: 0
            }

            let league: League = defaultLeague

            if(result.data.Data && result.data.Data["League"]) {
                league = JSON.parse(result.data.Data["League"].Value as string) as League;
                console.log("league: ", league);
            }

            const currentVersion = await RedisServices.getWithSwr(
                "statistic-version",
                league.rankName,
                async () => {
                    return new Promise<number>((resolve, reject) => {
                        PlayFabProgression.GetStatisticDefinition({
                            Name: league.rankName
                        }, (error, result) => {
                            if (error) {
                                return reject("Version not available");
                            }

                            console.log("statistic version", result.data.Version, " - league", league.version)
                            resolve(result.data.Version)
                        })
                    })
                })

            if(currentVersion === null) {
                return res.status(400).send("Version not available");
            }

            if(league.version !== currentVersion) {
                league = {
                    ...defaultLeague,
                    version: currentVersion
                };
            }

            const currentRank = league.rankName;
            const nextPoint = Math.max(0, league.point + point);
            const requestRank = getRank(nextPoint);

            if(requestRank !== currentRank) {
                PlayFabProgression.GetStatistics({
                    Entity: entity
                }, (error, result) => {
                    if (error) {
                        return res.status(400).send(error);
                    }

                    console.log("result statistics: ", result);
                    const removeIds = Object.keys(result.data.Statistics ?? {}).filter(key => key !== requestRank);
                    console.log("removedRank", removeIds);

                    if(removeIds.length > 0) {
                        PlayFabProgression.DeleteStatistics({
                            Entity: entity,
                            Statistics: removeIds.map(key => ({
                                Name: key
                            }))
                        }, (error, result) => {
                            if (error) {
                                return res.status(400).send(error);
                            }

                            console.log("result delete:", JSON.stringify(result));
                        })
                    }
                })
            }

            PlayFabProgression.UpdateStatistics({
                Entity: entity,
                Statistics: [{
                    Name: requestRank,
                    Scores: [nextPoint.toString()]
                }]
            }, (error, result) => {
                if (error) {
                    return res.status(400).send(error);
                }
            })

            PlayFabServer.UpdateUserData({
                PlayFabId: id,
                Data: {
                    "League": JSON.stringify({
                        ...league,
                        rankName: requestRank,
                        point: nextPoint
                    })
                }
            }, (error, result) => {
                if(error) {
                    return res.status(400).send(error);
                }

                return res.status(200).send({
                    ...league,
                    rankName: requestRank,
                    point: nextPoint
                });
            })
        })
    } catch (e: any) {
        res.status(500).send(e.message);
    }
};