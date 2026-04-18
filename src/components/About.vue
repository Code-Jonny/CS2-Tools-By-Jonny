<script setup lang="ts">
  import Card from '@elements/Card.vue';
</script>

<template>

  <div class="about-container">

    <h1>About</h1>

    <Card title="About this app" icon="info-circle">
      <p>Version: <strong>2.0.2</strong></p>
      <p>Author: <strong>Code-Jonny</strong></p>
      <p>Website: <strong><a
             href="https://github.com/Code-Jonny/CS2-Tools-By-Jonny"
             target="_blank">github.com/Code-Jonny/CS2-Tools-By-Jonny</a></strong>
      </p>
    </Card>
  </div>
</template>

<style scoped>

  .about-container {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

</style>