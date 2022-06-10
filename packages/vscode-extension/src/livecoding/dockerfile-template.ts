import * as os from 'os';

export function dockerfileNodemonTemplate(props: {
  from: string
  commands: string[]
  entrypoint: string[]
  watchDir: string
  watchExt: string
}) {
  return `# Auto-generated by weixin cloudbase vscode extension
FROM ccr.ccs.tencentyun.com/weixincloud/wxcloud-livecoding-toolkit:latest AS toolkit
${props.from}
COPY --from=toolkit nodemon /usr/bin/nodemon
${props.commands.join(os.EOL)}

CMD [ "nodemon", "-x", "${props.entrypoint.join(' ')}", "-w", "${props.watchDir}", "-e", "${props.watchExt}" ]`;
}

export function dockerfileTemplate(props: {
  from: string
  commands: string[]
  entrypoint: string[]
}) {
  return `# Auto-generated by weixin cloudbase vscode extension
${props.from}
${props.commands.join(os.EOL)}

CMD [ "${props.entrypoint.join('", "')}" ]`;
}
