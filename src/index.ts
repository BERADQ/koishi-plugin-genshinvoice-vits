import { Context, h, Schema } from "koishi";
import Vits from "@initencounter/vits";
import { Language, Voice } from "./list";

class GenshinVits extends Vits {
  constructor(ctx: Context, private config: GenshinVits.Config) {
    super(ctx);
    ctx.command("gsvits <content:text>", "语音生成", { checkArgCount: true })
      .alias("say")
      .action(async (_, t) => {
        if (/<.*\/>/gm.test(t)) return "输入的内容不是纯文本。";
        return await this.say({ input: t });
      });
  }
  async say(options: Vits.Result): Promise<h> {
    const { sdp_ratio, noise, noisew, length, language, text_prompt } =
      this.config;
    const speaker = typeof options.speaker_id === "number"
      ? Voice[options.speaker_id]
      : this.config.speaker;
    const payload = {
      data: [
        options.input,
        speaker,
        sdp_ratio,
        noise,
        noisew,
        length,
        language,
        null,
        text_prompt,
        "Text prompt",
        "",
        0.7,
      ],
      fn_index: 0,
    };
    const res = await this.ctx.http.post(
      "https://v2.genshinvoice.top/run/predict",
      payload,
    );
    return h.audio(`https://v2.genshinvoice.top/file=${res.data[1].name}`);
  }
}

namespace GenshinVits {
  export interface Config {
    language: string;
    speaker: string;
    sdp_ratio: number;
    noise: number;
    noisew: number;
    length: number;
    text_prompt: string;
  }
  export const Config: Schema<Config> = Schema.object({
    language: Schema.union(Language).default("ZH").description("语言"),
    speaker: Schema.union(Voice).default("派蒙_ZH").description("讲者"),
    sdp_ratio: Schema.number().min(0).max(1).step(0.1).default(0.5).description(
      "SDP/DP混合比",
    ),
    noise: Schema.number().min(0.1).max(2).step(0.1).default(0.6).description(
      "感情",
    ),
    noisew: Schema.number().min(0.1).max(2).step(0.1).default(0.9).description(
      "音素长度",
    ),
    length: Schema.number().min(0.1).max(2).step(0.1).default(1.0).description(
      "语速",
    ),
    text_prompt: Schema.string().default("Happy").description(
      "用文字描述生成风格。注意只能使用英文且首字母大写单词",
    ).hidden(),
  });
}

export default GenshinVits;
