<template>
  <el-dialog
    title="自定义卡池"
    :visible.sync="visible"
    align="left"
    @close="resetForm"
  >
    <el-form :model="form" ref="formRef" :rules="formRules">
      <el-form-item label="描述" prop="desc" label-width="60px">
        <el-input v-model="form.desc" placeholder="请输入卡池描述"></el-input>
      </el-form-item>
      <el-divider></el-divider>
      <el-form-item>
        <el-form
          :model="itemForm"
          ref="itemFormRef"
          :rules="itemFormRules"
          :inline="true"
        >
          <el-form-item label="添加项目：">
            <el-form-item label="概率" prop="percent">
              <el-autocomplete
                class="detail-input"
                v-model="itemForm.percent"
                :fetch-suggestions="querySearchPercent"
              >
              </el-autocomplete
              >%
            </el-form-item>
            <el-form-item label="个数" prop="count">
              <el-autocomplete
                class="detail-input"
                v-model="itemForm.count"
                :fetch-suggestions="querySearchPositive"
              >
              </el-autocomplete>
            </el-form-item>
            <el-form-item label="保底(0为无保底)" prop="guarantee">
              <el-autocomplete
                class="detail-input"
                v-model="itemForm.guarantee"
                :fetch-suggestions="querySearchGuarantee"
              >
              </el-autocomplete>
            </el-form-item>
            <el-form-item>
              <el-tooltip class="item" effect="dark" content="添加">
                <el-button
                  type="primary"
                  @click="onAddItem"
                  icon="el-icon-plus"
                  circle
                  size="small"
                ></el-button>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="重置">
                <el-button
                  type="primary"
                  @click="resetForm"
                  icon="el-icon-refresh-left"
                  circle
                  size="small"
                ></el-button>
              </el-tooltip>
            </el-form-item>
          </el-form-item>
        </el-form>
      </el-form-item>
      <el-form-item prop="buildList">
        <el-table
          stripe
          border
          :data="form.buildList"
          empty-text="请在上方添加项目"
        >
          <el-table-column
            property="percent"
            label="概率"
            sortable
            :formatter="percentFormatter"
            :sort-method="percentComparator"
          ></el-table-column>
          <el-table-column
            property="count"
            label="个数"
            sortable
          ></el-table-column>
          <el-table-column
            property="guarantee"
            label="保底"
            sortable
            :formatter="guaranteeFormatter"
          ></el-table-column>
          <el-table-column label="操作" align="center">
            <template slot-scope="scope">
              <el-tooltip class="item" effect="dark" content="删除该项">
                <el-button
                  size="mini"
                  type="danger"
                  icon="el-icon-delete"
                  circle
                  @click="deleteItem(scope.row)"
                ></el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeDialog()">取消</el-button>
      <el-button type="primary" @click="submitForm()">添加</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  percentFormatter,
  guaranteeFormatter,
  percentComparator,
} from '../tools/formatters.js'
import {
  querySearchPercent,
  querySearchPositive,
  querySearchGuarantee,
} from '../tools/queries.js'
import { natrualNumber, positiveNumber, percentage } from '../tools/regex.js'
export default {
  name: 'CustomBuildInfoDialog',
  data() {
    return {
      visible: false,
      form: {
        desc: '',
        buildList: [],
      },
      formRules: {
        desc: {
          type: 'string',
          required: true,
          message: '描述不能为空',
          trigger: 'blur',
        },
        buildList: {
          type: 'array',
          required: true,
          fields: {
            0: {
              type: 'object',
              required: true,
              trigger: 'change',
            },
          },
          message: '卡池不能为空',
          trigger: 'change',
        },
      },
      itemForm: {
        count: '1',
        percent: '2',
        guarantee: '0',
      },
      itemFormRules: {
        count: {
          pattern: positiveNumber,
          required: true,
          message: '应为正数',
          trigger: 'change',
        },
        percent: {
          pattern: percentage,
          required: true,
          message: '应为百分号前的数值',
          trigger: 'change',
        },
        guarantee: {
          pattern: natrualNumber,
          required: true,
          message: '应为自然数',
          trigger: 'change',
        },
      },
    }
  },
  methods: {
    percentFormatter,
    guaranteeFormatter,
    percentComparator,
    querySearchPercent,
    querySearchPositive,
    querySearchGuarantee,
    openDialog(buildList = []) {
      this.form.buildList = buildList
      this.visible = true
    },
    closeDialog() {
      this.visible = false
    },
    resetForm() {
      this.$refs.formRef.resetFields()
      this.$refs.itemFormRef.resetFields()
    },
    async onAddItem() {
      try {
        await this.$refs.itemFormRef.validate()
        this.form.buildList.push({
          count: Number(this.itemForm.count),
          percent: this.itemForm.percent,
          guarantee: Number(this.itemForm.guarantee),
        })
      } catch (e) {
        // do nothing
      }
    },
    deleteItem(row) {
      this.form.buildList.splice(this.form.buildList.indexOf(row), 1)
    },
    async submitForm() {
      try {
        await this.$refs.formRef.validate()
        this.$emit('add-data', {
          desc: this.form.desc,
          buildList: this.form.buildList,
        })
        this.closeDialog()
      } catch (e) {
        // do nothing
      }
    },
  },
}
</script>

<style scoped>
.detail-input {
  width: 80px;
}
</style>
