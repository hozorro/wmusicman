import { openDialog } from "./wdialog";
import WAlert from "../components/WAlert.vue";

export const wAlert = async (message: string, detail: string = "", title: string = "Error") => {
  return await openDialog(WAlert, {
    title,
    contentProps: {message, detail}
  });
};
