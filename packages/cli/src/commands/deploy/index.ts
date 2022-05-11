import { Command, flags } from "@oclif/command";
import {
  tcbDescribeCloudBaseBuildService,
  tcbDescribeWxCloudBaseRunEnvs,
  tcbSubmitServerRelease,
} from "@wxcloud/cloudapi";
import * as CloudKit from "@wxcloud/cloudkit";
import { cli } from "cli-ux";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { uploadVersionPackage } from "../../api/files";
import { readLoginState } from "../../utils/auth";
import { chooseEnvId } from "../../utils/ux";
import { beginUpload } from "../storage/upload";

function extractCloudConfig(): CloudKit.CloudConfig {
  const cwd = process.cwd();
  const configFile = path.join(cwd, "wxcloud.config.js");
  if (existsSync(configFile)) {
    const config = require(configFile);
    return config;
  }
  return {
    type: "run",
    server: ",",
  };
}
export default class DeployCommand extends Command {
  static description = "Unified Deploy";

  static examples = [`wxcloud deploy`];

  static flags = {
    envId: flags.string({ char: "e", description: "环境ID" }),
    serviceName: flags.string({ char: "s", description: "服务名" }),
  };

  async run() {
    const { flags } = this.parse(DeployCommand);

    const envId = flags.envId || (await chooseEnvId());
    const serviceName =
      flags.serviceName || (await cli.prompt("请输入服务名称"));
    const env = await tcbDescribeWxCloudBaseRunEnvs({});
    const target = env.envList.find((env) => env.envId === envId);
    if (!target) {
      throw new Error(`环境 ${envId} 不存在`);
    }
    const cloudConfig = extractCloudConfig();
    console.log("[+] target static: ", target.staticStorages[0]?.staticDomain);
    const res = await CloudKit.execAllKits({
      fullPath: process.cwd(),
      config: cloudConfig,
      staticDomain: "https://" + target.staticStorages[0]?.staticDomain,
    });
    console.log("[+] kit result: ", res);
    if (res.runTarget) {
      // todo: check service exists
      const { uploadUrl, packageName, packageVersion } =
        await tcbDescribeCloudBaseBuildService({
          envId,
          serviceName: serviceName,
        });
      console.log("[+] uploading package");
      await uploadVersionPackage(uploadUrl, readFileSync(res.runTarget));
      console.log("[+] submitting package");
      const releaseRes = await tcbSubmitServerRelease({
        deployType: "package",
        envId,
        hasDockerfile: true,
        releaseType: "FULL",
        serverName: serviceName,
        dockerfile: "Dockerfile",
        wxAppId: (await readLoginState()).appid,
        packageName,
        packageVersion,
        port: 3000,
        versionRemark: "cloudkit",
      });
      console.log("[+] release result: ", releaseRes);
    }
    if (res.staticTarget) {
      console.log("[+] uploading static files");
      for (const [local, remote] of Object.entries(res.staticTarget)) {
        await beginUpload(local, target.staticStorages[0], remote, 5);
      }
    }
  }
}
