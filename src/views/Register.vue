<script setup lang="ts">
import { ref } from "vue";
import { register } from "@/apis/methods/manage";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref('');
const password = ref('');
const is_admin = ref(false);

function handleRegister() {
  register(username.value, password.value, is_admin.value).then(() => { 
    router.push('/login');
  });
}

</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <div class="login-logo">
        <div class="mark">
          <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
            <path d="M216.76,38.52a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,76.67V155.1A36,36,0,1,0,88,184V84.1l112-28v71A36,36,0,1,0,216,152V44A8,8,0,0,0,216.76,38.52Z"/>
          </svg>
        </div>
        <div>
          <div class="name">WMusic Manager</div>
          <div class="ver">音乐库管理系统</div>
        </div>
      </div>
      <h1>注册</h1>
      <p class="lead">创建账号以开始使用系统</p>
      <div class="login-form">
        <div class="input-group">
          <label>用户名</label>
          <input class="input" type="text" v-model="username" placeholder="请输入用户名"/>
        </div>
        <div class="input-group">
          <label>密码</label>
          <input class="input" type="password" v-model="password" placeholder="请输入密码"/>
        </div>
        <label class="check" for="is_admin">
          <input type="checkbox" id="is_admin" v-model="is_admin"/> 管理员
        </label>
        <button class="btn btn-primary login-btn" @click="handleRegister">注 册</button>
      </div>
      <div class="login-foot">
        已有账号？<router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>
