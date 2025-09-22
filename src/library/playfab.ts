import "dotenv/config";


// PlayFabServices.ts
import { PlayFabAuthentication } from "playfab-sdk";
import IPlayFabSettings = PlayFabModule.IPlayFabSettings;
import ValidateEntityTokenResponse = PlayFabAuthenticationModels.ValidateEntityTokenResponse;

/*PlayFabAuthentication.settings.titleId = process.env.PLAYFAB_TITLEID!;
PlayFabAuthentication.settings.developerSecretKey = process.env.PLAYFAB_SECRETKEY!;

const initializePlayfab = async () => {
    PlayFabAuthentication.GetEntityToken({}, (err, entityToken) => {
        if(err) {
            throw new Error(err.errorMessage)
        }

        console.log(JSON.stringify(entityToken));
    })
}

export default initializePlayfab*/

/*
const PlayFabServices = (() => {
    let economy: IPlayFabEconomy | null = null;
    let entity: GetEntityTokenResponse | null = null;

    interface InitResult {
        setting: IPlayFabSettings;
        entityToken: string;
    }

    const initialize = async (res: Response) => {
        if (!entity) {
            if (!process.env.PLAYFAB_SECRETKEY || !process.env.PLAYFAB_TITLEID) {
                throw new Error("PLAYFAB env vars missing (PLAYFAB_SECRETKEY, PLAYFAB_TITLEID)");
            }

            PlayFabAuthentication.settings.titleId = process.env.PLAYFAB_TITLEID;
            PlayFabAuthentication.settings.developerSecretKey = process.env.PLAYFAB_SECRETKEY;
            PlayFabAuthentication.GetEntityToken({}, (err, entityToken) => {
                if(err) {
                    return res.status(err.code).send(err)
                }

                entity = entityToken;
            })
        }

        return entity
    };

    const ensureEconomy = async (res: Response) => {
        await initialize(res);

        if (!economy) {
            economy = PlayFabEconomy;
        }

        return economy;
    };

    return {
        getEconomy: ensureEconomy,
    };
})();

export default PlayFabServices;*/

export interface IPlayFabTokenResponse {
    token: string | null | undefined;
    code: number;
    errorCode: number;
    message: string;
    data?: ValidateEntityTokenResponse
}

const PlayFabService = (() => {
    let setting: Omit<IPlayFabSettings, 'productionUrl' | 'verticalName'> | null = null;

    const ensureSetting = () => {
        if(!setting) {
            setting = {
                developerSecretKey: process.env.PLAYFAB_SECRETKEY!,
                titleId: process.env.PLAYFAB_TITLEID!
            }

            return setting;
        }

        return setting;
    }

    return {
        validateToken: async (token: string | undefined | null): Promise<IPlayFabTokenResponse> => {
            try {
                const setting = ensureSetting();
                PlayFabAuthentication.settings.titleId = setting.titleId;
                PlayFabAuthentication.settings.developerSecretKey = setting.developerSecretKey;

                return new Promise<IPlayFabTokenResponse>((resolve) => {
                    PlayFabAuthentication.ValidateEntityToken(
                        { EntityToken: token! },
                        (error, result) => {
                            if (error) {
                                console.error("❌ ValidateEntityToken error:", error);
                                resolve({
                                    token: null,
                                    code: error.code,
                                    errorCode: error.errorCode,
                                    message: error.errorMessage,
                                });
                            } else {
                                resolve({
                                    token: token!,
                                    code: result?.code ?? 200,
                                    errorCode: result?.errorCode ?? 0,
                                    message: result?.status ?? "OK",
                                    data: result.data
                                });
                            }
                        }
                    );
                });
            } catch (e: any) {
                return {
                    token: null,
                    code: 500,
                    errorCode: 500,
                    message: e.message,
                };
            }
        },
        validateTokenV2: async (token: string | undefined | null): Promise<IPlayFabTokenResponse> => {
            try {
                const setting = ensureSetting();
                const url = `https://${setting.titleId}.playfabapi.com/Authentication/ValidateEntityToken`;

                console.log("TitleId:", setting.titleId);
                console.log("SecretKey length:", setting.developerSecretKey?.length);
                console.log("Token (first 20 chars):", token?.substring(0, 20));
                console.log("URL:", url);

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-SecretKey": setting.developerSecretKey!, // hanya server yang boleh tahu
                    },
                    body: JSON.stringify({ EntityToken: token }),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error("❌ ValidateEntityToken error:", data);
                    return {
                        token: null,
                        code: response.status,
                        errorCode: data?.errorCode ?? 500,
                        message: data?.errorMessage ?? "Unknown error",
                    };
                }

                return {
                    token: token!,
                    code: response.status,
                    errorCode: data?.errorCode ?? 0,
                    message: data?.status ?? "OK",
                    data: data.data,
                };
            } catch (error: any) {
                console.error("❌ ValidateEntityToken exception:", error);
                return {
                    token: null,
                    code: 500,
                    errorCode: 500,
                    message: error.message,
                };
            }
        },

        getToken: async (): Promise<IPlayFabTokenResponse> => {
            try {
                const setting = ensureSetting();
                PlayFabAuthentication.settings.titleId = setting.titleId;
                PlayFabAuthentication.settings.developerSecretKey = setting.developerSecretKey;

                return new Promise<IPlayFabTokenResponse>((resolve) => {
                    PlayFabAuthentication.GetEntityToken({}, (error, result) => {
                        if (error) {
                            console.error("❌ GetEntityToken error:", error);
                            resolve({
                                token: null,
                                code: error.code,
                                errorCode: error.errorCode,
                                message: error.errorMessage,
                            });
                        } else {
                            resolve({
                                token: result.data.EntityToken,
                                code: result.code,
                                errorCode: result.errorCode ?? 0,
                                message: result.status,
                                data: result.data
                            });
                        }
                    });
                });
            } catch (e: any) {
                return {
                    token: null,
                    code: 500,
                    errorCode: 500,
                    message: e.message,
                };
            }
        }
    }
})();

export default PlayFabService