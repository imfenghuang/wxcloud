import axios from "axios";
import { stat } from "fs";
import { cli } from "cli-ux";
import { createSign, readLoginState } from "../utils/auth";

export const BASE_URL = "https://servicewechat.com";

interface fetchApiOptions {
  skipSign?: boolean;
  params?: any;
  method?: any;
  wxCloudConfig?: {
    appid: string;
    privateKey: string;
  };
}

export async function getCloudRunCliRandStr(appid: string) {
  const config = {
    url: `${BASE_URL}/wxa-dev-qbase/getcloudrunclirandstr`,
    params: { appid },
  };
  //   console.log(config);
  const res = await axios.request(config);
  //   console.log(res.data);
  return res.data?.randstr;
}

export async function fetchApi(
  apiName: string,
  data: any,
  options: fetchApiOptions = {}
) {
  // todo: read local
  const appid = options.wxCloudConfig?.appid || (await readLoginState()).appid;
  const privateKey =
    options.wxCloudConfig?.privateKey || (await readLoginState()).privateKey;

  const headers: any = {
    "X-CloudRunCli-Robot": "1",
    "X-CloudRunCli-Key": privateKey,
  };
  const config = {
    url: `${BASE_URL}/${apiName}`,
    data,
    method: options.method || "POST",
    params: {
      autodev: 1,
      appid,
      ...options.params,
    },
    headers,
  };
  console.log(config);
  try {
    const res = await axios.request(config);
    console.log(res.data);
    return res.data;
  } catch (e) {
    console.log(e.response.headers, e.response.data);
  }
}
