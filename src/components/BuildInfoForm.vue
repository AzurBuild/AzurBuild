<template>
  <el-main>
    <el-form :model="form" ref="formRef" :rules="formRules" :inline="true">
      <el-form-item label="添加图线">
        <el-form-item
          v-for="type in shipTypes"
          :key="type.name"
          :prop="type.name"
        >
          <el-autocomplete
            class="num-input"
            v-model="form[type.name]"
            size="mini"
            :fetch-suggestions="querySearchNatrual"
          >
          </el-autocomplete>
          {{ type.label }}
        </el-form-item>
      </el-form-item>
      <el-form-item>
        <el-tooltip class="item" effect="dark" content="添加">
          <el-button
            type="primary"
            @click="submitForm"
            icon="el-icon-plus"
            circle
            size="mini"
            :disabled="!canFormSubmit()"
          ></el-button>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="重置">
          <el-button
            type="primary"
            @click="resetForm"
            icon="el-icon-refresh-left"
            circle
            size="mini"
          ></el-button>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="自定义卡池">
          <el-button
            type="primary"
            icon="el-icon-more"
            circle
            size="mini"
            @click="openDetailedDialog"
          ></el-button>
        </el-tooltip>
      </el-form-item>
    </el-form>
    <custom-build-info-dialog ref="customBuildInfoDialog" @add-data="addData" />
  </el-main>
</template>

<script>
import { shipTypes } from '../data/shipTypes.js'
import { natrualNumber } from '../tools/regex.js'
import { generateBuildList } from '../tools/generateBuildList.js'
import { querySearchNatrual } from '../tools/queries.js'
import CustomBuildInfoDialog from './CustomBuildInfoDialog'
export default {
  name: 'BuildInfoForm',
  components: {
    CustomBuildInfoDialog,
  },
  data() {
    const data = {
      shipTypes,
      form: {},
      formRules: {},
    }
    for (const type of shipTypes) {
      data.form[type.name] = '0'
      data.formRules[type.name] = [
        {
          pattern: natrualNumber,
          required: true,
          message: '应为自然数',
          trigger: 'change',
        },
      ]
    }
    return data
  },
  methods: {
    querySearchNatrual,
    canFormSubmit() {
      let flag = false
      for (const type of shipTypes) {
        const val = this.form[type.name]
        if (!natrualNumber.test(val)) return false
        flag = flag || Number(val) > 0
      }
      return flag
    },
    addData(data) {
      this.$emit('add-data', data)
    },
    submitForm() {
      this.addData(generateBuildList(this.form))
    },
    resetForm() {
      this.$refs.formRef.resetFields()
    },
    openDetailedDialog() {
      this.$refs.customBuildInfoDialog.openDialog(
        generateBuildList(this.form).buildList,
      )
    },
  },
}
</script>

<style scoped>
.num-input {
  width: 50px;
}
</style>
