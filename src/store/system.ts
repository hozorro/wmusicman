import { defineStore } from "pinia";
import { ref } from "vue";
import { checkInitialized } from "@/apis/methods/manage";

export const useSystemStore = defineStore("system", () => {
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const checkError = ref(false);
  
  async function checkInit() {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      const { initialized } = await checkInitialized();
      isInitialized.value = initialized;
      isLoading.value = false;
    } catch (error) {
      checkError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function setInitialized() {
    isInitialized.value = true;
    checkError.value = false;
  }

  function reset() {
    isInitialized.value = false;
  }

  return { isInitialized, isLoading, checkError, checkInit, setInitialized, reset };
});