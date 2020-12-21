<template>
  <div id="app">
    <Calculator id="calc" />
  </div>
</template>

<script>
import Calculator from './components/Calculator'

export default {
  name: 'app',
  components: {
    Calculator,
  },
}
</script>

<style>
body {
  margin: 0;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
html,
body,
#app,
#calc {
  height: 100%;
}
</style>
