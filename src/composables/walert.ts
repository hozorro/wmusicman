import { openDialog } from "./wdialog";
import WAlert from "../components/WAlert.vue";

export const wAlert = async (message: string, detail: string = "") => {
  return await openDialog(WAlert, {
    title: "Error",
    contentProps: {message, detail}
  });
};
