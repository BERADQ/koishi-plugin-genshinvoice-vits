import { Context, Schema, h } from "koishi";
import Vits from "@initencounter/vits";
import { Language, Voice } from "./list";

class GenshinVits extends Vits {
  constructor(ctx: Context, private config: GenshinVits.Config) {
    super(ctx)
    ctx.command("gsvits <content:text>", "语音生成")
      .alias("say")
      .action(async (v, t) => {
        return await this.say({ input: t });
      });
  }
  async say(options: Vits.Result): Promise<h> {
    const { config } = this;
    const url = `https://genshinvoice.top/api?speaker=${typeof options.speaker_id == "number"
      ? Voice[options.speaker_id]
      : config.speaker
      }&text=${options.input}&format=wav&language=${config.language}&length=${config.length
      }&noise=${config.noise}&noisew=${config.noisew}&sdp_ratio=${config.sdp_ratio
      }`;
    const res: Buffer = await this.ctx.http.get(url, { responseType: 'arraybuffer' });
    return h.audio(res, "audio/wav");
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
  }
  export const Config: Schema<Config> = Schema.object({
    language: Schema.union(Language),
    speaker: Schema.union(Voice),
    sdp_ratio: Schema.number().default(0.2).description("SDP/DP混合比"),
    noise: Schema.number().default(0.5).description("感情"),
    noisew: Schema.number().default(0.9).description("音素长度"),
    length: Schema.number().default(1.0).description("语速"),
  });
}

export default GenshinVits
