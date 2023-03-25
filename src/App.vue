<script setup lang="ts"></script>

<template>
  <!-- <Suspense>
    <RouterView />
  </Suspense> -->

  <keep-alive include="home">
    <RouterView />
  </keep-alive>
</template>

<!-- <keep-alive include="home">
    <RouterView />
 </keep-alive> -->

<style></style>
