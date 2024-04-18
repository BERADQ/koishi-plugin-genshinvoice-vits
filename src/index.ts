import { Context, h, Schema, Quester } from "koishi";
import Vits from "@initencounter/vits";
import { Language, Voice } from "./list";
import { } from "@koishijs/plugin-help";

interface Predict {
  data: [
    string,
    {
      name: string,
      data: unknown,
      is_file: boolean,
      orig_name: string,
    },
  ],
  is_generating: boolean,
  duration: number,
  average_duration: number,
}

class GenshinVits extends Vits {
  static inject = {
    required: ['http']
  };
  constructor(ctx: Context, public config: GenshinVits.Config) {
    super(ctx);
    ctx.command("gsvits <content:text>", "语音生成", { checkArgCount: true, checkUnknown: true })
      .alias("say")
      .option("speaker", "--spkr [value:string]", { fallback: config.speaker })
      .option("language", "--lang [value:string]", { fallback: config.language, hidden: true })
      .option("length", "--len [value:number]", { fallback: config.length })
      .option("noise", "[value:number]", { fallback: config.noise })
      .option("noisew", "[value:number]", { fallback: config.noisew })
      .option("sdp_ratio", "--sdp [value:number]", { fallback: config.sdp_ratio })
      .option("text_prompt", "--prompt [value:string]", { fallback: config.text_prompt })
      .action(async ({ options }, input) => {
        if (/<.*\/>/gm.test(input)) return "输入的内容不是纯文本。";
        return await isay(this.ctx.http, options as Required<typeof options>, input);
      });
  }
  say(options: Vits.Result): Promise<h> {
    const speaker = typeof options.speaker_id === "number"
      ? Voice[options.speaker_id]
      : this.config.speaker;
    return isay(this.ctx.http, { ...this.config, speaker }, options.input);
  }
}

async function isay(
  http: Quester,
  config: GenshinVits.Config,
  input: string,
): Promise<h> {
  const { speaker, sdp_ratio, noise, noisew, length, language, text_prompt } =
    config;
  const payload = {
    data: [
      input,
      speaker,
      sdp_ratio,
      noise,
      noisew,
      length,
      language,
      false,
      1,
      0.2,
      null,
      text_prompt,
      "",
      0.7,
    ],
    fn_index: 0,
  };
  // 以前为 v2.genshinvoice.top
  const { data, duration } = await http.post<Predict>(
    "https://bv2.firefly.matce.cn/run/predict",
    payload,
  );
  const file = data[1].name.replaceAll("\\", "/");
  return h.audio(`https://bv2.firefly.matce.cn/file=${encodeURI(file)}`, { type: 'voice', duration });
}

namespace GenshinVits {
  export interface Config {
    language: string,
    speaker: string,
    sdp_ratio: number,
    noise: number,
    noisew: number,
    length: number,
    text_prompt: string,
  }
  export const Config: Schema<Config> = Schema.object({
    speaker: Schema.union(Voice).default("流萤_ZH").description("发言的角色。"),
    sdp_ratio: Schema.number().min(0).max(1).step(0.05).role("slider").default(
      0.5,
    ).description(
      "SDP 在合成时的占比，理论上此比率越高，合成的语音语调方差越大。",
    ),
    noise: Schema.number().min(0.1).max(2).step(0.05).role("slider").default(0.6)
      .description(
        "样本噪声，控制合成的随机性。",
      ),
    noisew: Schema.number().min(0.1).max(2).step(0.05).role("slider").default(
      0.9,
    ).description(
      "随机时长预测器噪声，控制音素发音长度。",
    ),
    length: Schema.number().min(0.1).max(2).step(0.05).role("slider").default(
      1,
    ).description(
      "调节语音长度，相当于调节语速，该数值越大语速越慢。",
    ),
    text_prompt: Schema.string().default("Happy").description(
      "用文字描述生成风格，注意只能使用英文且首字母大写单词。",
    ),
    language: Schema.union(Language).default("ZH").description("语言。").hidden(),
  });
}

export default GenshinVits;