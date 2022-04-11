import {
  DescribeCloudBaseRunServer,
  DescribeCloudBaseRunServers,
  DescribeWxCloudBaseRunEnvs,
} from "../api";
import * as inquirer from "inquirer";
import { execWithLoading } from "./loading";
import { VersionItems } from "../api/interface";

export async function chooseEnvId() {
  const { EnvList } = await execWithLoading(
    () => DescribeWxCloudBaseRunEnvs(),
    {
      startTip: "获取环境列表中...",
      failTip: "获取环境列表失败，请重试！",
    }
  );
  if (EnvList.length === 0) {
    throw new Error("您尚未创建任何环境，请先创建环境。");
  }
  const choices = EnvList.map(({ Alias, EnvId }) => {
    return {
      name: `${Alias} (${EnvId})`,
      value: EnvId,
    };
  });
  let responses = await inquirer.prompt([
    {
      name: "envId",
      message: "请选择环境",
      type: "list",
      choices,
    },
  ]);
  return responses.envId;
}

export async function chooseServiceId(envId: string) {
  const { CloudBaseRunServerSet } = await execWithLoading(
    () =>
      DescribeCloudBaseRunServers({
        EnvId: envId,
        Offset: 0,
        Limit: 30,
      }),
    {
      startTip: "获取服务列表中...",
      failTip: "获取服务列表失败，请重试！",
    }
  );
  if (CloudBaseRunServerSet.length === 0) {
    throw new Error("您尚未创建任何服务，请先创建服务。");
  }
  const choices = CloudBaseRunServerSet.map(({ ServerName }) => ({
    name: ServerName,
  }));
  let responses = await inquirer.prompt([
    {
      name: "serviceName",
      message: "请选择服务",
      type: "list",
      choices,
    },
  ]);
  return responses.serviceName;
}

/**
 * 选择服务下的版本
 */
export async function chooseVersionName({
  envId,
  serverName,
  versionList,
}: {
  envId?: string;
  serverName?: string;
  versionList?: VersionItems[];
}) {
  /**
   * 如果外面传入了VersionList，就用传入的作为选项列表；
   * 如果没传，则拉取全量的版本列表作为选项列表
   */
  let versionOptions;
  if (versionList) {
    versionOptions = versionList;
  } else {
    const { VersionItems } = await execWithLoading(
      () =>
        DescribeCloudBaseRunServer({
          EnvId: envId,
          ServerName: serverName,
          Offset: 0,
          Limit: 100,
        }),
      {
        startTip: "获取版本列表中...",
        failTip: "获取版本列表失败，请重试！",
      }
    );
    versionOptions = VersionItems;
  }

  if (versionOptions.length === 0) {
    throw new Error("该服务下暂无可用的版本，请创建新的版本。");
  }
  const choices = versionOptions.map(({ VersionName }) => ({
    name: VersionName,
  }));
  const responses = await inquirer.prompt([
    {
      name: "versionName",
      message: "请选择版本",
      type: "list",
      choices,
    },
  ]);
  return responses.versionName;
}
