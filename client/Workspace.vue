<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { api, act } from "./api";
const props = defineProps(["user"]);
const polls = ref([]),
  question = ref("Hangi frontend aracını tercih edersin?"),
  options = ref("Vue\nReact\nAngular");
let events;
async function load() {
  polls.value = await api("/polls");
}
const total = (p) => p.results.reduce((n, r) => n + r.count, 0);
onMounted(async () => {
  await act(load, "");
  events = new EventSource("/api/events");
  events.addEventListener("poll", () => act(load, ""));
  events.onopen = () => act(load, "");
});
onUnmounted(() => events?.close());
</script>
<template>
  <form
    class="panel"
    @submit.prevent="
      act(async () => {
        await api('/polls', 'POST', {
          question,
          options: options.split('\n').filter(Boolean),
        });
        await load();
      })
    "
  >
    <h2>Canlı anket aç</h2>
    <div class="grid">
      <label>Soru<input v-model="question" required /></label
      ><label
        >Seçenekler · her satıra bir tane<textarea
          v-model="options"
          rows="3"
        ></textarea>
      </label>
    </div>
    <button>Anket oluştur</button>
  </form>
  <div class="grid">
    <section class="panel" v-for="p in polls">
      <h2>{{ p.question }}</h2>
      <span class="badge"
        >{{ p.open ? "Oylama açık" : "Kapalı" }} · {{ total(p) }} oy</span
      >
      <div v-for="r in p.results" class="card">
        <div class="toolbar">
          <strong>{{ r.label }}</strong
          ><span>{{ r.count }} oy</span
          ><button
            class="small"
            :disabled="!p.open || !!p.myVote"
            @click="
              act(async () => {
                await api('/polls/' + p.id + '/vote', 'POST', { option: r.id });
                await load();
              }, 'Oyun kaydedildi')
            "
          >
            {{ p.myVote === r.id ? "Seçimin" : "Oy ver" }}
          </button>
        </div>
        <div class="bar">
          <i
            :style="{
              width: (total(p) ? (r.count / total(p)) * 100 : 0) + '%',
            }"
          ></i>
        </div>
      </div>
      <button
        v-if="p.owner === props.user.id"
        class="ghost"
        @click="
          act(async () => {
            await api('/polls/' + p.id, 'PATCH', { open: !p.open });
            await load();
          })
        "
      >
        {{ p.open ? "Oylamayı kapat" : "Yeniden aç" }}
      </button>
    </section>
  </div>
</template>
