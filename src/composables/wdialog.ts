import { createVNode, render, type Component } from "vue";
import WDialog from "@/components/WDialog.vue";

/**
 * 多层级弹窗
 */

let dialogZIndex = 10000; // 记录当前弹窗的层级，确保内层弹窗层级更高

export const openDialog = async <T>(content: Component, options = {}): Promise<T|null> => {
  return new Promise((resolve) => {
    // 每个弹窗创建一个独立的容器
    const container = document.createElement("div");
    container.className = "dialog-wrapper"
    container.style.zIndex = (dialogZIndex++).toString();
    document.body.appendChild(container);

    // 创建弹窗虚拟节点
    const vnode = createVNode(WDialog, {
      ...options,
      content,
      onClose: () => {
        render(null, container); // 销毁当前弹窗虚拟节点
        document.body.removeChild(container); // 销毁当前弹窗容器，避免DOM冗余
        dialogZIndex--; // 弹窗层级回退（避免无限递增）
        resolve(null);
      },
      onConfirm: (data: T) => {
        render(null, container);
        document.body.removeChild(container);
        dialogZIndex--;
        resolve(data);
      },
      onSelect: (data: T) => {
        render(null, container);
        document.body.removeChild(container);
        dialogZIndex--;
        resolve(data);
      },
    })
    render(vnode, container);
  })
}