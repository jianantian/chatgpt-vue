<script setup lang="ts">
import type { ChatMessage } from "@/types";
import { ref, watch, nextTick, onMounted } from "vue";
import { chat } from "@/libs/gpt_bridge";
import cryptoJS from "crypto-js";
import Loading from "@/components/Loading.vue";
import Copy from "@/components/Copy.vue";
import { Cones } from "@icon-park/vue-next";

let apiKey = "";
let isConfig = ref(true);
let isTalking = ref(false);
let messageContent = ref("");
const chatListDom = ref<HTMLDivElement>();
const decoder = new TextDecoder("utf-8");
const roleAlias = { user: "ME", assistant: "Multivac", system: "System" };
const messageList = ref<ChatMessage[]>([
  {
    role: "system",
    content: "你是经过大量数据训练的大型语言模型, 尽可能简洁地回答.",
  },
  {
    role: "assistant",
    content: `你好, 我是 AI 语言模型, 我可以提供一些常用服务和信息, 例如:

1. 翻译: 我可以把中文翻译成英文, 英文翻译成中文, 还有其他一些语言翻译, 比如法语、日语、西班牙语等.

2. 咨询服务: 如果你有任何问题需要咨询, 例如健康、法律、投资等方面, 我可以尽可能为你提供帮助.

3. 闲聊: 如果你感到寂寞或无聊, 我们可以聊一些有趣的话题, 以减轻你的压力.

请告诉我你需要哪方面的帮助，我会根据你的需求给你提供相应的信息和建议.`,
  },
]);

onMounted(() => {
  if (getAPIKey()) {
    switchConfigStatus();
  }
});

const sendChatMessage = async (content: string = messageContent.value) => {
  try {
    isTalking.value = true;
    if (messageList.value.length === 2) {
      messageList.value.pop();
    }
    messageList.value.push({ role: "user", content });
    clearMessageContent();
    messageList.value.push({ role: "assistant", content: "" });

    const { body, status } = await chat(messageList.value, getAPIKey());
    if (body) {
      const reader = body.getReader();
      await readStream(reader, status);
    }
  } catch (error: any) {
    appendLastMessageContent(error);
  } finally {
    isTalking.value = false;
  }
};

const readStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  status: number
) => {
  const regex = /({.*?]})/g;
  const { done, value } = await reader.read();
  if (done) {
    reader.closed;
    return;
  }
  const decodeText = decoder.decode(value);
  const dataList = status === 200 ? decodeText.match(regex) : [decodeText];
  dataList?.forEach((v: any) => {
    const json = JSON.parse(v);
    console.log(json);
    let content = status === 200 ? json.choices[0].delta.content: json.error.message;
    content =
      (content === undefined) ? "": content;
    appendLastMessageContent(content);
  });
  await readStream(reader, status);
};

const appendLastMessageContent = (content: string) =>
  (messageList.value[messageList.value.length - 1].content += content);

const sendOrSave = () => {
  if (!messageContent.value.length) return;
  if (isConfig.value) {
    if (saveAPIKey(messageContent.value.trim())) {
      switchConfigStatus();
    }
    clearMessageContent();
  } else {
    sendChatMessage();
  }
};

const clickConfig = () => {
  if (!isConfig.value) {
    messageContent.value = getAPIKey();
  } else {
    clearMessageContent();
  }
  switchConfigStatus();
};

const getSecretKey = () => "multivac";

const saveAPIKey = (apiKey: string) => {
  const aesAPIKey = cryptoJS.AES.encrypt(apiKey, getSecretKey()).toString();
  localStorage.setItem("apiKey", aesAPIKey);
  return true;
};

const getAPIKey = () => {
  if (apiKey) return apiKey;
  const aesAPIKey = localStorage.getItem("apiKey") ?? "";
  apiKey = cryptoJS.AES.decrypt(aesAPIKey, getSecretKey()).toString(
    cryptoJS.enc.Utf8
  );
  return apiKey;
};

const switchConfigStatus = () => (isConfig.value = !isConfig.value);

const clearMessageContent = () => (messageContent.value = "");

const scrollToBottom = () => {
  if (!chatListDom.value) return;
  scrollTo(0, chatListDom.value.scrollHeight);
};

watch(messageList.value, () => nextTick(() => scrollToBottom()));
</script>

<template>
  <div class="flex flex-col h-screen">
    <div
      class="flex flex-nowrap fixed w-full items-baseline top-0 px-6 py-4 bg-gray-100"
    >
      <div class="text-2xl font-bold">Multivac</div>
      <div class="ml-4 text-sm text-gray-500">
        自然语言模型人工智能对话
      </div>
      <div
        class="ml-auto px-3 py-2 text-sm cursor-pointer hover:bg-white rounded-md"
        @click="clickConfig()"
      >
        设置
      </div>
    </div>

    <div class="flex-1 mx-2 mt-20 mb-2" ref="chatListDom">
      <div
        class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg"
        v-for="item of messageList.filter((v) => v.role !== 'system')"
      >
        <div class="flex justify-between items-center mb-2">
          <div class="font-bold">{{ roleAlias[item.role] }}: </div>
          <Copy class="invisible group-hover:visible" :content="item.content" />
        </div>
        <div>
          <pre
            class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed"
            v-if="item.content"
            >{{ item.content.replace(/^\n\n/, "") }}</pre
          >
          <Loading v-else />
        </div>
      </div>
    </div>

    <div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
      <div class="-mt-2 mb-2 text-sm text-gray-500" v-if="isConfig">
        请输入 API Key:
      </div>
      <div class="flex">
        <input
          class="input"
          :type="isConfig ? 'password' : 'text'"
          :placeholder="isConfig ? 'sk-xxxxxxxxxx' : '请输入'"
          v-model="messageContent"
          @keydown.enter="isTalking || sendOrSave()"
        />
        <button class="btn" :disabled="isTalking" @click="sendOrSave()">
          {{ isConfig ? "保存" : "发送" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
pre {
  font-family: -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
    "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB",
    "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN",
    "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti",
    SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
}
</style>
