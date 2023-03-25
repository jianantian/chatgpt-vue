<script setup lang="ts"></script>

<template>
  <Suspense>
    <keep-alive include="home">
      <RouterView />
    </keep-alive>
  </Suspense>
</template>

<!--
<keep-alive include="home">
    <router-view/>
 </keep-alive> -->

<style></style>
